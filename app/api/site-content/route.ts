import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// المحتوى العام للموقع — قراءة عامة بلا جلسة (الصفحة الرئيسية ومن نحن
// والمنشورات صفحات عامة للزوار). يُعاد جزء آمن فقط من كتلة الحالة: محتوى
// الموقع الذي يحرره المشرف ووثائق المنشورات والنص التعريفي — لا بيانات
// المسارات أو الجهات أو المستخدمين. الكتابة تبقى عبر ‎/api/state‎ بصلاحياتها.
export async function GET() {
  try {
    const row = await prisma.appState.findUnique({ where: { id: 'singleton' } });
    const d = (row?.data ?? null) as Record<string, unknown> | null;
    if (!d) return NextResponse.json({ data: null });
    return NextResponse.json(
      {
        data: {
          site: d.site ?? null,
          aboutHero: d.aboutHero ?? null,
          libraryDocs: d.libraryDocs ?? null,
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  } catch {
    return NextResponse.json({ data: null });
  }
}
