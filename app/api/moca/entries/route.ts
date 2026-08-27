// مدخلات حصر المهام والعمليات في وزارة شؤون مجلس الوزراء
// GET فقط — الكتابة تمرّ عبر /api/moca/sync التي تفرض نطاق كل مستخدم
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';
import { assertMocaView, mocaEntryWhere } from '@/lib/security/moca-access';
import { mocaEntryToClient, type MocaEntryRow } from '@/lib/server/moca-proj-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertMocaView(u);
    const rows = await prisma.mocaEntry.findMany({
      where: await mocaEntryWhere(u),
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });
    return NextResponse.json({ entries: rows.map((r) => mocaEntryToClient(r as MocaEntryRow)) });
  } catch (e) {
    return handleApiError(e);
  }
}

