// نماذج المشاريع الاستراتيجية — يعبّئها الأعضاء وترسل لاعتماد اللجنة الوطنية
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertProjMember, canSeeProjects } from '@/lib/security/proj-access';
import { projFormToClient, type ProjFormRow } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const arr = (v: unknown) => (Array.isArray(v) ? v : []);

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    if (!canSeeProjects(u)) return NextResponse.json({ projForms: [] });
    const rows = await prisma.projForm.findMany({ orderBy: { createdAt: 'asc' }, take: 500 });
    return NextResponse.json({ projForms: rows.map((r) => projFormToClient(r as ProjFormRow)) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertProjMember(u);
    const b = (await req.json()) as Record<string, unknown>;
    const projId = String(b.projId || '').trim();
    if (!projId) return NextResponse.json({ error: 'proj-required' }, { status: 400 });
    const send = b.send === true;

    const data = {
      projId,
      ownerId: u.id,
      ownerName: String(b.owner || u.name || ''),
      entityResp: String(b.entityResp || ''),
      description: String(b.desc || ''),
      outputs: arr(b.outputs) as object,
      phases: arr(b.phases) as object,
      team: arr(b.team) as object,
      wf: send ? 'sent' : 'draft',
      retNote: send ? null : undefined,
      retAt: send ? null : undefined,
      log: arr(b.log) as object,
    };

    // مشروع واحد = نموذج واحد (قيد فريد على proj_id)
    const row = await prisma.projForm.upsert({
      where: { projId },
      update: data,
      create: data,
    });
    return NextResponse.json({ projForm: projFormToClient(row as ProjFormRow) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
