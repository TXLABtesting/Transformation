// ============================================================================
// صلاحيات المشاريع الاستراتيجية — تُبنى على أدوار RBAC القائمة:
//  - اللجنة الوطنية والمشرف (أدوار عامة): تعريف المشاريع واعتماد النماذج
//  - strategic_project_member: تعبئة نماذج المشاريع وإرسالها
// ============================================================================
import { isGlobalRole, type AuthUser } from './rbac';

export const PROJ_MEMBER_ROLE = 'strategic_project_member';

/** اللجنة والمشرف يعرّفون المشاريع ويعتمدون نماذجها */
export function assertProjAdmin(user: AuthUser): void {
  if (!isGlobalRole(user)) throw Object.assign(new Error('forbidden'), { status: 403 });
}

/** من يرى المشاريع ونماذجها: الأدوار العامة وأعضاء المشاريع */
export function canSeeProjects(user: AuthUser): boolean {
  return isGlobalRole(user) || user.roles.includes(PROJ_MEMBER_ROLE);
}

/** من يكتب نماذج المشاريع: الأعضاء (والأدوار العامة للصيانة) */
export function assertProjMember(user: AuthUser): void {
  if (!user.roles.includes(PROJ_MEMBER_ROLE) && !isGlobalRole(user)) {
    throw Object.assign(new Error('forbidden'), { status: 403 });
  }
}
