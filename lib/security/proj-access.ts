// ============================================================================
// صلاحيات المشاريع الاستراتيجية — تُبنى على أدوار RBAC القائمة:
//  - اللجنة الوطنية والمشرف (أدوار عامة): تعريف المشاريع واعتماد النماذج
//  - strategic_project_member: تعبئة نماذج المشاريع وإرسالها
// ============================================================================
import { prisma } from '@/lib/prisma';
import { isGlobalRole, type AuthUser } from './rbac';

export const PROJ_MEMBER_ROLE = 'strategic_project_member';
export const PROJ_LEAD_ROLE = 'strategic_project_lead';

/** اللجنة والمشرف يعرّفون المشاريع ويعتمدون نماذجها */
export function assertProjAdmin(user: AuthUser): void {
  if (!isGlobalRole(user)) throw Object.assign(new Error('forbidden'), { status: 403 });
}

/** من يرى المشاريع ونماذجها: الأدوار العامة وأعضاء المشاريع وقادتها */
export function canSeeProjects(user: AuthUser): boolean {
  return isGlobalRole(user) || user.roles.includes(PROJ_MEMBER_ROLE) || user.roles.includes(PROJ_LEAD_ROLE);
}

/** مفتاح هوية القائد في جدول الإعدادات: أي قائد من القادة المعتمدين هذا الحساب */
export const projLeadKey = (userId: string) => 'proj_lead:' + userId;

/** اسم القائد لحساب دوره قائد مشاريع — فارغ لغيره أو لمن لم تُسند هويته بعد */
export async function projLeadName(user: AuthUser): Promise<string> {
  if (!user.roles.includes(PROJ_LEAD_ROLE)) return '';
  try {
    const row = await prisma.setting.findUnique({ where: { key: projLeadKey(user.id) } });
    return String(row?.value || '').trim();
  } catch {
    return '';
  }
}

/**
 * حصر تعريفات المشاريع بحسب الدور:
 *  - الأدوار العامة: بلا قيد (null)
 *  - القائد: مشاريع قيادته باسمه
 *  - العضو: مشاريعه المسندة إليه بمعرّف حسابه أو بريده
 *  - سواهم: لا شيء
 */
export async function projDefWhere(user: AuthUser): Promise<Record<string, unknown> | null | 'none'> {
  if (isGlobalRole(user)) return null;
  if (user.roles.includes(PROJ_LEAD_ROLE)) {
    const lead = await projLeadName(user);
    return lead ? { lead } : 'none';
  }
  if (user.roles.includes(PROJ_MEMBER_ROLE)) {
    const or: Record<string, unknown>[] = [{ memberId: user.id }];
    const email = String(user.email || '').trim().toLowerCase();
    if (email) or.push({ memberEmail: email });
    return { OR: or };
  }
  return 'none';
}

/** من يكتب نماذج المشاريع: الأعضاء (والأدوار العامة للصيانة) */
export function assertProjMember(user: AuthUser): void {
  if (!user.roles.includes(PROJ_MEMBER_ROLE) && !isGlobalRole(user)) {
    throw Object.assign(new Error('forbidden'), { status: 403 });
  }
}
