import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertEntity, assertPermission, canAccessAllEntities } from '@/lib/security/rbac';
import { handleApiError, getIp } from '@/lib/security/http';
import { jsonError, messages } from '@/lib/security/errors';
import { writeAuditLog } from '@/lib/security/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    assertPermission(user, 'users:view');
    const where = canAccessAllEntities(user) ? {} : { OR: [{ entityId: user.entityId }, { entityScopes: { some: { entityId: { in: user.entityScopes } } } }] };
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { roles: { include: { role: true } }, entityScopes: true, streamScopes: true, entity: true, stream: true },
    });
    // إسناد وحدات وزارة شؤون مجلس الوزراء يُقرأ دفعة واحدة من جدول الإعدادات
    const unitRows = await prisma.setting.findMany({ where: { key: { startsWith: 'moca_unit:' } } });
    const unitsByUser = new Map(unitRows.map((r) => [r.key.slice('moca_unit:'.length), String(r.value || '').split('|').map((v) => v.trim()).filter(Boolean)]));
    return NextResponse.json({ users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, accessEnabled: u.accessEnabled,
      entityId: u.entityId, streamId: u.streamId, entity: u.entity?.nameAr, stream: u.stream?.nameAr,
      roles: u.roles.map((r) => ({ id: r.role.id, code: r.role.code, nameAr: r.role.nameAr })),
      entityScopes: u.entityScopes.map((s) => s.entityId), streamScopes: u.streamScopes.map((s) => s.streamId),
      mocaUnits: unitsByUser.get(u.id) || [],
      lastLoginAt: u.lastLogin, createdAt: u.createdAt,
    })) });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:create');
    const body = await req.json().catch(() => null) as { name?: string; email?: string; role?: string; entityId?: string; streamId?: string } | null;
    if (!body?.email || !body?.name) return jsonError('VALIDATION_ERROR', messages.validation, 400);
    const email = body.email.trim().toLowerCase();
    // «بدون جهة» يبقى بلا جهة: المشرف العام لا تُلصق جهته هو بالحساب الجديد
    // (كانت جهة المشرف تُورَّث صمتاً فيظهر فريق المسار تحت وزارة المشرف).
    // المشرف المحصور بجهة يبقى داخل جهته كما كان.
    const entityId = body.entityId || (canAccessAllEntities(actor) ? undefined : actor.entityId) || undefined;
    if (!canAccessAllEntities(actor)) assertEntity(actor, entityId);
    // فحوص مسبقة برسائل مفهومة بدل خطأ قاعدة بيانات عام:
    // بريد مكرر، أو جهة/مسار غير موجودين في قاعدة البيانات
    const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (clash) return jsonError('DUPLICATE', messages.duplicateEmail, 409);
    if (entityId && !(await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true } }))) {
      return jsonError('BAD_REFERENCE', messages.badReference, 400);
    }
    if (body.streamId && !(await prisma.stream.findUnique({ where: { id: body.streamId }, select: { id: true } }))) {
      return jsonError('BAD_REFERENCE', messages.badReference, 400);
    }
    const created = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { name: body.name!, email, role: body.role || 'entity', entityId, streamId: body.streamId || null, status: 'pending', accessEnabled: false } });
      await writeAuditLog({ actorUserId: actor.id, action: 'user_created', resourceType: 'user', resourceId: u.id, entityId, ipAddress: getIp(req), userAgent: req.headers.get('user-agent') }, tx);
      return u;
    });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (e) { return handleApiError(e); }
}
