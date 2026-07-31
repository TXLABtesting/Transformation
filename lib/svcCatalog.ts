// دليل الخدمات الاتحادية — الخدمات الرئيسية والفرعية لكل جهة
// المصدر: ملفا الخدمات المعتمدان (يُدمَجان في lib/svcCatalog.json)
import raw from './svcCatalog.json';

export type EntityCatalog = Record<string, string[]>; // الخدمة الرئيسية -> الخدمات الفرعية

const CATALOG = raw as Record<string, EntityCatalog>;

// مطابقة متسامحة لاسم الجهة (توحيد الهمزات والتاء المربوطة والمسافات)
const norm = (s: string) =>
  String(s || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

const byNorm = new Map<string, EntityCatalog>();
for (const [ent, services] of Object.entries(CATALOG)) {
  const k = norm(ent);
  const cur = byNorm.get(k);
  if (!cur) {
    byNorm.set(k, services);
  } else {
    // دمج التهجئات المتقاربة لنفس الجهة
    for (const [m, subs] of Object.entries(services)) {
      cur[m] = Array.from(new Set([...(cur[m] || []), ...subs]));
    }
  }
}

// القائمة الموحدة لكل الجهات — تُستخدم عندما لا تكون جهة المنسق ضمن الدليل
let unionCache: EntityCatalog | null = null;
function unionCatalog(): EntityCatalog {
  if (unionCache) return unionCache;
  const u: EntityCatalog = {};
  for (const services of Object.values(CATALOG)) {
    for (const [m, subs] of Object.entries(services)) {
      u[m] = Array.from(new Set([...(u[m] || []), ...subs]));
    }
  }
  unionCache = Object.fromEntries(Object.entries(u).sort(([a], [b]) => a.localeCompare(b, 'ar')));
  return unionCache;
}

/** الخدمات المتاحة للجهة: قائمة الجهة إن وُجدت، وإلا القائمة الموحدة */
export function svcCatalogFor(entityName: string): { services: EntityCatalog; scoped: boolean } {
  const hit = byNorm.get(norm(entityName));
  if (hit) return { services: hit, scoped: true };
  return { services: unionCatalog(), scoped: false };
}
