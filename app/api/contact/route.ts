import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { canAccessAllEntities } from '@/lib/security/rbac';
import { DEFAULT_CONTACT_EMAILS, CONTACT_STREAMS } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// استفسارات «تواصل معنا»
// POST (عام بلا جلسة): يستقبل استفسار الزائر، يخزّنه في كتلة الحالة حتى يظهر
//   في لوحة المشرف وصناديق المسارات، ويرسله بالبريد إلى عنوان المسار المعيّن
//   في «التواصل والاستفسارات» متى كان SMTP مهيأً (متغيرات SMTP_*).
// GET: قائمة الاستفسارات (للوحات) · PATCH: تبديل حالة المعالجة.
// ---------------------------------------------------------------------------

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  stream: string;
  message: string;
  ts: number;
  done: boolean;
};

const STREAM_KEYS = new Set(CONTACT_STREAMS.map((c) => c.key));
const MAX_INQUIRIES = 500;

const streamLabel = (k: string) => CONTACT_STREAMS.find((c) => c.key === k)?.label || k;

async function readBlob(): Promise<Record<string, unknown>> {
  const row = await prisma.appState.findUnique({ where: { id: 'singleton' } });
  return ((row?.data as Record<string, unknown>) ?? {}) as Record<string, unknown>;
}

async function writeBlob(data: Record<string, unknown>) {
  await prisma.appState.upsert({
    where: { id: 'singleton' },
    update: { data: data as object },
    create: { id: 'singleton', data: data as object },
  });
}

/** إرسال بريد الاستفسار لعنوان المسار — يعمل فقط عند تهيئة SMTP_HOST */
async function sendInquiryMail(q: Inquiry, contactEmails: Record<string, string>) {
  const host = process.env.SMTP_HOST;
  if (!host) return;
  const to = (contactEmails[q.stream] || DEFAULT_CONTACT_EMAILS[q.stream] || '').trim();
  if (!to) return;
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === '1',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@aigp.gov.ae',
      to,
      subject: 'استفسار عبر منصة الذكاء الاصطناعي المساعد — ' + streamLabel(q.stream),
      text: [
        'الاسم: ' + q.name,
        q.phone ? 'رقم الهاتف: ' + q.phone : '',
        'البريد الإلكتروني: ' + q.email,
        'المسار المعني: ' + streamLabel(q.stream),
        '',
        q.message,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (e) {
    // فشل البريد لا يمنع تسجيل الاستفسار — يبقى ظاهراً في اللوحة
    console.error('contact mail failed', e);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  const q: Inquiry = {
    id: 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: str(body.name, 120),
    phone: str(body.phone, 40),
    email: str(body.email, 160),
    stream: str(body.stream, 40),
    message: str(body.message, 4000),
    ts: Date.now(),
    done: false,
  };
  if (!q.name || !q.email || !q.message || !STREAM_KEYS.has(q.stream)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  let contactEmails: Record<string, string> = {};
  try {
    const blob = await readBlob();
    contactEmails =
      blob.contactEmails && typeof blob.contactEmails === 'object'
        ? (blob.contactEmails as Record<string, string>)
        : {};
    const existing = Array.isArray(blob.inquiries) ? (blob.inquiries as Inquiry[]) : [];
    blob.inquiries = [q, ...existing].slice(0, MAX_INQUIRIES);
    await writeBlob(blob);
  } catch (e) {
    console.error('contact store failed', e);
  }
  await sendInquiryMail(q, contactEmails);
  return NextResponse.json({ ok: true });
}

// الاطلاع على الاستفسارات (بيانات شخصية) للمشرف/النطاق الشامل فقط —
// الفرق تستقبلها عبر بريد المسار
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    if (!canAccessAllEntities(user)) return NextResponse.json({ inquiries: [] });
  } catch {
    return NextResponse.json({ inquiries: [], error: 'unauthenticated' }, { status: 401 });
  }
  try {
    const blob = await readBlob();
    const list = Array.isArray(blob.inquiries) ? (blob.inquiries as Inquiry[]) : [];
    return NextResponse.json({ inquiries: list });
  } catch {
    return NextResponse.json({ inquiries: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    if (!canAccessAllEntities(user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  let body: { id?: string; done?: boolean };
  try {
    body = (await req.json()) as { id?: string; done?: boolean };
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const blob = await readBlob();
    const list = Array.isArray(blob.inquiries) ? (blob.inquiries as Inquiry[]) : [];
    blob.inquiries = list.map((x) => (x.id === body.id ? { ...x, done: !!body.done } : x));
    await writeBlob(blob);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
