import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/security/auth';
import {
  canAccessAllEntities,
  isStreamGlobalRole,
  isEntityGlobalRole,
  type AuthUser,
} from '@/lib/security/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compatibility endpoint for the V3 prototype state blob. Global roles read
// and write the blob whole. Non-global roles get a SCOPED view of the items
// and their writes are MERGED: only items inside their scope are accepted or
// removed — everything outside it (other entities' items, other streams,
// site content, program config) is preserved untouched. That way a
// coordinator's browser can never clobber or read the cross-entity state.

type BlobItem = {
  id?: string;
  path?: string;
  entity?: string;
  wf?: string;
  teamUp?: boolean;
  [k: string]: unknown;
};
type LogEntry = { at?: number; by?: string; action?: string; target?: string; [k: string]: unknown };

type Scope =
  | { kind: 'all' }
  | { kind: 'stream'; streams: string[] }
  | { kind: 'entity'; entityName: string; streams: string[] | null }
  | { kind: 'none' };

function scopeOf(user: AuthUser): Scope {
  if (canAccessAllEntities(user)) return { kind: 'all' };
  if (isStreamGlobalRole(user)) {
    const streams = user.streamScopes.length
      ? user.streamScopes
      : user.streamId
        ? [user.streamId]
        : [];
    return { kind: 'stream', streams };
  }
  const isCoord = user.roles.includes('entity_coordinator');
  if (user.entityName && (isEntityGlobalRole(user) || isCoord)) {
    // ممثل الجهة/مشرفها: كل مسارات جهته. المنسق: جهته ضمن مساراته فقط —
    // حتى لا يلمس حفظُه مدخلات منسق آخر في الجهة نفسها
    const streams = user.streamScopes.length
      ? user.streamScopes
      : user.streamId
        ? [user.streamId]
        : [];
    return { kind: 'entity', entityName: user.entityName, streams: isCoord ? streams : null };
  }
  return { kind: 'none' };
}

// what this user's board is allowed to SEE
function readable(scope: Scope, i: BlobItem): boolean {
  if (scope.kind === 'all') return true;
  if (scope.kind === 'stream')
    // مسودات الجهات خاصة بها — رئيس المسار يرى المُرسل فما بعده
    return scope.streams.includes(i.path || '') && i.wf !== 'draft';
  if (scope.kind === 'entity')
    return (
      (i.entity || '') === scope.entityName &&
      (!scope.streams || scope.streams.length === 0 || scope.streams.includes(i.path || ''))
    );
  return false;
}

// what this user's save is allowed to ADD or REPLACE
function writeAcceptable(scope: Scope, i: BlobItem): boolean {
  if (scope.kind === 'all') return true;
  if (scope.kind === 'stream')
    // رفع الفريق بالنيابة عن جهة يُنشئ مسودات لدى الجهة (teamUp) — تُقبل
    return scope.streams.includes(i.path || '') && (i.wf !== 'draft' || i.teamUp === true);
  return readable(scope, i);
}

const logKey = (e: LogEntry) => [e.at, e.by, e.action, e.target].map((v) => String(v ?? '')).join('§');

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    const row = await prisma.appState.findUnique({ where: { id: 'singleton' } });
    const blob = (row?.data ?? null) as Record<string, unknown> | null;
    if (canAccessAllEntities(user)) return NextResponse.json({ data: blob });
    if (!blob) return NextResponse.json({ data: null, scoped: true });
    const scope = scopeOf(user);
    const items = Array.isArray(blob.items) ? (blob.items as BlobItem[]) : [];
    return NextResponse.json({
      scoped: true,
      data: {
        ...blob,
        items: items.filter((i) => readable(scope, i)),
        // خارج نطاق الأدوار غير الشاملة: حسابات الواجهة القديمة وسجل
        // التغييرات الشامل واستفسارات الزوار (لها /api/contact بضوابطها)
        users: [],
        changeLog: [],
        inquiries: [],
      },
    });
  } catch {
    return NextResponse.json({ data: null, error: 'unauthenticated' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  const required = process.env.STATE_API_TOKEN;
  if (required && req.headers.get('authorization') !== `Bearer ${required}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let user: AuthUser;
  try {
    user = await requireAuthUser(req);
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const len = Number(req.headers.get('content-length') || 0);
  // 10MB: the state blob now carries the admin-edited public-site content,
  // including compressed images (news/history/covers) stored as data URLs.
  if (len > 10_000_000) return NextResponse.json({ error: 'payload-too-large' }, { status: 413 });

  let data: unknown;
  try { data = await req.json(); } catch { return NextResponse.json({ error: 'bad-request' }, { status: 400 }); }
  if (data === null || typeof data !== 'object') return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  const d = data as Record<string, unknown>;

  try {
    const row = await prisma.appState.findUnique({ where: { id: 'singleton' } }).catch(() => null);
    const prev = (row?.data ?? null) as Record<string, unknown> | null;

    if (canAccessAllEntities(user)) {
      // استفسارات «تواصل معنا» تُضاف من /api/contact مباشرة إلى الكتلة؛ دمجها
      // بالاتحاد هنا يمنع نسخة المتصفح الأقدم من مسح استفسارات وصلت بعدها
      // (المعرّف الوارد يغلب لنفس الاستفسار حتى تنحفظ حالة «تمت المعالجة»).
      try {
        const incoming = Array.isArray(d.inquiries) ? (d.inquiries as { id: string }[]) : [];
        const existing = prev && Array.isArray(prev.inquiries) ? (prev.inquiries as { id: string }[]) : [];
        const seen = new Set(incoming.map((q) => q.id));
        d.inquiries = [...existing.filter((q) => !seen.has(q.id)), ...incoming];
      } catch {
        /* merge best-effort — تبقى الكتابة كما وردت */
      }
      await prisma.appState.upsert({ where: { id: 'singleton' }, update: { data: d as object }, create: { id: 'singleton', data: d as object } });
      return NextResponse.json({ ok: true });
    }

    // ---- الأدوار غير الشاملة: دمج نطاقي — المدخلات داخل النطاق فقط ----
    const scope = scopeOf(user);
    const prevItems = prev && Array.isArray(prev.items) ? (prev.items as BlobItem[]) : [];
    const incoming = (Array.isArray(d.items) ? (d.items as BlobItem[]) : []).filter((i) =>
      writeAcceptable(scope, i)
    );
    const incomingIds = new Set(incoming.map((i) => i.id));
    // القائم خارج نطاق رؤيته يبقى؛ القائم داخل نطاقه: يُستبدل بالوارد إن
    // وُجد بمعرّفه، ويُحذف إن غاب (حذفه المستخدم من لوحته). الحذف بالغياب
    // لأدوار الجهة فقط — رئيس المسار يعدّل الحالات ولا يحذف، فمتصفحه غير
    // المحدّث لا يمسح إرسالات وصلت بعد آخر تحميل لديه
    const dropByAbsence = scope.kind === 'entity';
    const keptItems = prevItems.filter(
      (i) => !incomingIds.has(i.id) && (!dropByAbsence || !readable(scope, i))
    );
    // سجل التغييرات: اتحاد — تُضاف قيود المستخدم الجديدة فوق السجل القائم
    const prevLog = prev && Array.isArray(prev.changeLog) ? (prev.changeLog as LogEntry[]) : [];
    const seenLog = new Set(prevLog.map(logKey));
    const newLog = (Array.isArray(d.changeLog) ? (d.changeLog as LogEntry[]) : []).filter(
      (e) => !seenLog.has(logKey(e))
    );
    const mergedLog = [...newLog, ...prevLog]
      .sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0))
      .slice(0, 1000);
    const merged: Record<string, unknown> = {
      ...(prev || { seedV: d.seedV }),
      items: [...incoming, ...keptItems],
      changeLog: mergedLog,
    };
    await prisma.appState.upsert({ where: { id: 'singleton' }, update: { data: merged as object }, create: { id: 'singleton', data: merged as object } });
    return NextResponse.json({ ok: true, scoped: true });
  } catch { return NextResponse.json({ ok: false, error: 'db' }, { status: 500 }); }
}
