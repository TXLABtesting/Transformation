// تعديل وحذف تعريف مشروع استراتيجي — للجنة الوطنية والمشرف
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertProjAdmin } from '@/lib/security/proj-access';
import { projDefToClient } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const u = await requireAuthUser(req);
    assertProjAdmin(u);
    const b = (await req.json()) as Record<string, unknown>;
    const row = await prisma.projDef.update({
      where: { id: params.id },
      data: {
        name: b.name !== undefined ? String(b.name) : undefined,
        lead: b.lead !== undefined ? String(b.lead) : undefined,
        member: b.member !== undefined ? String(b.member) : undefined,
        memberId: b.memberId !== undefined ? String(b.memberId || '').trim() || null : undefined,
        memberEmail: b.memberEmail !== undefined ? String(b.memberEmail || '').trim().toLowerCase() || null : undefined,
        startMonth: b.start !== undefined ? String(b.start) : undefined,
        endMonth: b.end !== undefined ? String(b.end) : undefined,
      },
    });
    return NextResponse.json({ projDef: projDefToClient(row as never) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const u = await requireAuthUser(req);
    assertProjAdmin(u);
    // النماذج المرتبطة تُحذف بالتتابع (onDelete: Cascade)
    await prisma.projDef.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
