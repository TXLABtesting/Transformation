import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { handleApiError } from '@/lib/security/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * سجل الجهات الفعّالة — للقوائم المنسدلة في كل الشاشات (اختيار الجهة، الرفع
 * بالنيابة، مرشّح الجهات). القراءة متاحة لكل مستخدم مسجَّل: الأسماء وحدها ليست
 * بيانات مقيَّدة، والوصول إلى مدخلات أي جهة يبقى محروساً في مكانه.
 * إدارة السجل (إضافة/تعديل/حذف) في /api/admin/entities.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuthUser(req);
    const entities = await prisma.entity.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      select: { id: true, nameAr: true, category: true },
    });
    return NextResponse.json({ entities });
  } catch (e) {
    return handleApiError(e);
  }
}
