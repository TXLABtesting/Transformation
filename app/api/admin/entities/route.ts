import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertPermission, canAccessAllEntities } from '@/lib/security/rbac';
import { handleApiError } from '@/lib/security/http';
import { writeAuditLog } from '@/lib/security/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = ['وزارة', 'هيئة اتحادية', 'أخرى'];
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const bad = (message: string, status = 400) => NextResponse.json({ code: 'BAD_REQUEST', message }, { status });

/** سجل الجهات — القراءة بحسب نطاق المستخدم (الأدوار الشاملة ترى الكل) */
export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'entities:view');
    const ids = Array.from(new Set([u.entityId, ...u.entityScopes].filter(Boolean))) as string[];
    const where = canAccessAllEntities(u) ? {} : { id: { in: ids.length ? ids : ['__no_scope__'] } };
    const entities = await prisma.entity.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      include: { _count: { select: { items: true, users: true, services: true } } },
    });
    return NextResponse.json({ entities });
  } catch (e) {
    return handleApiError(e);
  }
}

/** إضافة جهة إلى السجل */
export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'entities:update');
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const nameAr = clean(body.nameAr);
    if (nameAr.length < 3) return bad('اسم الجهة مطلوب');
    const category = CATEGORIES.includes(clean(body.category)) ? clean(body.category) : 'أخرى';
    const exists = await prisma.entity.findUnique({ where: { nameAr } });
    if (exists) return bad('الجهة مسجَّلة مسبقاً' + (exists.isActive ? '' : ' (معطّلة — فعّلها بدل إضافتها)'), 409);
    const entity = await prisma.entity.create({
      data: { nameAr, category, sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 999, isActive: body.isActive !== false },
    });
    await writeAuditLog({ actorUserId: u.id, action: 'entity_create', resourceType: 'entity', resourceId: entity.id, metadata: { nameAr } });
    return NextResponse.json({ entity }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

/** تعديل جهة: الاسم أو التصنيف أو الترتيب أو تفعيلها/تعطيلها */
export async function PATCH(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'entities:update');
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = clean(body.id);
    if (!id) return bad('معرّف الجهة مطلوب');
    const row = await prisma.entity.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ code: 'NOT_FOUND', message: 'الجهة غير موجودة' }, { status: 404 });

    const data: { nameAr?: string; category?: string; sortOrder?: number; isActive?: boolean } = {};
    if (body.nameAr !== undefined) {
      const nameAr = clean(body.nameAr);
      if (nameAr.length < 3) return bad('اسم الجهة مطلوب');
      if (nameAr !== row.nameAr) {
        const clash = await prisma.entity.findUnique({ where: { nameAr } });
        if (clash) return bad('يوجد سجل آخر بالاسم نفسه', 409);
        data.nameAr = nameAr;
      }
    }
    if (body.category !== undefined && CATEGORIES.includes(clean(body.category))) data.category = clean(body.category);
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (!Object.keys(data).length) return NextResponse.json({ entity: row });

    const entity = await prisma.entity.update({ where: { id }, data });
    await writeAuditLog({ actorUserId: u.id, action: 'entity_update', resourceType: 'entity', resourceId: id, metadata: { before: row.nameAr, ...data } });
    return NextResponse.json({ entity });
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * حذف جهة — يُرفض ما دامت مرتبطة بمدخلات أو مستخدمين (تُعطَّل بدل حذفها حتى لا
 * تضيع بياناتها)؛ وجهة بلا ارتباط تُحذف نهائياً مع صفوف دليل خدماتها.
 */
export async function DELETE(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'entities:update');
    const id = clean(new URL(req.url).searchParams.get('id') || '');
    if (!id) return bad('معرّف الجهة مطلوب');
    const withServices = new URL(req.url).searchParams.get('withServices') === '1';
    const row = await prisma.entity.findUnique({
      where: { id },
      include: { _count: { select: { items: true, users: true, userScopes: true, services: true } } },
    });
    if (!row) return NextResponse.json({ code: 'NOT_FOUND', message: 'الجهة غير موجودة' }, { status: 404 });
    const linked = row._count.items + row._count.users + row._count.userScopes;
    if (linked > 0) {
      return NextResponse.json(
        {
          code: 'CONFLICT',
          message:
            'لا يمكن حذف الجهة لارتباطها ببيانات (' +
            [row._count.items && row._count.items + ' مدخلاً', row._count.users && row._count.users + ' مستخدماً']
              .filter(Boolean)
              .join(' و') +
            ') — عطّلها بدل حذفها فتختفي من القوائم وتبقى بياناتها.',
        },
        { status: 409 }
      );
    }
    // دليل خدمات مسجَّل للجهة: الحذف يمحوه معها، فيُطلب تأكيد صريح بذلك
    if (row._count.services > 0 && !withServices) {
      return NextResponse.json(
        {
          code: 'CONFIRM_REQUIRED',
          message: 'للجهة ' + row._count.services + ' خدمة في الدليل ستُحذف معها — أكّد الحذف أو عطّلها بدل ذلك.',
          services: row._count.services,
        },
        { status: 409 }
      );
    }
    await prisma.serviceCatalog.deleteMany({ where: { entityId: id } });
    await prisma.entityRep.deleteMany({ where: { entityId: id } });
    await prisma.streamOwner.deleteMany({ where: { entityId: id } });
    await prisma.entity.delete({ where: { id } });
    await writeAuditLog({ actorUserId: u.id, action: 'entity_delete', resourceType: 'entity', resourceId: id, metadata: { nameAr: row.nameAr } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
