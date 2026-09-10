import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/security/session';
import { hashToken, hashPassword, passwordPolicyError } from '@/lib/security/password';
import { writeAuditLog } from '@/lib/security/audit';
import { hitRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// استكمال التسجيل بالدعوة
// ----------------------------------------------------------------------------
// خطوتان بالرمز نفسه المرسل بالبريد:
//   verify   — التحقق من الرمز ومطابقة البريد المسجَّل
//   complete — تعيين كلمة المرور وفتح الجلسة
// الرمز هو السر: لا يكشف أي منهما وجود بريد من عدمه، والرسائل موحّدة.
// ============================================================================

const clean = (v: unknown) => String(v ?? '').trim();
const lower = (v: unknown) => clean(v).toLowerCase();
const GENERIC = 'الرابط غير صالح أو منتهي، أو البريد لا يطابق الدعوة.';
const fail = (status = 400, message = GENERIC) => NextResponse.json({ code: 'INVALID', message }, { status });

async function loadInvite(token: string) {
  if (!token) return null;
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  if (!row.user || !row.user.email) return null;
  return row;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!hitRateLimit('register:' + ip, 20, 10 * 60_000)) {
      return NextResponse.json({ code: 'RATE_LIMIT', message: 'محاولات كثيرة — أعد المحاولة بعد قليل.' }, { status: 429 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const step = clean(body.step) || 'verify';
    const row = await loadInvite(clean(body.token));
    if (!row) return fail();
    // البريد المُدخل يجب أن يطابق بريد الدعوة نفسه
    if (lower(body.email) !== lower(row.user.email)) return fail();
    if (!row.user.accessEnabled && row.user.status !== 'pending') return fail(403, 'الحساب غير مفعّل — تواصل مع مشرف النظام.');

    if (step === 'verify') {
      return NextResponse.json({
        ok: true,
        name: row.user.name || '',
        // إعادة تعيين لحساب سبق أن ضبط كلمته
        mode: row.purpose === 'reset' || row.user.passwordHash ? 'reset' : 'register',
      });
    }

    if (step !== 'complete') return fail();
    const password = String(body.password ?? '');
    if (password !== String(body.confirm ?? '')) return fail(400, 'كلمتا المرور غير متطابقتين');
    const policy = passwordPolicyError(password);
    if (policy) return fail(400, policy);

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: row.userId },
        data: {
          passwordHash,
          passwordSetAt: new Date(),
          failedLogins: 0,
          lockedUntil: null,
          // الدعوة تُفعّل الحساب: أنشأه المشرف وأرسلها له
          status: 'active',
          accessEnabled: true,
          isActive: true,
          lastLogin: new Date(),
        },
      });
      await tx.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
      await tx.authToken.deleteMany({ where: { userId: row.userId, usedAt: null } });
      return u;
    });
    await writeAuditLog({ actorUserId: user.id, action: 'password_set', resourceType: 'user', resourceId: user.id });

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, { userId: user.id, email: user.email || '', provider: 'password' });
    return res;
  } catch {
    return fail(400);
  }
}
