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
// إضافة جهات دفعةً واحدة (مع منسقي مساراتها اختيارياً)
// ----------------------------------------------------------------------------
// كل صف: اسم الجهة وتصنيفها، ثم اسم المنسق وبريده لكل مسار إن وُجد.
// الجهة الموجودة لا تُكرَّر (تُحدَّث بتصنيفها وتُستكمل منسقوها)، والمنسق الجديد
// يُنشأ حسابه بدور منسق الجهة وتُرسل له دعوة ضبط كلمة المرور.
// ============================================================================

const COORD_ROLE = 'entity_coordinator';
const CATEGORIES = ['وزارة', 'هيئة اتحادية', 'أخرى'];
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const lower = (v: unknown) => clean(v).toLowerCase();

type InRow = {
  nameAr?: string;
  category?: string;
  coordinators?: { streamId?: string; name?: string; email?: string }[];
};

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'entities:update');
    assertPermission(actor, 'users:create');
    const body = (await req.json().catch(() => ({}))) as { rows?: InRow[] };
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : [];
    if (!rows.length) return NextResponse.json({ code: 'BAD_REQUEST', message: 'لا صفوف في الملف' }, { status: 400 });

    const streams = new Set((await prisma.stream.findMany({ select: { id: true } })).map((s) => s.id));
    const results: { name: string; entity: 'created' | 'exists' | 'duplicate' | 'invalid'; coordinators: number; invited: number; notes: string[] }[] = [];
    // تكرار داخل الملف نفسه: يُحتسب مرة واحدة ويُبلَّغ عن الباقي
    const seen = new Set<string>();

    for (const r of rows) {
      const dupKey = clean(r.nameAr);
      if (dupKey && seen.has(dupKey)) {
        results.push({ name: dupKey, entity: 'duplicate', coordinators: 0, invited: 0, notes: ['مكررة في الملف — أُضيفت مرة واحدة'] });
        continue;
      }
      if (dupKey) seen.add(dupKey);
      const nameAr = clean(r.nameAr);
      const notes: string[] = [];
      if (nameAr.length < 3) {
        results.push({ name: nameAr || '—', entity: 'invalid', coordinators: 0, invited: 0, notes: ['اسم الجهة غير صالح'] });
        continue;
      }
      const category = CATEGORIES.includes(clean(r.category)) ? clean(r.category) : 'أخرى';
      let entity = await prisma.entity.findUnique({ where: { nameAr } });
      let state: 'created' | 'exists' = 'exists';
      if (!entity) {
        entity = await prisma.entity.create({ data: { nameAr, category, sortOrder: 999, isActive: true } });
        state = 'created';
        await writeAuditLog({ actorUserId: actor.id, action: 'entity_create', resourceType: 'entity', resourceId: entity.id, metadata: { nameAr, bulk: true } });
      } else if (entity.category !== category && clean(r.category)) {
        entity = await prisma.entity.update({ where: { id: entity.id }, data: { category } });
      }

      let assigned = 0;
      let invited = 0;
      for (const c of r.coordinators || []) {
        const streamId = clean(c.streamId);
        const email = lower(c.email);
        if (!streamId || !email) continue;
        if (!streams.has(streamId)) { notes.push('مسار غير معروف: ' + streamId); continue; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { notes.push('بريد غير صحيح: ' + email); continue; }
        const name = clean(c.name) || email;
        const existing = await prisma.user.findUnique({ where: { email } });
        const user = await prisma.$transaction(async (tx) => {
          const u = existing
            ? await tx.user.update({ where: { id: existing.id }, data: { entityId: entity!.id, streamId: existing.streamId || streamId, name: clean(c.name) || existing.name } })
            : await tx.user.create({ data: { name, email, role: 'coord', entityId: entity!.id, streamId, status: 'pending', accessEnabled: false } });
          await assignRole(tx, u.id, COORD_ROLE);
          await tx.userStreamScope.createMany({ data: [{ userId: u.id, streamId }], skipDuplicates: true });
          await tx.userEntityScope.createMany({ data: [{ userId: u.id, entityId: entity!.id }], skipDuplicates: true });
          return u;
        });
        assigned++;
        if (!existing) {
          const iss = await issueInvite(user.id, { origin: appOrigin(req.url) });
          if (iss?.emailed) invited++;
          else notes.push('لم تُرسل دعوة ' + email + ' (البريد غير مهيأ)');
        }
      }
      results.push({ name: nameAr, entity: state, coordinators: assigned, invited, notes });
    }

    return NextResponse.json({
      results,
      summary: {
        created: results.filter((r) => r.entity === 'created').length,
        existing: results.filter((r) => r.entity === 'exists').length,
        duplicate: results.filter((r) => r.entity === 'duplicate').length,
        invalid: results.filter((r) => r.entity === 'invalid').length,
        coordinators: results.reduce((n, r) => n + r.coordinators, 0),
        invited: results.reduce((n, r) => n + r.invited, 0),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
