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
 * نطاق وحدات/قطاعات منسق الوزارة.
 *
 * الإسناد اختياري ويُخزَّن في جدول الإعدادات العام القائم (settings) بمفتاح
 * `moca_unit:<userId>` — بلا أي عمود أو جدول جديد. تقبل القيمة أكثر من وحدة
 * مفصولة بـ «|»، وكل وحدة `<unitId>` أو `<unitId>::<القطاع>`. متى وُجد الإسناد
 * قُصر المنسق على وحداته، وإن لم يوجد عمل على مستوى الوزارة كاملة (وهي جهته
 * أصلاً) ولا يطال أي جهة أخرى بحال.
 */
export const mocaUnitKey = (userId: string) => 'moca_unit:' + userId;

export type MocaScope = { unitId: string; unitSector: string };

/** وحدات المستخدم المسندة كما خُزّنت — مصفوفة نصية "unit" أو "unit::قطاع" */
export async function readMocaUnits(userId: string): Promise<string[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: mocaUnitKey(userId) } });
    return String(row?.value || '')
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const parseUnit = (raw: string): MocaScope => {
  const [unitId, sector = ''] = raw.split('::');
  return { unitId, unitSector: sector };
};

/** تعيد [] للأدوار العامة (اللجنة/المشرف) ولمن بلا إسناد — أي بلا قيد */
export async function mocaScopesForUser(user: AuthUser): Promise<MocaScope[]> {
  if (isGlobalRole(user)) return [];
  return (await readMocaUnits(user.id)).map(parseUnit);
}

/** نطاق واحد — يبقى للتوافق مع ما يحتاج وحدة واحدة (الكتابة الافتراضية) */
export async function mocaScopeForUser(user: AuthUser): Promise<MocaScope | null> {
  const all = await mocaScopesForUser(user);
  return all[0] || null;
}

/** المدخلات المرئية: الأدوار العامة ترى المُرسَل وما بعده، والمنسق يرى نطاقاته */
export async function mocaEntryWhere(user: AuthUser) {
  // مشرف النظام يعمل بالنيابة على كل الوحدات فيرى المسودات أيضاً؛ اللجنة
  // ترى المُرسل فما بعده فقط (مسودات الوحدات داخلية)
  if (isGlobalRole(user))
    return user.roles.includes('system_admin') ? {} : { wf: { not: 'draft' } };
  const scopes = await mocaScopesForUser(user);
  if (!scopes.length) return {}; // منسق بلا إسناد وحدة: مدخلات الوزارة كلها
  const clause = (sc: MocaScope) =>
    sc.unitSector ? { unitId: sc.unitId, unitSector: sc.unitSector } : { unitId: sc.unitId };
  return scopes.length === 1 ? clause(scopes[0]) : { OR: scopes.map(clause) };
}

/** هل يقع المدخل ضمن نطاقات المستخدم؟ (الكتابة تُقصر على وحداته) */
export function mocaInScope(scopes: MocaScope[], e: { unitId?: string; unitSector?: string }): boolean {
  if (!scopes.length) return true;
  return scopes.some((sc) =>
    sc.unitSector ? sc.unitId === e.unitId && sc.unitSector === e.unitSector : sc.unitId === e.unitId
  );
}
