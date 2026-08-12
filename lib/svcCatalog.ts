// دليل الخدمات الاتحادية — الخدمات الرئيسية والفرعية لكل جهة
// المصدر: ملفا الخدمات المعتمدان (يُدمَجان في lib/svcCatalog.json)
// القاعدة: منسق الجهة يرى خدمات جهته فقط — لا قائمة موحدة عبر الجهات.
import { useEffect, useState } from 'react';
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

/** خدمات الجهة فقط — null إذا لم تكن الجهة مدرجة في الدليل */
export function svcCatalogFor(entityName: string): EntityCatalog | null {
  return byNorm.get(norm(entityName)) || null;
}

/** أسماء الجهات المدرجة في دليل الخدمات — لاختيار الجهة في النسخة التجريبية */
export function svcCatalogEntities(): string[] {
  return Object.keys(CATALOG).sort((a, b) => a.localeCompare(b, 'ar'));
}

/** هل لجهة المستخدم خدمات مسجلة في الدليل؟ */
export function hasSvcCatalog(entityName: string): boolean {
  return byNorm.has(norm(entityName));
}

/**
 * دليل خدمات الجهة للاستخدام في الواجهة.
 * - النسخة التجريبية (NEXT_PUBLIC_DEMO_MODE=1): الدليل المضمّن، مقيداً بالجهة.
 * - نسخة الخادم: يُجلب من /api/svc-catalog (الخادم يقيده بجهة المستخدم من
 *   الجلسة)، مع الرجوع للدليل المضمّن عند تعذر الاتصال.
 */
export function useSvcCatalog(entityName: string): EntityCatalog | null {
  const bundled = svcCatalogFor(entityName);
  const [remote, setRemote] = useState<EntityCatalog | null | undefined>(undefined);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === '1') return;
    let dead = false;
    fetch('/api/svc-catalog', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead) return;
        const svcs = d && typeof d === 'object' ? (d as { services?: EntityCatalog }).services : null;
        setRemote(svcs && Object.keys(svcs).length ? svcs : null);
      })
      .catch(() => {
        if (!dead) setRemote(null);
      });
    return () => {
      dead = true;
    };
  }, [entityName]);
  if (process.env.NEXT_PUBLIC_DEMO_MODE === '1') return bundled;
  return remote !== undefined && remote !== null ? remote : bundled;
}
