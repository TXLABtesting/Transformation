// أعضاء المشاريع الاستراتيجية من صفحة اللجنة: قائمة المسجلين للاختيار منهم،
// أو إنشاء حساب جديد بالبريد مباشرة عند إسناد مشروع — بدور العضو ومقيّداً
// بقائده، مفعّلاً ليدخل عبر UAE PASS فور تسجيله.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError, getIp } from '@/lib/security/http';
import { jsonError, messages } from '@/lib/security/errors';
import { writeAuditLog } from '@/lib/security/audit';
import { assertProjAdmin, PROJ_MEMBER_ROLE } from '@/lib/security/proj-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertProjAdmin(u);
    const rows = await prisma.user.findMany({
      where: { roles: { some: { role: { code: PROJ_MEMBER_ROLE } } } },
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, name: true, email: true },
    });
    const leads = await prisma.projMemberLead.findMany({ take: 1000 });
    const leadOf = new Map(leads.map((l) => [l.userId, l.lead]));
    return NextResponse.json({
      members: rows.map((r) => ({ id: r.id, name: r.name, email: r.email || '', lead: leadOf.get(r.id) || '' })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertProjAdmin(actor);
    const b = (await req.json().catch(() => null)) as { email?: string; name?: string; lead?: string } | null;
    const email = String(b?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return jsonError('VALIDATION_ERROR', messages.validation, 400);
    }
    const name = String(b?.name || '').trim() || email.split('@')[0];
    const lead = String(b?.lead || '').trim();

    const role = await prisma.role.findUnique({ where: { code: PROJ_MEMBER_ROLE } });
    if (!role) return jsonError('BAD_REFERENCE', messages.badReference, 400);

    const existing = await prisma.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
    const result = await prisma.$transaction(async (tx) => {
      let userId: string;
      let created = false;
      let outName: string;
      if (existing) {
        // حساب قائم بأي دور: يُستخدم كما هو دون المساس بدوره أو جهته
        userId = existing.id;
        outName = existing.name;
      } else {
        const nu = await tx.user.create({
          data: { name, email, role: 'proj', status: 'active', accessEnabled: true },
        });
        await tx.userRole.create({ data: { userId: nu.id, roleId: role.id } });
        userId = nu.id;
        outName = nu.name;
        created = true;
      }
      // إسناد القائد يُثبت (أو يُحدّث) مع الإسناد للمشروع
      if (lead) {
        await tx.projMemberLead.upsert({ where: { userId }, update: { lead }, create: { userId, lead } });
      }
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: created ? 'proj_member_created' : 'proj_member_linked',
          resourceType: 'user',
          resourceId: userId,
          metadata: { email, lead },
          ipAddress: getIp(req),
          userAgent: req.headers.get('user-agent'),
        },
        tx
      );
      return { userId, created, name: outName };
    });
    return NextResponse.json(
      { member: { id: result.userId, name: result.name, email, lead }, created: result.created },
      { status: result.created ? 201 : 200 }
    );
  } catch (e) {
    return handleApiError(e);
  }
}
