import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertPermission } from '@/lib/security/rbac';
import { handleApiError } from '@/lib/security/http';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
/**
 * الأدوار كما هي في قاعدة البيانات — إضافتها وتسميتها وصلاحياتها كلها بيانات
 * تديرها IT في القاعدة، ولا قائمة أدوار في الشيفرة.
 *
 * `scope` يخبر لوحة المشرف بالحقول التي يطلبها كل دور (جهة؟ مسارات؟). يُقرأ من
 * جدول الإعدادات القائم بمفتاح `role_scope:<code>` وقيمته إحدى:
 *   global | stream | entity | entity_stream | none
 * ومتى لم يوجد إسناد يُشتق تلقائياً من صلاحيات الدور نفسها. وهو إرشاد للواجهة
 * فقط — الصلاحية الفعلية تبقى محروسة في الخادم ولا تُقرأ من إعداد قابل للتعديل.
 */
function scopeFromPermissions(perms: string[]): string {
  const has = (p: string) => perms.includes(p);
  if (has('users:view') || has('roles:assign') || has('funding:approve')) return 'global';
  if (has('items:approve')) return 'stream';
  if (has('items:create')) return 'entity_stream';
  if (has('items:view')) return 'entity';
  return 'none';
}

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthUser(req);
    assertPermission(u, 'roles:view');
    const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { code: 'asc' } });
    const overrides = await prisma.setting.findMany({ where: { key: { startsWith: 'role_scope:' } } });
    const byCode = new Map(overrides.map((o) => [o.key.slice('role_scope:'.length), String(o.value || '').trim()]));
    const VALID = ['global', 'stream', 'entity', 'entity_stream', 'none'];
    return NextResponse.json({
      roles: roles.map((r) => {
        const permissions = r.permissions.map((p) => p.permission.code);
        const override = byCode.get(r.code) || '';
        return {
          id: r.id,
          code: r.code,
          nameAr: r.nameAr,
          permissions,
          scope: VALID.includes(override) ? override : scopeFromPermissions(permissions),
        };
      }),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
