// ============================================================================
// مواءمة جدول الجهات مع السجل المعتمد — تُنفَّذ مرة عند التهيئة (npm run db:seed)
// ----------------------------------------------------------------------------
// 1) الأسماء القديمة تُعاد تسميتها إلى الاسم المعتمد (يبقى معرّف الجهة وكل ما
//    يرتبط بها: المدخلات والمستخدمون ودليل الخدمات).
// 2) إن وُجد صفّان يشيران إلى الجهة نفسها، تُنقل بيانات القديم إلى المعتمد ثم
//    يُحذف الصف المكرر.
// 3) الجهات الناقصة تُنشأ، وتُضبط التصنيفات والترتيب.
// 4) جهة خارج السجل ولها بيانات: تبقى وتُعطَّل (لا تظهر في القوائم) ولا تُحذف.
// بعد ذلك تُدار الجهات من لوحة المشرف؛ هذه العملية آمنة التكرار ولا تُلغي
// أي إضافة أو تعديل يجريه المشرف على جهة ليست في السجل.
// ============================================================================
import type { Prisma, PrismaClient } from '@prisma/client';
import { OFFICIAL_ENTITIES, ENTITY_ALIASES, officialEntityName } from '../entitiesOfficial';
import { FEDERAL_SUB_SERVICES } from '../entities';
import svcCatalogRaw from '../svcCatalog.json';

type Db = Prisma.TransactionClient | PrismaClient;

const clean = (s: string) => String(s || '').replace(/\s+/g, ' ').trim();

export type EntityRegisterReport = {
  renamed: [string, string][];
  merged: [string, string][];
  created: string[];
  deactivated: string[];
};

/** نقل كل ما يرتبط بجهة مكررة إلى الجهة المعتمدة ثم حذف المكررة */
async function mergeInto(db: Db, fromId: string, toId: string) {
  await db.item.updateMany({ where: { entityId: fromId }, data: { entityId: toId } });
  await db.user.updateMany({ where: { entityId: fromId }, data: { entityId: toId } });
  // الخدمات تُنقل فعلياً (لا تُحذف): تُقرأ ثم تُضاف للجهة المعتمدة بلا تكرار
  const services = await db.serviceCatalog.findMany({ where: { entityId: fromId } });
  await db.serviceCatalog.deleteMany({ where: { entityId: fromId } });
  if (services.length) {
    await db.serviceCatalog.createMany({
      data: services.map((r) => ({ entityId: toId, mainService: r.mainService, subService: r.subService })),
      skipDuplicates: true,
    });
  }
  // نطاقات المستخدمين: تُنقل ما لم تكن مسجّلة للجهة المعتمدة أصلاً
  const scopes = await db.userEntityScope.findMany({ where: { entityId: fromId } });
  await db.userEntityScope.deleteMany({ where: { entityId: fromId } });
  if (scopes.length) {
    await db.userEntityScope.createMany({
      data: scopes.map((r) => ({ userId: r.userId, entityId: toId })),
      skipDuplicates: true,
    });
  }
  await db.entityRep.deleteMany({ where: { entityId: fromId } });
  await db.streamOwner.deleteMany({ where: { entityId: fromId } });
  await db.entity.delete({ where: { id: fromId } });
}

export async function ensureEntityRegister(db: Db): Promise<EntityRegisterReport> {
  const report: EntityRegisterReport = { renamed: [], merged: [], created: [], deactivated: [] };
  const official = new Map(OFFICIAL_ENTITIES.map((e) => [e.name, e]));

  // 1) إعادة التسمية / الدمج
  for (const row of await db.entity.findMany()) {
    const current = clean(row.nameAr);
    const target = officialEntityName(current);
    if (target === current) continue;
    const existing = await db.entity.findUnique({ where: { nameAr: target } });
    if (existing && existing.id !== row.id) {
      await mergeInto(db, row.id, existing.id);
      report.merged.push([current, target]);
    } else {
      await db.entity.update({ where: { id: row.id }, data: { nameAr: target } });
      report.renamed.push([current, target]);
    }
  }

  // 2) إنشاء الناقص + ضبط التصنيف والترتيب والتفعيل
  for (const e of OFFICIAL_ENTITIES) {
    const row = await db.entity.findUnique({ where: { nameAr: e.name } });
    if (!row) {
      await db.entity.create({
        data: { nameAr: e.name, category: e.category, sortOrder: e.order, isActive: !e.pending },
      });
      report.created.push(e.name);
      continue;
    }
    // التفعيل لا يُفرض: قد يكون المشرف عطّل جهة عمداً — يُضبط التصنيف والترتيب فقط
    if (row.category !== e.category || row.sortOrder !== e.order) {
      await db.entity.update({ where: { id: row.id }, data: { category: e.category, sortOrder: e.order } });
    }
    // جهة بانتظار اعتماد إدراجها في النطاق: تُخفى من القوائم ما لم تكن مستخدمة
    // فعلاً (لها مدخلات أو مستخدمون) — ويكفي زر «تفعيل» في اللوحة عند اعتمادها
    if (e.pending && row.isActive) {
      const used =
        (await db.item.count({ where: { entityId: row.id } })) + (await db.user.count({ where: { entityId: row.id } }));
      if (!used) {
        await db.entity.update({ where: { id: row.id }, data: { isActive: false } });
        report.deactivated.push(e.name);
      }
    }
  }

  // 3) اسم قديم جاء من دليل الخدمات وليس في السجل (تجميعات وجهات محلية):
  //    يُعطَّل فلا يظهر في القوائم، ولا يُحذف حتى لا تضيع بياناته.
  //    ما يضيفه المشرف من اللوحة ليس من هذه الأسماء فلا يُمس أبداً.
  const legacySeeded = new Set([
    ...Object.keys(FEDERAL_SUB_SERVICES),
    ...Object.keys(svcCatalogRaw as Record<string, unknown>),
    ...Object.keys(ENTITY_ALIASES),
  ].map(clean));
  for (const row of await db.entity.findMany()) {
    const name = clean(row.nameAr);
    if (official.has(name) || !row.isActive || !legacySeeded.has(name)) continue;
    await db.entity.update({ where: { id: row.id }, data: { isActive: false } });
    report.deactivated.push(name);
  }

  return report;
}
