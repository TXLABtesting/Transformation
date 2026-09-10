// ============================================================================
// كلمات المرور ورموز الدعوة — الجانب الأمني
// ----------------------------------------------------------------------------
// • التجزئة: scrypt من مكتبة Node نفسها (بلا اعتمادية خارجية) بملح عشوائي لكل
//   كلمة مرور، والمقارنة بزمن ثابت (timingSafeEqual) فلا تُستدل الكلمة بالتوقيت.
// • رمز الدعوة: 32 بايت عشوائية تُرسل بالبريد، ولا يُخزَّن منها في القاعدة إلا
//   بصمة sha256 — فتسريب القاعدة لا يمنح أحداً رمزاً صالحاً.
// • سياسة الكلمة: 10 محارف فأكثر بحروف وأرقام، وترفض المتسلسل والمكرر والشائع.
// ============================================================================
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (p: string | Buffer, s: string | Buffer, k: number, o?: object) => Promise<Buffer>;

// معاملات scrypt (تكلفة الذاكرة 16 ميغابايت لكل محاولة — تُبطئ التخمين كثيراً)
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;

/** بصمة كلمة المرور بصيغة scrypt$N$r$p$salt$hash (كلها base64url) */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(plain.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

/** تحقق بزمن ثابت — يعيد false لأي بصمة غير مفهومة بدل أن يرمي */
export async function verifyPassword(plain: string, stored?: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  try {
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(hashB64, 'base64url');
    const key = await scrypt(plain.normalize('NFKC'), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** رمز دعوة عشوائي + بصمته (لا يُخزَّن إلا الأخيرة) */
export function newAuthToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export const hashToken = (token: string): string => createHash('sha256').update(String(token || '')).digest('hex');

const COMMON = [
  'password', '12345678', '123456789', '1234567890', 'qwertyui', 'iloveyou', 'admin123',
  'welcome1', 'passw0rd', 'letmein1', 'uaepass1', 'aigp1234', 'ai123456',
];

/** فحص سياسة كلمة المرور — يعيد رسالة الخطأ أو null إن كانت مقبولة */
export function passwordPolicyError(plain: string): string | null {
  const v = String(plain || '').normalize('NFKC');
  if (v.length < 10) return 'كلمة المرور 10 محارف على الأقل';
  if (v.length > 128) return 'كلمة المرور طويلة جداً';
  if (/\s/.test(v)) return 'كلمة المرور لا تحتوي مسافات';
  if (!/[A-Za-z؀-ۿ]/.test(v)) return 'أضف حرفاً واحداً على الأقل';
  if (!/\d/.test(v)) return 'أضف رقماً واحداً على الأقل';
  const low = v.toLowerCase();
  if (COMMON.some((c) => low.includes(c))) return 'كلمة المرور شائعة جداً — اختر غيرها';
  if (/(.)\1{3,}/.test(v)) return 'كلمة المرور فيها تكرار طويل لمحرف واحد — اختر غيرها';
  if (new Set(v).size < 5) return 'كلمة المرور تتكوّن من محارف قليلة متكررة — نوّعها';
  // متسلسلة: 12345678 / abcdefgh
  const seq = (s: string) => {
    let run = 1;
    for (let i = 1; i < s.length; i++) {
      run = s.charCodeAt(i) - s.charCodeAt(i - 1) === 1 ? run + 1 : 1;
      if (run >= 6) return true;
    }
    return false;
  };
  if (seq(low)) return 'كلمة المرور متسلسلة — اختر غيرها';
  return null;
}

/** مدة صلاحية رمز الدعوة */
export const INVITE_TTL_HOURS = Number(process.env.INVITE_TTL_HOURS || 168); // 7 أيام

/** قفل الحساب بعد محاولات فاشلة متتالية */
export const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
export const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);
