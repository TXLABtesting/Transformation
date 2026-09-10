import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/security/session';
import { verifyPassword, LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_MINUTES } from '@/lib/security/password';
import { writeAuditLog } from '@/lib/security/audit';
import { hitRateLimit } from '@/lib/security/rate-limit';
import { issueInvite, appOrigin } from '@/lib/security/invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// الدخول بالبريد وكلمة المرور + طلب استعادة كلمة المرور
// ----------------------------------------------------------------------------
// • رسالة واحدة لكل فشل مهما كان سببه — لا يُستدل منها على وجود الحساب.
// • قفل الحساب بعد محاولات فاشلة متتالية، وحد للمحاولات لكل عنوان IP.
// • كل محاولة تُسجَّل في سجل التدقيق.
// ============================================================================

const lower = (v: unknown) => String(v ?? '').trim().toLowerCase();
const BAD = NextResponse.json({ code: 'INVALID', message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, { status: 401 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? 'login');
    const email = lower(body.email);

    // استعادة كلمة المرور: الرد واحد دائماً حتى لا يُكشف وجود البريد
    if (action === 'forgot') {
      if (!hitRateLimit('forgot:' + ip, 5, 15 * 60_000)) {
        return NextResponse.json({ code: 'RATE_LIMIT', message: 'محاولات كثيرة — أعد المحاولة بعد قليل.' }, { status: 429 });
      }
      const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
      if (user && user.accessEnabled) {
        await issueInvite(user.id, { purpose: 'reset', origin: appOrigin(req.url) });
        await writeAuditLog({ actorUserId: user.id, action: 'password_reset_requested', resourceType: 'user', resourceId: user.id });
      }
      return NextResponse.json({ ok: true });
    }

    if (!hitRateLimit('login:' + ip, 20, 10 * 60_000)) {
      return NextResponse.json({ code: 'RATE_LIMIT', message: 'محاولات كثيرة — أعد المحاولة بعد قليل.' }, { status: 429 });
    }
    const password = String(body.password ?? '');
    if (!email || !password) return BAD;

    const user = await prisma.user.findUnique({ where: { email } });
    // مقارنة تتم دائماً (ولو لم يوجد الحساب) حتى لا يفرّق التوقيت بين الحالتين
    const ok = await verifyPassword(password, user?.passwordHash || null);

    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const mins = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
      return NextResponse.json(
        { code: 'LOCKED', message: 'الحساب مقفل مؤقتاً لمحاولات فاشلة متكررة — أعد المحاولة بعد ' + mins + ' دقيقة.' },
        { status: 423 }
      );
    }

    if (!user || !ok || !user.passwordHash) {
      if (user) {
        const failed = user.failedLogins + 1;
        const lock = failed >= LOGIN_MAX_ATTEMPTS;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: lock ? 0 : failed,
            lockedUntil: lock ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000) : null,
          },
        });
        await writeAuditLog({
          actorUserId: user.id,
          action: lock ? 'login_locked' : 'login_failed',
          resourceType: 'user',
          resourceId: user.id,
          metadata: { ip },
        });
      }
      return BAD;
    }

    if (!user.accessEnabled || user.status !== 'active') {
      return NextResponse.json({ code: 'DISABLED', message: 'الحساب غير مفعّل — تواصل مع مشرف النظام.' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLogin: new Date() },
    });
    await writeAuditLog({ actorUserId: user.id, action: 'login_password', resourceType: 'user', resourceId: user.id, metadata: { ip } });

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, { userId: user.id, email: user.email || '', provider: 'password' });
    return res;
  } catch {
    return BAD;
  }
}
