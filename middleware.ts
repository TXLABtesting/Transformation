import { NextResponse } from 'next/server';

/**
 * HSTS على كل استجابة من الخادم — يكمل ترويسات الأمان المعرّفة في next.config.mjs
 * بضبط الترويسة برمجياً أيضاً (معالجة نتيجة فحص TDRA/Checkmarx: Missing HSTS Header).
 * القيمة مطابقة لقيمة next.config.mjs: سنتان مع الشمول للنطاقات الفرعية والتحميل المسبق.
 */
const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload';

export function middleware() {
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', HSTS_VALUE);
  return response;
}

// تشمل جميع المسارات — صفحات وواجهات API والملفات الثابتة — لضمان انتشار موحّد للترويسة
export const config = {
  matcher: '/:path*',
};
