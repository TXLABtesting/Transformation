// نطاقات المستخدم: مسارات متعددة للمنسق، وجهات متعددة، ووحدات/قطاعات وزارة
// شؤون مجلس الوزراء — كلها إسناد يتم من لوحة المشرف ويُقرأ في الجلسة.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertEntity, assertPermission, canAccessAllEntities } from '@/lib/security/rbac';
import { handleApiError, getIp } from '@/lib/security/http';
import { writeAuditLog } from '@/lib/security/audit';
import { jsonError, messages } from '@/lib/security/errors';
import { mocaUnitKey, readMocaUnits } from '@/lib/security/moca-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:view');
    const u = await prisma.user.findUnique({
      where: { id: params.id },
      include: { entityScopes: true, streamScopes: true },
    });
    if (!u) throw Object.assign(new Error('not-found'), { status: 404 });
    if (!canAccessAllEntities(actor)) assertEntity(actor, u.entityId);
    return NextResponse.json({
      streamScopes: u.streamScopes.map((s) => s.streamId),
      entityScopes: u.entityScopes.map((s) => s.entityId),
      mocaUnits: await readMocaUnits(params.id),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:update');
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw Object.assign(new Error('not-found'), { status: 404 });
    if (!canAccessAllEntities(actor)) assertEntity(actor, target.entityId);

    const body = (await req.json().catch(() => null)) as {
      streamScopes?: string[];
      entityScopes?: string[];
      mocaUnits?: string[]; // "unitId" أو "unitId::قطاع"
    } | null;
    if (!body) return jsonError('VALIDATION_ERROR', messages.validation, 400);

    const streamIds = Array.from(new Set((body.streamScopes || []).map((v) => String(v).trim()).filter(Boolean)));
    const entityIds = Array.from(new Set((body.entityScopes || []).map((v) => String(v).trim()).filter(Boolean)));
    // مشرف غير عام لا يوسّع نطاق مستخدم خارج جهته
    if (!canAccessAllEntities(actor)) {
      for (const id of entityIds) assertEntity(actor, id);
    }
    // مراجع غير موجودة تُرفض برسالة واضحة بدل خطأ قاعدة بيانات عام
    if (streamIds.length) {
      const found = await prisma.stream.count({ where: { id: { in: streamIds } } });
      if (found !== streamIds.length) return jsonError('BAD_REFERENCE', messages.badReference, 400);
    }
    if (entityIds.length) {
      const found = await prisma.entity.count({ where: { id: { in: entityIds } } });
      if (found !== entityIds.length) return jsonError('BAD_REFERENCE', messages.badReference, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.userStreamScope.deleteMany({ where: { userId: params.id } });
      if (streamIds.length) {
        await tx.userStreamScope.createMany({ data: streamIds.map((streamId) => ({ userId: params.id, streamId })) });
      }
      await tx.userEntityScope.deleteMany({ where: { userId: params.id } });
      if (entityIds.length) {
        await tx.userEntityScope.createMany({ data: entityIds.map((entityId) => ({ userId: params.id, entityId })) });
      }
      // المسار الأساسي يتبع أول مسار مسند حتى تبقى الجلسة متسقة
      await tx.user.update({ where: { id: params.id }, data: { streamId: streamIds[0] || null } });
      if (body.mocaUnits) {
        const units = Array.from(new Set(body.mocaUnits.map((v) => String(v).trim()).filter(Boolean)));
        await tx.setting.upsert({
          where: { key: mocaUnitKey(params.id) },
          update: { value: units.join('|') },
          create: { key: mocaUnitKey(params.id), value: units.join('|') },
        });
      }
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: 'user_scopes_updated',
          resourceType: 'user',
          resourceId: params.id,
          entityId: target.entityId,
          metadata: { streams: streamIds.length, entities: entityIds.length, mocaUnits: (body.mocaUnits || []).length },
          ipAddress: getIp(req),
          userAgent: req.headers.get('user-agent'),
        },
        tx
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
