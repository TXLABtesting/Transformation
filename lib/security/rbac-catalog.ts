// ============================================================================
// مرجع الأدوار والصلاحيات (RBAC) — مصدر واحد
// ----------------------------------------------------------------------------
// هذه هي الأدوار والصلاحيات التي تُنشأ في قاعدة البيانات عند التهيئة
// (`npm run db:seed`). يستخدمها ملف البذر، ويستخدمها أيضاً أول دخول لمشرف
// النظام (BOOTSTRAP_ADMIN_EMAILS) ليضمن وجودها — فلا يبقى المشرف بلا صلاحيات
// إن نُشرت القاعدة بالترحيلات وحدها دون بذر.
//
// تعديل مسميات الأدوار أو صلاحياتها بعد التهيئة يتم في قاعدة البيانات؛ ما هنا
// قيم التهيئة الأولى فقط (`ensureRbacCatalog` لا يمسّ صفاً قائماً سوى الاسم).
// ============================================================================
import type { Prisma, PrismaClient } from '@prisma/client';

/** أدوار النظام: الرمز الثابت ومسماه العربي */
export const RBAC_ROLES: readonly (readonly [string, string])[] = [
  ['system_admin', 'مشرف النظام'],
  ['program_admin', 'مدير البرنامج'],
  ['entity_representative', 'ممثل الجهة'],
  ['entity_admin', 'مسؤول الجهة'],
  ['entity_coordinator', 'منسق المسار في الجهة الاتحادية'],
  ['stream_owner', 'فريق عمل المسار في المشروع'],
  ['ai_committee', 'اللجنة الوطنية للذكاء الاصطناعي المساعد'],
  ['strategic_project_member', 'أعضاء المشاريع الاستراتيجية'],
  ['strategic_project_lead', 'قائد المشاريع الاستراتيجية'],
  ['viewer', 'مستعرض'],
  ['auditor', 'مدقق'],
] as const;

export const PERMISSIONS: string[] = [
  'users:view','users:create','users:update','users:disable','roles:view','roles:assign',
  'entities:view','entities:update','streams:view','streams:update',
  'items:view','items:create','items:update','items:submit','items:approve','items:reject','items:export',
  'launch_plans:view','launch_plans:create','launch_plans:update','launch_plans:approve',
  'funding:view','funding:create','funding:approve','funding:reject','funding:cancel',
  'nominations:view','nominations:create','nominations:update','nominations:approve','nominations:reject',
  'reports:view','reports:export','ai_review:run','audit:view','settings:view','settings:update',
];

// مصفوفة الدور ← صلاحياته.
// ملاحظة: «فريق عمل المسار في المشروع» (stream_owner) هو المعتمِد الوحيد في
// مرحلة ent1؛ و«ممثل الجهة» دور اطلاع قديم بلا صلاحيات اعتماد.
export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  system_admin: PERMISSIONS,
  program_admin: PERMISSIONS.filter((p) => !p.startsWith('settings:')),
  entity_representative: ['entities:view','streams:view','items:view','items:export','launch_plans:view','reports:view','reports:export'],
  entity_admin: ['entities:view','entities:update','streams:view','items:view','items:create','items:update','items:submit','items:export','launch_plans:view','funding:view','nominations:view','reports:view','reports:export'],
  entity_coordinator: ['entities:view','streams:view','items:view','items:create','items:update','items:submit','items:export','launch_plans:view','funding:view','nominations:view','reports:view'],
  stream_owner: ['entities:view','streams:view','items:view','items:approve','items:reject','items:export','launch_plans:view','launch_plans:approve','funding:view','nominations:view','nominations:approve','nominations:reject','reports:view'],
  ai_committee: ['entities:view','streams:view','items:view','items:approve','items:reject','items:export','launch_plans:view','funding:view','funding:approve','funding:reject','funding:cancel','nominations:view','reports:view','reports:export','ai_review:run'],
  // أعضاء المشاريع الاستراتيجية: نماذج مشاريعهم فقط — بلا صلاحيات على مدخلات المسارات
  strategic_project_member: ['entities:view','streams:view','reports:view'],
  // قائد المشاريع الاستراتيجية: اطلاع على مشاريع قيادته وحالة تعبئتها فقط
  strategic_project_lead: ['entities:view','streams:view','reports:view'],
  viewer: ['entities:view','streams:view','items:view','launch_plans:view','funding:view','nominations:view','reports:view'],
  auditor: ['entities:view','streams:view','items:view','items:export','launch_plans:view','funding:view','nominations:view','reports:view','reports:export','audit:view'],
};

/** عميل Prisma أو معاملة — كلاهما يصلح للإنشاء */
type RbacClient = Prisma.TransactionClient | PrismaClient;

/**
 * إنشاء الأدوار والصلاحيات وربطها — عملية آمنة التكرار (idempotent):
 * الصف القائم يبقى كما هو (يُحدَّث اسم الدور فقط)، ولا يُحذف شيء.
 */
export async function ensureRbacCatalog(db: RbacClient): Promise<void> {
  for (const [code, nameAr] of RBAC_ROLES) {
    await db.role.upsert({ where: { code }, update: { nameAr }, create: { code, nameAr } });
  }
  for (const code of PERMISSIONS) {
    await db.permission.upsert({ where: { code }, update: {}, create: { code } });
  }
  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const role = await db.role.findUniqueOrThrow({ where: { code: roleCode } });
    for (const permissionCode of permissionCodes) {
      const permission = await db.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}
