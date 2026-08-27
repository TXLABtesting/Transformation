// ============================================================================
// صلاحيات نسخة وزارة شؤون مجلس الوزراء — تُبنى على أدوار RBAC القائمة نفسها
// دون أي دور جديد على مستوى الخادم:
//  - منسق الوزارة (entity_coordinator وجهته الوزارة): يكتب مدخلات وحدته ويرسلها
//  - اللجنة الوطنية والمشرف (الأدوار العامة): يطّلعون على الكل ويعتمدون
// ============================================================================
import { prisma } from '@/lib/prisma';
import { isGlobalRole, type AuthUser } from './rbac';

export const MOCA_MINISTRY_NAME = 'وزارة شؤون مجلس الوزراء';

/** هل ينتمي المستخدم لوزارة شؤون مجلس الوزراء؟ (من جهته في سجله) */
export function isMocaUser(user: AuthUser): boolean {
  return String(user.entityName || '').includes(MOCA_MINISTRY_NAME);
}

/** اللجنة/المشرف: اعتماد مدخلات الوزارة وتوزيعاتها */
export function canApproveMoca(user: AuthUser): boolean {
  return isGlobalRole(user);
}

/** منسق داخل الوزارة: يكتب مدخلات وحدته فقط */
export function canWriteMoca(user: AuthUser): boolean {
  return isMocaUser(user) && user.roles.includes('entity_coordinator');
}

/** الاطلاع: منسوبو الوزارة والأدوار العامة */
export function canViewMoca(user: AuthUser): boolean {
  return isMocaUser(user) || isGlobalRole(user);
}

export function assertMocaView(user: AuthUser): void {
  if (!canViewMoca(user)) throw Object.assign(new Error('forbidden'), { status: 403 });
}

export function assertMocaWrite(user: AuthUser): void {
  if (!canWriteMoca(user)) throw Object.assign(new Error('forbidden'), { status: 403 });
}

export function assertMocaApprove(user: AuthUser): void {
  if (!canApproveMoca(user)) throw Object.assign(new Error('forbidden'), { status: 403 });
}

/**
 * نطاق وحدة/قطاع منسق الوزارة.
 *
 * الإسناد اختياري ويُخزَّن في جدول الإعدادات العام القائم (settings) بمفتاح
 * `moca_unit:<userId>` وقيمته `<unitId>` أو `<unitId>::<القطاع>` — بلا أي عمود
 * أو جدول جديد. متى وُجد الإسناد قُصر المنسق على وحدته، وإن لم يوجد عمل على
 * مستوى الوزارة كاملة (وهي جهته أصلاً) ولا يطال أي جهة أخرى بحال.
 *
 * تعيد null للأدوار العامة (اللجنة/المشرف) أي بلا قيد.
 */
export async function mocaScopeForUser(
  user: AuthUser
): Promise<{ unitId: string; unitSector: string } | null> {
  if (isGlobalRole(user)) return null;
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'moca_unit:' + user.id } });
    const raw = String(row?.value || '').trim();
    if (!raw) return null; // بلا إسناد: نطاق الوزارة كاملة
    const [unitId, sector = ''] = raw.split('::');
    return { unitId, unitSector: sector };
  } catch {
    return null;
  }
}

/** المدخلات المرئية: الأدوار العامة ترى المُرسَل وما بعده، والمنسق يرى نطاقه */
export async function mocaEntryWhere(user: AuthUser) {
  if (isGlobalRole(user)) return { wf: { not: 'draft' } };
  const scope = await mocaScopeForUser(user);
  if (!scope) return {}; // منسق بلا إسناد وحدة: مدخلات الوزارة كلها
  return scope.unitSector
    ? { unitId: scope.unitId, unitSector: scope.unitSector }
    : { unitId: scope.unitId };
}
