import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertPermission, isGlobalRole } from '@/lib/security/rbac';
import { handleApiError } from '@/lib/security/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// دليل الخدمات الاتحادية للجهة — feeds the services-stream dropdowns.
// Scoping is enforced here, not in the client: a coordinator always gets the
// catalog of their own entity; only global roles may query another entity.
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    assertPermission(user, 'items:view');

    const requested = new URL(req.url).searchParams.get('entityId');
    const entityId = isGlobalRole(user) && requested ? requested : user.entityId || user.entityScopes[0] || null;
    if (!entityId) return NextResponse.json({ services: {} });

    const rows = await prisma.serviceCatalog.findMany({
      where: { entityId },
      orderBy: [{ mainService: 'asc' }, { subService: 'asc' }],
      select: { mainService: true, subService: true },
    });
    const services: Record<string, string[]> = {};
    for (const r of rows) (services[r.mainService] ||= []).push(r.subService);
    return NextResponse.json({ services });
  } catch (e) {
    return handleApiError(e);
  }
}
