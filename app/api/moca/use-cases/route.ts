// حالات الاستخدام في وزارة شؤون مجلس الوزراء — إنشاؤها من المدخلات المعتمدة
// وتسجيل تحديثاتها. اللجنة والمشرف يطّلعون، ومنسق الوحدة يكتب.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertMocaView, mocaUnitScopeOf } from '@/lib/security/moca-access';
import { isGlobalRole } from '@/lib/security/rbac';
import { mocaUseCaseToClient, type MocaUseCaseRow } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertMocaView(u);
    const scope = mocaUnitScopeOf(u);
    const where = isGlobalRole(u) || !scope
      ? {}
      : scope.unitSector
        ? { unitId: scope.unitId, unitSector: scope.unitSector }
        : { unitId: scope.unitId };
    const rows = await prisma.mocaUseCase.findMany({ where, orderBy: { createdAt: 'desc' }, take: 2000 });
    return NextResponse.json({ useCases: rows.map((r) => mocaUseCaseToClient(r as MocaUseCaseRow)) });
  } catch (e) {
    return handleApiError(e);
  }
}

