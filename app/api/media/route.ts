import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { canAccessAllEntities } from '@/lib/security/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// مخزن وسائط الموقع العام — رفع مرفقات لوحة المشرف (صور وفيديو الصفحات
// العامة) كما هي وبجودتها الكاملة. الرفع والحذف لمشرف النظام حصراً؛ القراءة
// عامة من /api/media/:id (الملفات محتوى منشور للزوار) بترويسات تخزين دائمة.
// ---------------------------------------------------------------------------

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);
const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    if (!canAccessAllEntities(user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const mime = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED.has(mime)) return NextResponse.json({ error: 'unsupported-type' }, { status: 415 });
  const cap = mime.startsWith('video/') ? MAX_VIDEO : MAX_IMAGE;

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > cap) return NextResponse.json({ error: 'payload-too-large' }, { status: 413 });

  let buf: Buffer;
  try {
    buf = Buffer.from(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  if (!buf.length) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (buf.length > cap) return NextResponse.json({ error: 'payload-too-large' }, { status: 413 });

  const name = (new URL(req.url).searchParams.get('name') || '').slice(0, 200);
  try {
    const row = await prisma.siteMedia.create({
      data: { mime, name, size: buf.length, bytes: buf },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: row.id, url: `/api/media/${row.id}` });
  } catch (e) {
    console.error('media store failed', e);
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }
}
