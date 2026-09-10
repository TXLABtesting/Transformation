// ============================================================================
// البريد الصادر من المنصة — دعوة الحساب واستعادة كلمة المرور
// ----------------------------------------------------------------------------
// القالب مطابق لنموذج الوزارة المعتمد: شعار المشروع، ثم نص إنجليزي فعربي،
// ثم زر الدخول إلى المنصة، ثم بريد التواصل. يُرسل بصيغتي HTML ونص عادي.
// يعمل متى هُيّئ SMTP_HOST؛ وبدونه لا يفشل الإجراء — يُسجَّل تعذّر الإرسال
// ويستطيع المشرف نسخ رابط الدعوة من اللوحة.
// ============================================================================

export const CONTACT_EMAIL = process.env.SUPPORT_EMAIL || 'agentic.ai@moca.gov.ae';

const BRAND = {
  navy: '#13213C',
  blue: '#1F5FE0',
  ink: '#33415C',
  muted: '#6B7A93',
  line: '#E7ECF4',
};

export type InviteMail = {
  to: string;
  name?: string;
  /** رابط استكمال التسجيل (يحمل رمز الدعوة) */
  link: string;
  purpose?: 'register' | 'reset';
  /** مدة صلاحية الرابط بالساعات — تُذكر في الرسالة */
  ttlHours?: number;
};

const esc = (v: string) =>
  String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export function inviteSubject(purpose: 'register' | 'reset' = 'register'): string {
  return purpose === 'reset'
    ? 'إعادة تعيين كلمة المرور — منصة مشروع الذكاء الاصطناعي المساعد'
    : 'دعوة لاستخدام منصة مشروع الذكاء الاصطناعي المساعد';
}

/** نص الرسالة (بديل HTML لعملاء البريد النصية) */
export function inviteText(m: InviteMail): string {
  const reset = m.purpose === 'reset';
  return [
    reset
      ? 'A request was made to reset your password. Please use the link below to set a new password.'
      : 'We are pleased to inform you that you have been invited to use our platform. Please use the link below to set your password and log in to the platform.',
    reset
      ? 'تم طلب إعادة تعيين كلمة المرور الخاصة بكم. يرجى استخدام الرابط أدناه لتعيين كلمة مرور جديدة.'
      : 'يسرّنا دعوتكم لاستخدام منصتنا. يرجى استخدام الرابط أدناه لتعيين كلمة المرور الخاصة بكم وتسجيل الدخول إلى المنصة.',
    '',
    m.link,
    '',
    'الرابط صالح لمدة ' + (m.ttlHours || 168) + ' ساعة ولمرة واحدة.',
    '',
    'للتواصل والاستفسارات:',
    CONTACT_EMAIL,
  ].join('\n');
}

/** قالب الرسالة كما في النموذج المعتمد */
export function inviteHtml(m: InviteMail, logoCid?: string): string {
  const reset = m.purpose === 'reset';
  const logo = logoCid
    ? `<img src="cid:${logoCid}" alt="مشروع الذكاء الاصطناعي المساعد" style="height:54px;display:block;margin:0 auto 26px" />`
    : '';
  const en = reset
    ? 'A request was made to reset your password. Please use the button below to set a new password.'
    : 'We are pleased to inform you that you have been invited to use our platform. Please use the button below to set your password and log in to the platform.';
  const ar = reset
    ? 'تم طلب إعادة تعيين كلمة المرور الخاصة بكم. يرجى استخدام الزر أدناه لتعيين كلمة مرور جديدة.'
    : 'يسرّنا دعوتكم لاستخدام منصتنا. يرجى استخدام الزر أدناه لتعيين كلمة المرور الخاصة بكم وتسجيل الدخول إلى المنصة.';
  const cta = reset ? 'تعيين كلمة مرور جديدة' : 'تعيين كلمة المرور والدخول';
  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(inviteSubject(m.purpose))}</title></head>
<body style="margin:0;padding:0;background:#F1F4F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F4F9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${BRAND.line};border-radius:18px;padding:34px 30px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
        <tr><td align="center">${logo}</td></tr>
        <tr><td align="center" dir="ltr" style="font-size:14.5px;line-height:1.85;color:${BRAND.ink};padding-bottom:14px;">${esc(en)}</td></tr>
        <tr><td align="center" dir="rtl" style="font-size:15px;line-height:1.95;color:${BRAND.navy};font-weight:700;padding-bottom:26px;">${esc(ar)}</td></tr>
        <tr><td align="center" style="padding-bottom:22px;">
          <a href="${esc(m.link)}" style="display:inline-block;background:${BRAND.blue};color:#fff;text-decoration:none;font-size:14.5px;font-weight:700;padding:13px 30px;border-radius:11px;">${esc(cta)}</a>
        </td></tr>
        <tr><td align="center" style="font-size:12px;color:${BRAND.muted};line-height:1.9;padding-bottom:8px;">
          الرابط صالح لمدة ${esc(String(m.ttlHours || 168))} ساعة ولمرة واحدة.<br />
          إن تعذّر فتح الزر، انسخ الرابط التالي إلى المتصفح:
        </td></tr>
        <tr><td align="center" dir="ltr" style="font-size:11.5px;color:${BRAND.blue};word-break:break-all;padding-bottom:24px;">${esc(m.link)}</td></tr>
        <tr><td style="border-top:1px solid ${BRAND.line};padding-top:18px;" align="center">
          <div style="font-size:12.5px;color:${BRAND.ink};font-weight:700;">للتواصل والاستفسارات:</div>
          <a href="mailto:${esc(CONTACT_EMAIL)}" dir="ltr" style="font-size:13px;color:${BRAND.blue};text-decoration:none;">${esc(CONTACT_EMAIL)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * إرسال الدعوة. يعيد true عند الإرسال الفعلي، وfalse إن لم يكن SMTP مهيأً
 * أو تعذّر الإرسال (فيبقى الرابط متاحاً للنسخ من لوحة المشرف).
 */
export async function sendInviteMail(m: InviteMail): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host || !m.to) return false;
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === '1',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    });
    // الشعار يُرفق بالرسالة نفسها (cid) فيظهر بلا اتصال بخادم خارجي
    const path = require('path') as typeof import('path');
    const fs = require('fs') as typeof import('fs');
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'web', 'logo-full-z.png');
    const hasLogo = fs.existsSync(logoPath);
    const cid = 'aigp-logo';
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@aigp.gov.ae',
      to: m.to,
      subject: inviteSubject(m.purpose),
      text: inviteText(m),
      html: inviteHtml(m, hasLogo ? cid : undefined),
      attachments: hasLogo ? [{ filename: 'logo.png', path: logoPath, cid }] : undefined,
    });
    return true;
  } catch (e) {
    console.error('invite mail failed', e);
    return false;
  }
}
