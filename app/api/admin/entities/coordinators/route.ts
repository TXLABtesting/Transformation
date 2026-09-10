import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertPermission } from '@/lib/security/rbac';
import { handleApiError } from '@/lib/security/http';
import { writeAuditLog } from '@/lib/security/audit';
import { assignRole } from '@/lib/security/user-access';
import { issueInvite, appOrigin } from '@/lib/security/invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// منسقو المسارات في الجهات — لكل جهة منسق لكل مسار
// ----------------------------------------------------------------------------
// المنسق حساب مستخدم بدور entity_coordinator مسنَد إلى جهته، ونطاق مساراته
// (user_stream_scopes) يحدد المسار الذي ينسّقه. تعيين منسق جديد يُنشئ حسابه
// ويرسل له دعوة ضبط كلمة المرور؛ وإلغاء التعيين يزيل نطاق المسار فقط ويُبقي
// الحساب كما هو.
// ============================================================================

const COORD_ROLE = 'entity_coordinator';
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const lower = (v: unknown) => clean(v).toLowerCase();
const bad = (message: string, status = 400) => NextResponse.json({ code: 'BAD_REQUEST', message }, { status });

type CoordRow = { entityId: string; streamId: string; userId: string; name: string; email: string; active: boolean; pending: boolean };

/** كل المنسقين مرتبين حسب (الجهة، المسار) */
export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'users:view');
    const users = await prisma.user.findMany({
      where: { roles: { some: { role: { code: COORD_ROLE } } }, entityId: { not: null } },
      include: { streamScopes: true },
    });
    const rows: CoordRow[] = [];
    for (const usr of users) {
      const streams = Array.from(new Set([usr.streamId, ...usr.streamScopes.map((s) => s.streamId)].filter(Boolean))) as string[];
      for (const streamId of streams) {
        rows.push({
          entityId: usr.entityId as string,
          streamId,
          userId: usr.id,
          name: usr.name || '',
          email: usr.email || '',
          active: usr.accessEnabled,
          pending: !usr.passwordHash,
        });
      }
    }
    return NextResponse.json({ coordinators: rows });
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * تعيين منسق لمسار في جهة.
 * body: { entityId, streamId, name, email }  — بريد موجود يُسنَد كما هو،
 * وبريد جديد يُنشأ له حساب وتُرسل دعوته.
 */
export async function PUT(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:create');
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const entityId = clean(body.entityId);
    const streamId = clean(body.streamId);
    const email = lower(body.email);
    const name = clean(body.name);
    if (!entityId || !streamId) return bad('الجهة والمسار مطلوبان');
    if (!/^\S+@\S+\.\S+$/.test(email)) return bad('البريد الإلكتروني غير صحيح');
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) return bad('الجهة غير موجودة', 404);
    if (!(await prisma.stream.findUnique({ where: { id: streamId } }))) return bad('المسار غير موجود', 404);

    const existing = await prisma.user.findUnique({ where: { email }, include: { streamScopes: true } });
    let created = false;
    const user = await prisma.$transaction(async (tx) => {
      let u = existing;
      if (!u) {
        u = await tx.user.create({
          data: { name: name || email, email, role: 'coord', entityId, streamId, status: 'pending', accessEnabled: false },
          include: { streamScopes: true },
        });
        created = true;
      } else {
        u = await tx.user.update({
          where: { id: u.id },
          data: { entityId, streamId: u.streamId || streamId, ...(name ? { name } : {}) },
          include: { streamScopes: true },
        });
      }
      await assignRole(tx, u.id, COORD_ROLE);
      await tx.userStreamScope.createMany({ data: [{ userId: u.id, streamId }], skipDuplicates: true });
      await tx.userEntityScope.createMany({ data: [{ userId: u.id, entityId }], skipDuplicates: true });
      return u;
    });

    let invite: { link: string; emailed: boolean } | null = null;
    if (created) {
      const iss = await issueInvite(user.id, { origin: appOrigin(req.url) });
      if (iss) invite = { link: iss.link, emailed: iss.emailed };
    }
    await writeAuditLog({
      actorUserId: actor.id,
      action: created ? 'coordinator_created' : 'coordinator_assigned',
      resourceType: 'user',
      resourceId: user.id,
      entityId,
      metadata: { streamId, email },
    });
    return NextResponse.json({ userId: user.id, created, invite });
  } catch (e) {
    return handleApiError(e);
  }
}

/** إلغاء تعيين منسق عن مسار (يبقى حسابه) */
export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:update');
    const sp = new URL(req.url).searchParams;
    const userId = clean(sp.get('userId'));
    const streamId = clean(sp.get('streamId'));
    if (!userId || !streamId) return bad('المستخدم والمسار مطلوبان');
    await prisma.userStreamScope.deleteMany({ where: { userId, streamId } });
    const left = await prisma.userStreamScope.findMany({ where: { userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { streamId: left[0]?.streamId ?? null },
    });
    await writeAuditLog({ actorUserId: actor.id, action: 'coordinator_unassigned', resourceType: 'user', resourceId: userId, metadata: { streamId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
