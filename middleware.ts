import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * HSTS على كل استجابة من الخادم — يكمل ترويسات الأمان المعرّفة في next.config.mjs
 * بضبط الترويسة برمجياً أيضاً (معالجة نتيجة فحص TDRA/Checkmarx: Missing HSTS Header).
 * القيمة مطابقة لقيمة next.config.mjs: سنتان مع الشمول للنطاقات الفرعية والتحميل المسبق.
 */
const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload';

/**
 * Cache-Control: كل استجابات API الديناميكية (جلسات، بيانات مستخدمين، لوحات)
 * تُرسل no-store صراحةً كي لا يخزّنها متصفح أو وسيط. يُستثنى فقط موردان
 * عامان غير حساسين يضبطان تخزينهما بأنفسهما:
 *  - /api/media/:id — وسائط الموقع العام، مُهيّأة بمعرّف جديد عند كل استبدال
 *  - /api/site-content — محتوى الصفحات العامة (تخزين قصير 60 ثانية)
 */
const CACHED_PUBLIC_APIS = ['/api/media/', '/api/site-content'];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', HSTS_VALUE);
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/') && !CACHED_PUBLIC_APIS.some((p) => path.startsWith(p))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }
  return response;
}

// تشمل جميع المسارات — صفحات وواجهات API والملفات الثابتة — لضمان انتشار موحّد للترويسة
export const config = {
  matcher: '/:path*',
};
