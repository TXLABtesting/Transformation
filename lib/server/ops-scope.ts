// تخصصات مسار العمليات المسندة للمستخدم — للمسار منسقان (عمليات الدعم
// المؤسسي، والعمليات التخصصية) ويُسند الحساب لأحدهما أو لكليهما.
// تُخزَّن في جدول الإعدادات القائم بمفتاح ops_scope:<userId> بلا أي تغيير في البنية.
import { prisma } from '@/lib/prisma';

export const opsScopeKey = (userId: string) => 'ops_scope:' + userId;

export async function readOpsScopes(userId: string): Promise<string[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: opsScopeKey(userId) } });
    return String(row?.value || '').split('|').map((v) => v.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
