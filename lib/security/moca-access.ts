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
 * نطاق الوحدة/القطاع للمنسق داخل الوزارة. الوحدة تُشتق من نطاقات المستخدم
 * المخزّنة (user_stream_scopes تُستخدم في الوزارة لحفظ معرّف الوحدة) وإلا
 * فمن معرّف المسار في سجله — والأدوار العامة بلا قيد.
 */
export function mocaUnitScopeOf(user: AuthUser): { unitId: string; unitSector: string } | null {
  if (isGlobalRole(user)) return null;
  const raw = String(user.streamId || user.streamScopes[0] || '').trim();
  if (!raw) return { unitId: '', unitSector: '' };
  // الصيغة المخزّنة: "<unitId>" أو "<unitId>::<sector>"
  const [unitId, sector = ''] = raw.split('::');
  return { unitId, unitSector: sector };
}

/** المدخلات المرئية: الأدوار العامة ترى المُرسَل وما بعده، والمنسق يرى وحدته */
export async function mocaEntryWhere(user: AuthUser) {
  if (isGlobalRole(user)) return { wf: { not: 'draft' } };
  const scope = mocaUnitScopeOf(user);
  if (!scope || !scope.unitId) return { id: '__no_scope__' };
  return scope.unitSector
    ? { unitId: scope.unitId, unitSector: scope.unitSector }
    : { unitId: scope.unitId };
}

/** يتحقق أن المدخل ضمن نطاق المنسق قبل أي تعديل */
export async function assertMocaEntryScope(user: AuthUser, id: string): Promise<void> {
  const row = await prisma.mocaEntry.findUnique({ where: { id }, select: { unitId: true, unitSector: true } });
  if (!row) throw Object.assign(new Error('not-found'), { status: 404 });
  if (isGlobalRole(user)) return;
  const scope = mocaUnitScopeOf(user);
  if (!scope || row.unitId !== scope.unitId || (scope.unitSector && row.unitSector !== scope.unitSector)) {
    throw Object.assign(new Error('forbidden'), { status: 403 });
  }
}
