// إسناد أعضاء المشاريع الاستراتيجية إلى قادتهم — جدول ربط مستقل، بلا أي
// عمود جديد على جدول المستخدمين. الإدارة من لوحة المشرف.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertPermission } from '@/lib/security/rbac';
import { canSeeProjects } from '@/lib/security/proj-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    if (!canSeeProjects(u) && !u.permissions.includes('users:view')) {
      return NextResponse.json({ memberLeads: {} });
    }
    const rows = await prisma.projMemberLead.findMany({ take: 1000 });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.userId] = r.lead;
    return NextResponse.json({ memberLeads: map });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'users:update');
    const b = (await req.json()) as { userId?: string; lead?: string };
    const userId = String(b.userId || '').trim();
    if (!userId) return NextResponse.json({ error: 'user-required' }, { status: 400 });
    const lead = String(b.lead || '').trim();
    if (!lead) {
      await prisma.projMemberLead.deleteMany({ where: { userId } });
      return NextResponse.json({ ok: true });
    }
    await prisma.projMemberLead.upsert({
      where: { userId },
      update: { lead },
      create: { userId, lead },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
