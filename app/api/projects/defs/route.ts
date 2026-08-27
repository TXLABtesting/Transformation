// تعريفات المشاريع الاستراتيجية — تنشئها اللجنة الوطنية وتسندها إلى القادة
// وأعضائهم. الأعضاء يقرأونها لتعبئة نماذجها.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertProjAdmin, canSeeProjects } from '@/lib/security/proj-access';
import { projDefToClient, type ProjDefRow } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    if (!canSeeProjects(u)) return NextResponse.json({ projDefs: [] });
    const rows = await prisma.projDef.findMany({ orderBy: { createdAt: 'asc' }, take: 500 });
    return NextResponse.json({ projDefs: rows.map((r) => projDefToClient(r as ProjDefRow)) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertProjAdmin(u);
    const b = (await req.json()) as Record<string, unknown>;
    const name = String(b.name || '').trim();
    if (!name) return NextResponse.json({ error: 'name-required' }, { status: 400 });
    const row = await prisma.projDef.create({
      data: {
        name,
        lead: String(b.lead || ''),
        member: String(b.member || ''),
        startMonth: String(b.start || ''),
        endMonth: String(b.end || ''),
        createdById: u.id,
      },
    });
    return NextResponse.json({ projDef: projDefToClient(row as ProjDefRow) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
