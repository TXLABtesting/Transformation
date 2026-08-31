// هوية قادة المشاريع الاستراتيجية: أي قائد من القادة المعتمدين يمثله كل حساب
// دوره strategic_project_lead — تُخزَّن في جدول الإعدادات القائم بمفتاح
// proj_lead:<userId> وتُدار من لوحة المشرف.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError, getIp } from '@/lib/security/http';
import { assertPermission } from '@/lib/security/rbac';
import { writeAuditLog } from '@/lib/security/audit';
import { projLeadKey } from '@/lib/security/proj-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREFIX = 'proj_lead:';

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'users:view');
    const rows = await prisma.setting.findMany({ where: { key: { startsWith: PREFIX } } });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key.slice(PREFIX.length)] = String(r.value || '').trim();
    return NextResponse.json({ leadIdentities: map });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:update');
    const b = (await req.json().catch(() => null)) as { userId?: string; lead?: string } | null;
    const userId = String(b?.userId || '').trim();
    if (!userId) return NextResponse.json({ error: 'user-required' }, { status: 400 });
    const lead = String(b?.lead || '').trim();
    if (!lead) {
      await prisma.setting.deleteMany({ where: { key: projLeadKey(userId) } });
    } else {
      await prisma.setting.upsert({
        where: { key: projLeadKey(userId) },
        update: { value: lead },
        create: { key: projLeadKey(userId), value: lead },
      });
    }
    await writeAuditLog({
      actorUserId: actor.id,
      action: 'proj_lead_identity_set',
      resourceType: 'user',
      resourceId: userId,
      metadata: { lead },
      ipAddress: getIp(req),
      userAgent: req.headers.get('user-agent'),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
