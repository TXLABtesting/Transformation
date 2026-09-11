// ============================================================================
// Real federal entities dataset (34 entities) — wired from the existing
// workplan portal source (federalServices / federalSubServices / servicePackages).
// Exposed as a registry + lookup helpers for the services stream and the
// entity filters (ai / path cross-entity views). The design prototype's own
// forms are unchanged; this only makes the real data available to them.
// ============================================================================
import federalServices from './data/federalServices.json';
import federalSubServices from './data/federalSubServices.json';
import servicePackages from './data/servicePackages.json';
import { OFFICIAL_ENTITY_NAMES, officialEntityName, legacyNamesOf } from './entitiesOfficial';

// entity -> [services]
export const FEDERAL_SERVICES = federalServices as Record<string, string[]>;
// entity -> department (main service group) -> [services]
export const FEDERAL_SUB_SERVICES = federalSubServices as Record<
  string,
  Record<string, string[]>
>;
// entity -> package -> [services]
export const SERVICE_PACKAGES = servicePackages as Record<string, Record<string, string[]>>;

/** الجهات ضمن نطاق المشروع — السجل المعتمد (وثيقة يوليو 2026) بترتيبها فيه.
 *  دليل الخدمات مخزَّن ببعض الأسماء القديمة، فتُقرأ بالمطابقة أدناه. */
export const FEDERAL_ENTITIES: string[] = OFFICIAL_ENTITY_NAMES;

/** Departments (main service groups) for an entity. */
export function departmentsOf(entity: string): string[] {
  const data = resolveEntity(entity, FEDERAL_SUB_SERVICES);
  return data ? Object.keys(data) : [];
}

/** Sub-services under a given entity + department. */
export function servicesOf(entity: string, department: string): string[] {
  const data = resolveEntity(entity, FEDERAL_SUB_SERVICES);
  return data?.[department] || [];
}

/** Flat service list for an entity. */
export function entityServices(entity: string): string[] {
  return resolveEntity(entity, FEDERAL_SERVICES) || [];
}

// بحث متسامح: الاسم كما هو، ثم الاسم المعتمد، ثم أسماؤه القديمة في الدليل،
// وأخيراً مطابقة جزئية لفروق الصياغة بين الملفات.
function resolveEntity<T>(entity: string, source: Record<string, T>): T | undefined {
  if (!entity) return undefined;
  if (source[entity]) return source[entity];
  const official = officialEntityName(entity);
  if (source[official]) return source[official];
  for (const legacy of legacyNamesOf(official)) if (source[legacy]) return source[legacy];
  const match = Object.keys(source).find(
    (k) => k.includes(entity) || entity.includes(k)
  );
  return match ? source[match] : undefined;
}
