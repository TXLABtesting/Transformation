import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertEntity, assertPermission, canAccessAllEntities } from '@/lib/security/rbac';
import { handleApiError, getIp } from '@/lib/security/http';
import { writeAuditLog } from '@/lib/security/audit';
import { jsonError, messages } from '@/lib/security/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireAuthUser(req); assertPermission(actor, 'users:view');
    const u = await prisma.user.findUnique({ where: { id: params.id }, include: { roles: { include: { role: true } }, entityScopes: true, streamScopes: true } });
    if (!u) throw Object.assign(new Error('not-found'), { status: 404 });
    if (!canAccessAllEntities(actor)) assertEntity(actor, u.entityId);
    return NextResponse.json({ user: u });
  } catch (e) { return handleApiError(e); }
}

/**
 * حذف نهائي للحساب. أدواره ونطاقاته وإشعاراته تُحذف معه بالتتابع، وسجل
 * التدقيق يبقى بفاعل فارغ (onDelete: SetNull) فلا يضيع أثر ما جرى.
 * مقصور على الأدوار العامة، ولا يحذف المستخدم نفسه.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:disable');
    if (!canAccessAllEntities(actor)) throw Object.assign(new Error('forbidden'), { status: 403 });
    if (actor.id === params.id) return jsonError('VALIDATION_ERROR', messages.cannotDeleteSelf, 400);
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) throw Object.assign(new Error('not-found'), { status: 404 });
    await prisma.$transaction(async (tx) => {
      await writeAuditLog({ actorUserId: actor.id, action: 'user_deleted', resourceType: 'user', resourceId: params.id, entityId: existing.entityId, metadata: { email: existing.email }, ipAddress: getIp(req), userAgent: req.headers.get('user-agent') }, tx);
      await tx.setting.deleteMany({ where: { key: { in: ['moca_unit:' + params.id, 'proj_lead:' + params.id] } } });
      await tx.user.delete({ where: { id: params.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireAuthUser(req); assertPermission(actor, 'users:update');
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) throw Object.assign(new Error('not-found'), { status: 404 });
    if (!canAccessAllEntities(actor)) assertEntity(actor, existing.entityId);
    const body = await req.json().catch(() => ({})) as { name?: string; title?: string; phone?: string; entityId?: string; streamId?: string; role?: string; status?: string };
    if (!canAccessAllEntities(actor) && body.entityId && body.entityId !== existing.entityId) throw Object.assign(new Error('forbidden-scope'), { status: 403 });
    // السلسلة الفارغة تعني «إزالة الجهة/المسار» صراحةً — undefined تعني «بلا تغيير»
    // (كان مسح الجهة من المحرر لا يُحفظ أبداً لأن الفارغ لم يكن يُرسل أصلاً)
    const clearable = (v: string | undefined) => (v === '' ? null : v);
    if (body.entityId === '' && !canAccessAllEntities(actor)) throw Object.assign(new Error('forbidden-scope'), { status: 403 });
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id: params.id }, data: { name: body.name, title: body.title, phone: body.phone, entityId: clearable(body.entityId), streamId: clearable(body.streamId), role: body.role, status: body.status } });
      await writeAuditLog({ actorUserId: actor.id, action: 'user_updated', resourceType: 'user', resourceId: u.id, entityId: u.entityId, ipAddress: getIp(req), userAgent: req.headers.get('user-agent') }, tx);
      return u;
    });
    return NextResponse.json({ user: updated });
  } catch (e) { return handleApiError(e); }
}
