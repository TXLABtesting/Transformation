// ============================================================================
// إصدار دعوة الحساب — رمز لمرة واحدة يُرسل بالبريد
// ----------------------------------------------------------------------------
// يُستدعى عند إنشاء الحساب من لوحة المشرف، وعند «إعادة إرسال الدعوة»، وعند
// طلب استعادة كلمة المرور. إصدار رمز جديد يُبطل رموز المستخدم السابقة.
// ============================================================================
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { env } from './env';
import { newAuthToken, INVITE_TTL_HOURS } from './password';
import { sendInviteMail } from './mailer';

type Db = Prisma.TransactionClient | PrismaClient;

/** أصل الموقع لبناء الروابط: APP_BASE_URL أولاً ثم أصل الطلب */
export function appOrigin(reqUrl?: string): string {
  if (env.appBaseUrl) return env.appBaseUrl;
  try {
    return reqUrl ? new URL(reqUrl).origin : '';
  } catch {
    return '';
  }
}

export type IssuedInvite = { link: string; expiresAt: Date; emailed: boolean };

/**
 * إصدار رمز جديد للمستخدم وإرسال الدعوة إليه.
 * يعيد الرابط حتى يستطيع المشرف نسخه إن لم يكن البريد مهيأً.
 */
export async function issueInvite(
  userId: string,
  opts: { purpose?: 'register' | 'reset'; origin?: string; db?: Db } = {}
): Promise<IssuedInvite | null> {
  const db = opts.db || prisma;
  const purpose = opts.purpose || 'register';
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email) return null;

  // رمز واحد صالح لكل مستخدم: ما سبق يُبطل فور إصدار الجديد
  await db.authToken.deleteMany({ where: { userId, usedAt: null } });
  const { token, tokenHash } = newAuthToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
  await db.authToken.create({ data: { userId, tokenHash, purpose, expiresAt } });

  const base = (opts.origin || appOrigin()) + (process.env.NEXT_PUBLIC_BASE_PATH || '');
  const link = `${base}/register?token=${encodeURIComponent(token)}`;
  const emailed = await sendInviteMail({
    to: user.email,
    name: user.name || '',
    link,
    purpose,
    ttlHours: INVITE_TTL_HOURS,
  });
  return { link, expiresAt, emailed };
}
