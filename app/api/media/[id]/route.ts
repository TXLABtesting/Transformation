import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { canAccessAllEntities } from '@/lib/security/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قراءة عامة لوسائط الموقع (محتوى منشور للزوار). المعرّف عشوائي وغير قابل
// للتخمين، والاستجابة تُخدم بترويسات تخزين مؤقت دائمة لأن الاستبدال يُنشئ
// معرّفاً جديداً — فلا يتحمّل الخادم إلا أول طلب من كل متصفح.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = String(params.id || '');
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const row = await prisma.siteMedia.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const data = Buffer.from(row.bytes);
  const total = data.length;
  const headers: Record<string, string> = {
    'Content-Type': row.mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: `"${row.id}"`,
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };

  if (req.headers.get('if-none-match') === `"${row.id}"`) {
    return new NextResponse(null, { status: 304, headers });
  }

  // دعم Range ضروري لتشغيل الفيديو والتنقل داخله دون تنزيل الملف كاملاً
  const range = req.headers.get('range');
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      const start = m[1] ? parseInt(m[1], 10) : Math.max(0, total - parseInt(m[2], 10));
      const end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      if (start <= end && start < total) {
        const chunk = data.subarray(start, end + 1);
        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            ...headers,
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Content-Length': String(chunk.length),
          },
        });
      }
      return new NextResponse(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${total}` } });
    }
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: { ...headers, 'Content-Length': String(total) },
  });
}

// الحذف لمشرف النظام — تستدعيه اللوحة عند استبدال ملف أو الاستغناء عنه
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuthUser(req);
    if (!canAccessAllEntities(user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  try {
    await prisma.siteMedia.delete({ where: { id: String(params.id || '') } });
    return NextResponse.json({ ok: true });
  } catch {
    // الملف غير موجود أصلاً — النتيجة النهائية واحدة
    return NextResponse.json({ ok: true });
  }
}
