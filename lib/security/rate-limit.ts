// ============================================================================
// حدّ المحاولات في الذاكرة — طبقة أولى أمام نقاط الدخول الحساسة
// ----------------------------------------------------------------------------
// نافذة منزلقة بسيطة لكل مفتاح (عادةً عنوان IP + نوع العملية). تكفي لصدّ
// التخمين السريع من مصدر واحد، ولا تُغني عن الحدّ على مستوى الشبكة/الـingress
// (RATE_LIMIT_* في .env.example) في النشر متعدد النسخ.
// ============================================================================

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** يعيد false إذا تجاوز المفتاح حدّه في النافذة الحالية */
export function hitRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // تنظيف دوري خفيف حتى لا تنمو الخريطة بلا حد
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= max;
}

/** إعادة ضبط مفتاح (بعد نجاح العملية مثلاً) */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
