import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import { assertPermission } from '@/lib/security/rbac';
import { handleApiError } from '@/lib/security/http';
import { issueInvite, appOrigin } from '@/lib/security/invite';
import { writeAuditLog } from '@/lib/security/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * إعادة إرسال دعوة الحساب — رمز جديد يُبطل ما سبقه ويُرسل بالبريد.
 * يعيد الرابط أيضاً حتى يستطيع المشرف تسليمه يدوياً إن لم يكن SMTP مهيأً.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuthUser(req);
    assertPermission(actor, 'users:update');
    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, email: true } });
    if (!user?.email) return NextResponse.json({ code: 'NOT_FOUND', message: 'الحساب غير موجود أو بلا بريد' }, { status: 404 });
    // purpose=reset يرسل رسالة «إعادة تعيين كلمة المرور»، والافتراضي دعوة التفعيل
    const body = (await req.json().catch(() => ({}))) as { purpose?: string };
    const purpose = body?.purpose === 'reset' ? 'reset' : 'register';
    const invite = await issueInvite(user.id, { purpose, origin: appOrigin(req.url) });
    if (!invite) return NextResponse.json({ code: 'FAILED', message: 'تعذّر إصدار الدعوة' }, { status: 400 });
    await writeAuditLog({
      actorUserId: actor.id,
      action: purpose === 'reset' ? 'password_reset_sent' : 'invite_resent',
      resourceType: 'user',
      resourceId: user.id,
    });
    return NextResponse.json({ link: invite.link, expiresAt: invite.expiresAt, emailed: invite.emailed, purpose });
  } catch (e) {
    return handleApiError(e);
  }
}
