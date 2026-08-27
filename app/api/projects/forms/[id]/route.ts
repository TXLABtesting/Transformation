// اعتماد نموذج مشروع أو إعادته بملاحظات (اللجنة الوطنية)، وحذف المسودة (العضو)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { isGlobalRole } from '@/lib/security/rbac';
import { assertProjMember } from '@/lib/security/proj-access';
import { projFormToClient } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const u = await requireAuthUser(req);
    const b = (await req.json()) as Record<string, unknown>;
    const action = String(b.action || '');

    if (action === 'approve' || action === 'return') {
      // الاعتماد والإعادة من اللجنة الوطنية والمشرف فقط
      if (!isGlobalRole(u)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      if (action === 'approve') {
        const row = await prisma.projForm.update({
          where: { id: params.id },
          data: { wf: 'approved', retNote: null, retAt: null },
        });
        return NextResponse.json({ projForm: projFormToClient(row as never) });
      }
      const note = String(b.note || '').trim();
      if (!note) return NextResponse.json({ error: 'note-required' }, { status: 400 });
      const row = await prisma.projForm.update({
        where: { id: params.id },
        data: { wf: 'draft', retNote: note, retAt: new Date() },
      });
      return NextResponse.json({ projForm: projFormToClient(row as never) });
    }

    assertProjMember(u);
    return NextResponse.json({ error: 'bad-action' }, { status: 400 });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const u = await requireAuthUser(req);
    assertProjMember(u);
    const row = await prisma.projForm.findUnique({ where: { id: params.id }, select: { wf: true } });
    if (!row) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    if (row.wf === 'approved') return NextResponse.json({ error: 'approved-locked' }, { status: 409 });
    await prisma.projForm.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
