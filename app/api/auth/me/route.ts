import { NextRequest, NextResponse } from 'next/server';
import { loadAuthUser } from '@/lib/security/auth';
import { jsonError, messages } from '@/lib/security/errors';
import { readMocaUnits } from '@/lib/security/moca-access';
import { projLeadName } from '@/lib/security/proj-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await loadAuthUser(req);
  if (!user) return jsonError('UNAUTHENTICATED', messages.unauthenticated, 401);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.name,
      title: user.title,
      phone: user.phone,
      legacyRole: user.role,
      status: user.status,
      accessEnabled: user.accessEnabled,
      entityId: user.entityId,
      entityName: user.entityName,
      streamId: user.streamId,
      entityScopes: user.entityScopes,
      streamScopes: user.streamScopes,
      // وحدات وقطاعات وزارة شؤون مجلس الوزراء المسندة — بها يظهر مبدّل
      // الجهة/القطاع داخل نسخة الوزارة لمن أُسندت له أكثر من وحدة
      mocaUnits: await readMocaUnits(user.id),
      // قائد المشاريع الاستراتيجية: اسم القائد الذي يمثله هذا الحساب
      projLead: await projLeadName(user),
    },
    roles: user.roles,
    permissions: user.permissions,
  });
}
