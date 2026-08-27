import { NextRequest, NextResponse } from 'next/server';
import { jsonError, messages } from './errors';

export function getIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip');
}

export function handleApiError(error: unknown) {
  const e = error as { status?: number; message?: string };
  if (e.status === 401 || e.message === 'unauthenticated') {
    return jsonError('UNAUTHENTICATED', messages.unauthenticated, 401);
  }
  if (e.message === 'disabled') {
    return jsonError('ACCESS_NOT_ENABLED', messages.disabled, 403);
  }
  if (e.status === 403 || e.message?.startsWith('forbidden')) {
    return jsonError('FORBIDDEN', messages.forbidden, 403);
  }
  if (e.status === 404) return jsonError('NOT_FOUND', messages.notFound, 404);
  // أخطاء قاعدة البيانات المعروفة تُترجم لرسائل مفهومة بدل 500 مبهم:
  // P2002 قيمة مكرّرة على عمود فريد، P2003 مرجع غير موجود، P2025 سجل مفقود.
  const p = error as { code?: string; meta?: { target?: string[] | string; field_name?: string } };
  if (p.code === 'P2002') {
    const t = Array.isArray(p.meta?.target) ? p.meta!.target!.join('، ') : String(p.meta?.target || '');
    const isEmail = t.includes('email');
    console.error('[P2002] duplicate on', t);
    return jsonError('DUPLICATE', isEmail ? messages.duplicateEmail : messages.duplicate, 409);
  }
  if (p.code === 'P2003') {
    console.error('[P2003] missing reference on', p.meta?.field_name);
    return jsonError('BAD_REFERENCE', messages.badReference, 400);
  }
  if (p.code === 'P2025') return jsonError('NOT_FOUND', messages.notFound, 404);
  console.error(error);
  return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }, { status: 500 });
}
