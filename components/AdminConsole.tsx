'use client';
// ---------------------------------------------------------------------------
// Admin console (لوحة المشرف): the system administrator manages users & roles,
// and specifically assigns the stream heads (رؤساء المسارات) and the national
// committee (اللجنة الوطنية). Coordinators are provisioned by the entity rep
// in team setup, so they appear here read-only for oversight.
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { DOC_CATS, type DocCat, CONTACT_STREAMS } from '@/lib/domain';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import type { RoleKey, UserRec } from '@/lib/domain';
import { downloadUsersTemplate, readSheetRows } from '@/lib/export';
import { Icon } from './Icon';

const IC_USERS = 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75';
const IC_SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const IC_STAR = 'M12 2l3 6.9 7.6.6-5.8 5 1.8 7.5L12 18l-6.4 4 1.8-7.5-5.8-5 7.6-.6z';
const IC_PLUS = 'M12 5v14M5 12h14';
const IC_EDIT = 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z';
const IC_TRASH = 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6';
const IC_CHECK = 'M20 6 9 17l-5-5';
const IC_X = 'M18 6 6 18M6 6l12 12';
const IC_UPLOAD = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';

const card: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 16 };
const labelSt: CSSProperties = { fontSize: 12, fontWeight: 700, color: '#54627B', marginBottom: 6, display: 'block' };
const inputSt: CSSProperties = {
  width: '100%', border: '1px solid #DDE5F0', borderRadius: 10, padding: '10px 12px',
  fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#16233F', outline: 'none',
};

type Tab = 'users' | 'assign' | 'roles' | 'site' | 'contact' | 'changelog';

// Only the server deployment (NEXT_PUBLIC_DATA_MODE=api) has a database and
// /api/admin/* routes behind it. The static-export/local-demo build has
// neither, so every DB-backed fetch below is gated on this flag and falls
// back to leaving local/demo state as-is.
const DB_BACKED = process.env.NEXT_PUBLIC_DATA_MODE === 'api';

// Real reference rows fetched from Postgres (see /api/admin/{entities,streams,roles}).
type DbEntity = { id: string; nameAr: string };
type DbStream = { id: string; nameAr: string };
type DbRole = { id: string; code: string; nameAr: string };

// The account being created/edited in UserEditor. Uses real DB ids
// (entityId/streamId/roleCode) instead of the free-text/legacy fields on
// UserRec, since those don't round-trip to /api/admin/users.
type UserDraft = {
  id: string; // '' = new account
  name: string;
  title: string;
  email: string;
  phone: string;
  entityId: string;
  streamId: string;
  roleCode: string; // '' = no role assigned yet
  active: boolean;
};

const blankDraft = (seed?: Partial<UserDraft>): UserDraft => ({
  id: '', name: '', title: '', email: '', phone: '', entityId: '', streamId: '', roleCode: '', active: true, ...seed,
});

const draftFromUser = (u: UserRec): UserDraft => ({
  id: u.id,
  name: u.name,
  title: u.title,
  email: u.email,
  phone: u.phone,
  entityId: u.entityId || '',
  streamId: u.streamId || '',
  roleCode: u.roleCode || '',
  active: u.active,
});

export function AdminConsole({ vm }: { vm: VM }) {
  const s = useStore();
  const a = vm.admin;
  const [tab, setTab] = useState<Tab>('users');
  const [roleFilter, setRoleFilter] = useState<RoleKey | 'all'>('all');
  const [editing, setEditing] = useState<UserDraft | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Real entities/streams/roles from the database, for the create/edit/bulk
  // forms below — the old local lists (a.entities, a.streams, a.roleInfo)
  // are display-only demo data and don't match the real tables' ids.
  const [dbEntities, setDbEntities] = useState<DbEntity[]>([]);
  const [dbStreams, setDbStreams] = useState<DbStream[]>([]);
  const [dbRoles, setDbRoles] = useState<DbRole[]>([]);

  // Pull the real user list + reference data from the database the moment
  // this console opens, instead of showing whatever demo/local rows happen
  // to be sitting in browser storage. No-ops in the static/local demo build.
  useEffect(() => {
    s.adminLoadUsers();
    if (!DB_BACKED) return;
    (async () => {
      try {
        const [eRes, sRes, rRes] = await Promise.all([
          fetch('/api/admin/entities', { credentials: 'include' }),
          fetch('/api/admin/streams', { credentials: 'include' }),
          fetch('/api/admin/roles', { credentials: 'include' }),
        ]);
        if (eRes.ok) setDbEntities((await eRes.json()).entities || []);
        if (sRes.ok) setDbStreams((await sRes.json()).streams || []);
        if (rRes.ok) setDbRoles((await rRes.json()).roles || []);
      } catch {
        // reference data unavailable — the forms below just show empty lists
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (roleFilter === 'all' ? a.users : a.users.filter((u) => u.role === roleFilter)),
    [a.users, roleFilter]
  );

  // Creates or updates the account against the real API: create/update the
  // row, assign the RBAC role (grants actual permissions — the legacy
  // `role` string alone does not), then sync enable/disable to match the
  // "active" checkbox. Returns an error message, or null on success.
  const saveDraft = async (d: UserDraft): Promise<string | null> => {
    if (!DB_BACKED) return 'غير متاح في نسخة العرض المحلية — استخدم النسخة المتصلة بالخادم.';
    try {
      let id = d.id;
      if (!id) {
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ name: d.name, email: d.email, entityId: d.entityId || undefined, streamId: d.streamId || undefined }),
        });
        const body = await res.json().catch(() => ({} as any));
        if (!res.ok) return body.message || body.error || 'فشل إنشاء المستخدم';
        id = body.user.id;
      } else {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ name: d.name, title: d.title, phone: d.phone, entityId: d.entityId || undefined, streamId: d.streamId || undefined }),
        });
        const body = await res.json().catch(() => ({} as any));
        if (!res.ok) return body.message || body.error || 'فشل حفظ المستخدم';
      }
      if (d.roleCode) {
        const res = await fetch(`/api/admin/users/${id}/roles`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ roleCode: d.roleCode }),
        });
        if (!res.ok) { const body = await res.json().catch(() => ({} as any)); return body.message || body.error || 'فشل تعيين الدور'; }
      }
      // New accounts are created disabled (status: pending) — only call
      // enable if the checkbox is on. Edits only call enable/disable when
      // the checkbox actually changed the stored state.
      const currentlyActive = d.id ? a.users.find((u) => u.id === d.id)?.active : false;
      if (d.active !== currentlyActive) {
        const res = await fetch(`/api/admin/users/${id}/${d.active ? 'enable' : 'disable'}`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return 'تم الحفظ، لكن تعذّر تحديث حالة التفعيل';
      }
      await s.adminLoadUsers();
      return null;
    } catch {
      return 'تعذّر الاتصال بالخادم';
    }
  };

  const kpis = [
    { label: 'إجمالي المستخدمين', value: a.counts.total, icon: IC_USERS, c: '#2563EB', bg: '#EAF0FE' },
    { label: 'الحسابات النشطة', value: a.counts.active, icon: IC_CHECK, c: '#0B8A4B', bg: '#E7F6EE' },
    { label: 'رؤساء المسارات', value: a.counts.heads, icon: IC_STAR, c: '#1D4ED8', bg: '#EAF1FE' },
    { label: 'أعضاء اللجنة الوطنية', value: a.counts.committee, icon: IC_SHIELD, c: '#1D4ED8', bg: '#EAF1FE' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'المستخدمون' },
    { key: 'assign', label: 'رؤساء المسارات واللجنة' },
    { key: 'roles', label: 'الأدوار والصلاحيات' },
    { key: 'site', label: 'الموقع العام' },
    { key: 'contact', label: 'التواصل والاستفسارات' },
    { key: 'changelog', label: 'سجل التغييرات' },
  ];

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#EEF2F9', color: '#16233F' }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E7ECF4', padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1D4ED8,#2E74EE)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Icon d={IC_SHIELD} size={20} color="#fff" />
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>لوحة المشرف</div>
            <div style={{ fontSize: 11.5, color: '#8A97AD' }}>إدارة المستخدمين والأدوار وتعيين رؤساء المسارات واللجنة</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* open the monitoring dashboards with the committee-wide scope */}
          <button
            onClick={() => s.setAdminDash(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'linear-gradient(135deg,#1D4ED8,#2E74EE)', color: '#fff', borderRadius: 11, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon d="M4 20V10M10 20V4M16 20v-8M21 20H3" size={14} color="#fff" />
            لوحات المتابعة
          </button>
          {vm.showRoleSwitcher && (
            <div style={{ display: 'flex', background: '#F4F7FC', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 12, padding: 3, gap: 2 }}>
              {vm.rolePills.map((p) => (
                <button key={p.key} onClick={p.onClick} style={{ borderRadius: 9, padding: '7px 11px', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', ...(p.active ? { background: '#fff', color: '#1D4ED8', boxShadow: '0 1px 4px rgba(15,31,61,.10)', border: '1px solid #D8E3F5' } : { background: 'transparent', color: '#54627B', border: '1px solid transparent' }) }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <button onClick={s.logout} style={{ border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', background: '#fff', color: '#54627B', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 22px 60px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 20 }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12.5, color: '#8A97AD', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>{k.value}</div>
              </div>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon d={k.icon} size={20} color={k.c} />
              </span>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #E2E8F2' }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: '10px 14px', fontSize: 13, fontWeight: 800, color: tab === t.key ? '#1D4ED8' : '#8A97AD', borderBottom: tab === t.key ? '2px solid #1D4ED8' : '2px solid transparent', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <UsersTab a={a} filtered={filtered} roleFilter={roleFilter} setRoleFilter={setRoleFilter} onAdd={() => setEditing(blankDraft())} onBulk={() => setBulkOpen(true)} onEdit={(u) => setEditing(draftFromUser(u))} onToggle={a.toggleUser} onRemove={a.removeUser} />
        )}
        {tab === 'assign' && <AssignTab a={a} streams={dbStreams} onEdit={(u) => setEditing(draftFromUser(u))} onAdd={(seed) => setEditing(blankDraft(seed))} />}
        {tab === 'roles' && <RolesTab a={a} />}
        {tab === 'site' && <SiteTab />}
        {tab === 'contact' && <ContactTab a={a} />}
        {tab === 'changelog' && <ChangeLogTab />}
      </div>

      {editing && (
        <UserEditor
          draft={editing}
          entities={dbEntities}
          streams={dbStreams}
          roles={dbRoles}
          onClose={() => setEditing(null)}
          onSave={saveDraft}
        />
      )}

      {bulkOpen && (
        <BulkUsers
          entities={dbEntities}
          streams={dbStreams}
          roles={dbRoles}
          onClose={() => setBulkOpen(false)}
          onImported={() => s.adminLoadUsers()}
        />
      )}
    </div>
  );
}

// ---- Contact inboxes (بريد التواصل للمسارات) ------------------------------
function ContactTab({ a }: { a: VM['admin'] }) {
  const s = useStore();
  // the PUBLIC contact page lists the project's five streams + the secretariat
  const rows = CONTACT_STREAMS.map((st) => ({ key: st.key, label: st.key === 'general' ? st.label : 'مسار ' + st.label }));
  const streamLabel = (k: string) => CONTACT_STREAMS.find((c) => c.key === k)?.label || k;
  const fmtTs = (ts: number) => new Date(ts).toLocaleDateString('ar-AE', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + new Date(ts).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' });
  const forwardHref = (q: (typeof s.inquiries)[number]) => {
    const to = s.contactEmails[q.stream] || '';
    const subject = 'استفسار عبر منصة الذكاء الاصطناعي المساعد — ' + streamLabel(q.stream);
    const body = ['الاسم: ' + q.name, q.phone ? 'رقم الهاتف: ' + q.phone : '', 'البريد الإلكتروني: ' + q.email, 'المسار المعني: ' + streamLabel(q.stream), '', q.message].filter(Boolean).join('\n');
    return 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>بريد التواصل</div>
        <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginBottom: 16 }}>
          تُوجَّه استفسارات صفحة «تواصل معنا» إلى البريد المعتمد لكل مسار. هذا الربط داخلي ولا يظهر للزائر.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r) => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px', fontSize: 13, fontWeight: 700, color: '#33415C' }}>{r.label}</div>
              <input
                value={a.contactEmails[r.key] || ''}
                onChange={(e) => a.setContactEmail(r.key, e.target.value)}
                placeholder="name@example.gov.ae"
                style={{ flex: '1 1 260px', direction: 'ltr', textAlign: 'left', border: '1px solid #DCE3EE', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>الاستفسارات الواردة</div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#42506B', background: '#F1F4F9', borderRadius: 999, padding: '4px 12px' }}>
            {s.inquiries.filter((q) => !q.done).length} بانتظار المعالجة
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginBottom: 14 }}>
          كل استفسار يُرسل من صفحة «تواصل معنا» يظهر هنا، ويمكن تحويله عبر البريد إلى الفريق المعني بالمسار.
        </div>
        {s.inquiries.length === 0 ? (
          <div style={{ border: '1.5px dashed #D5DEEC', background: '#FAFCFF', borderRadius: 12, padding: '26px 16px', textAlign: 'center', fontSize: 12.5, color: '#9AA6BC' }}>
            لا توجد استفسارات واردة بعد
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.inquiries.map((q) => (
              <div key={q.id} style={{ border: '1px solid #E7ECF4', borderRadius: 12, padding: '13px 15px', background: q.done ? '#FAFBFD' : '#fff', opacity: q.done ? 0.75 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#13213C' }}>{q.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', background: '#EAF0FE', border: '1px solid #D9E4FD', borderRadius: 999, padding: '3px 10px' }}>{streamLabel(q.stream)}</span>
                  {q.done && <span style={{ fontSize: 11, fontWeight: 800, color: '#0B8A4B', background: '#E7F6EE', borderRadius: 999, padding: '3px 10px' }}>تمت المعالجة</span>}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: '#8A97AD', fontWeight: 600 }}>{fmtTs(q.ts)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#54627B', fontWeight: 600, marginTop: 6, direction: 'ltr', textAlign: 'right' }}>
                  {q.email}{q.phone ? ' · ' + q.phone : ''}
                </div>
                <div style={{ fontSize: 12.5, color: '#33415C', lineHeight: 1.9, marginTop: 8, whiteSpace: 'pre-wrap' }}>{q.message}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <a
                    href={forwardHref(q)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', borderRadius: 9, padding: '7px 15px', fontSize: 11.5, fontWeight: 800, textDecoration: 'none' }}
                  >
                    <Icon d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" size={12} color="#fff" />
                    تحويل عبر البريد ({s.contactEmails[q.stream] || '—'})
                  </a>
                  <button
                    onClick={() => s.toggleInquiryDone(q.id)}
                    style={{ background: '#fff', border: '1px solid #DCE3EE', borderRadius: 9, padding: '7px 14px', fontSize: 11.5, fontWeight: 800, color: q.done ? '#8A97AD' : '#0B8A4B', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {q.done ? 'إعادة فتح' : 'تمت المعالجة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- الموقع العام: About-page content + library documents -----------------
const siteCard: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 };
const siteTa: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #DCE3EE', borderRadius: 12, padding: '13px 15px', fontSize: 13, fontFamily: 'inherit', color: '#16233F', lineHeight: 2, outline: 'none', resize: 'vertical', background: '#FAFBFE' };

// ---------------------------------------------------------------------------
// وسائط الموقع العام: في نسخة الخادم تُرفع الملفات كما هي (مرفقات) إلى مخزن
// الوسائط /api/media فتُعرض بجودتها الكاملة وتُخدم بترويسات تخزين مؤقت دائمة —
// لا تدخل في كتلة الحالة فلا تُبطئ الموقع. النسخة التجريبية الثابتة تبقى على
// الضغط إلى data URL (حدود تخزين المتصفح).
// النسخة التجريبية الثابتة لا خادم لها مهما كانت متغيرات البناء — الرفع
// للمخزن حصراً في نسخة الخادم غير التجريبية
const MEDIA_STORE = process.env.NEXT_PUBLIC_DATA_MODE === 'api' && process.env.NEXT_PUBLIC_DEMO_MODE !== '1';
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 200;

async function uploadSiteMedia(file: File): Promise<string | null> {
  try {
    const res = await fetch('/api/media?name=' + encodeURIComponent(file.name), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { url?: string };
    return d.url || null;
  } catch {
    return null;
  }
}

/** حذف ملف سابق من مخزن الوسائط عند استبداله أو الاستغناء عنه */
function releaseSiteMedia(url?: string) {
  if (MEDIA_STORE && url && url.startsWith('/api/media/')) {
    fetch(url, { method: 'DELETE', credentials: 'include' }).catch(() => {});
  }
}

/** تصغير صورة كبيرة بجودة عالية (2560px · JPEG 0.85) بدل رفض رفعها */
function downscaleImage(file: File, done: (blob: Blob) => void, onErr: () => void) {
  const fr = new FileReader();
  fr.onerror = onErr;
  fr.onload = () => {
    const img = new Image();
    img.onerror = onErr;
    img.onload = () => {
      const scale = Math.min(1, 2560 / img.width);
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob((b) => (b ? done(b) : onErr()), 'image/jpeg', 0.85);
    };
    img.src = String(fr.result);
  };
  fr.readAsDataURL(file);
}

/** صورة مختارة: مرفق أصلي في نسخة الخادم (والأكبر من الحد يُصغَّر بجودة
    عالية بدل إظهار خطأ)، وضغط data URL في النسخة الثابتة */
function pickImage(
  file: File,
  fallback: (f: File, done: (u: string) => void, onErr?: () => void) => void,
  done: (url: string) => void,
  onErr: (msg: string) => void
) {
  const decodeFail = () => onErr('تعذر قراءة الصورة — استخدم ملف JPG أو PNG');
  if (!MEDIA_STORE) return fallback(file, done, decodeFail);
  const send = (payload: Blob, mime: string) =>
    fetch('/api/media?name=' + encodeURIComponent(file.name), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': mime },
      body: payload,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { url?: string } | null) => (d?.url ? done(d.url) : onErr('تعذر رفع الصورة — أعد المحاولة')))
      .catch(() => onErr('تعذر رفع الصورة — أعد المحاولة'));
  if (file.size <= MAX_IMAGE_MB * 1024 * 1024) send(file, file.type || 'application/octet-stream');
  else downscaleImage(file, (b) => send(b, 'image/jpeg'), decodeFail);
}

// read a picked cover image, downscale to ≤640px wide and store as data URL
function readCoverFile(file: File, done: (dataUrl: string) => void, onErr?: () => void) {
  const fr = new FileReader();
  fr.onerror = () => onErr?.();
  fr.onload = () => {
    const img = new Image();
    img.onerror = () => onErr?.();
    img.onload = () => {
      const scale = Math.min(1, 640 / img.width);
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
      done(cv.toDataURL('image/jpeg', 0.82));
    };
    img.src = String(fr.result);
  };
  fr.readAsDataURL(file);
}

function readWideImage(file: File, done: (dataUrl: string) => void, onErr?: () => void) {
  const fr = new FileReader();
  fr.onerror = () => onErr?.();
  fr.onload = () => {
    const img = new Image();
    img.onerror = () => onErr?.();
    img.onload = () => {
      const scale = Math.min(1, 1280 / img.width);
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
      done(cv.toDataURL('image/jpeg', 0.78));
    };
    img.src = String(fr.result);
  };
  fr.readAsDataURL(file);
}

function SiteSection({ title, sub, onAdd, children }: { title: string; sub: string; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div style={siteCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
        {onAdd && (
          <button onClick={onAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon d={IC_PLUS} size={12} color="#fff" />
            إضافة
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginBottom: 14 }}>{sub}</div>
      {children}
    </div>
  );
}


// ---------------------------------------------------------------------------
// سجل التغييرات: كل تغيير في النظام — من قام به، ودوره، والتاريخ والوقت.
// يجمع السجل الشامل مع سجل كل مدخل؛ وفي نسخة الخادم يعرض أيضاً سجل تدقيق
// الخادم (audit_logs) لأحداث الواجهات البرمجية.
const LOG_ACTION_LABELS: Record<string, string> = {
  create: 'إضافة مدخل',
  edit: 'تعديل مدخل',
  submit: 'إرسال للاعتماد',
  approve: 'اعتماد',
  info: 'إعادة للتعديل',
  reject: 'رفض',
  budget: 'اعتماد الميزانية',
  nominate: 'ترشيح',
  fund: 'تمويل',
  unfund: 'إلغاء تمويل',
  declineNom: 'رفض ترشيح',
  cancelFund: 'إلغاء تمويل',
};
const ROLE_LOG_LABELS: Record<string, string> = {
  coord: 'منسق المسار في الجهة الاتحادية',
  entity: 'قيادة الجهة',
  path: 'فريق عمل المسار في المشروع',
  ai: 'اللجنة الوطنية للذكاء الاصطناعي المساعد',
  admin: 'مشرف النظام',
};
type FeedRow = { at: number; by: string; role: string; action: string; target?: string; note?: string };
// نسخة الخادم فقط تملك سجل تدقيق الواجهات البرمجية
const AUDIT_API = process.env.NEXT_PUBLIC_DATA_MODE === 'api';

function ChangeLogTab() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [serverLogs, setServerLogs] = useState<{ id: string; action: string; createdAt: string; actorUserId?: string; resourceType?: string; resourceId?: string }[] | null>(null);
  useEffect(() => {
    if (!AUDIT_API) return;
    fetch('/api/admin/audit-logs?limit=200', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setServerLogs(d?.auditLogs || null))
      .catch(() => {});
  }, []);

  const feed: FeedRow[] = useMemo(() => {
    const rows: FeedRow[] = [...s.changeLog];
    for (const it of s.items) {
      for (const l of it.log || []) {
        rows.push({ at: l.at, by: l.by, role: l.role, action: LOG_ACTION_LABELS[l.action] || l.action, target: it.title, note: l.note });
      }
    }
    rows.sort((a, b) => b.at - a.at);
    const needle = q.trim();
    return needle
      ? rows.filter((r) => [r.by, r.action, r.target, r.note, ROLE_LOG_LABELS[r.role] || r.role].join(' ').includes(needle))
      : rows;
  }, [s.changeLog, s.items, q]);

  const fmt = (at: number) => {
    const d = new Date(at);
    return (
      d.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' — ' +
      d.toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const th: CSSProperties = { textAlign: 'right', fontSize: 11.5, fontWeight: 800, color: '#8A97AD', padding: '10px 12px', borderBottom: '1px solid #E7ECF4', whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12.5, color: '#1F2D49', padding: '11px 12px', borderBottom: '1px solid #F0F3F9', verticalAlign: 'top' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>سجل التغييرات</div>
            <div style={{ fontSize: 12, color: '#8A97AD', marginTop: 4 }}>
              كل تغيير في النظام: من قام به، ودوره، والتاريخ والوقت — الأحدث أولاً ({feed.length} سجلاً)
            </div>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الإجراء أو المدخل…"
            style={{ border: '1px solid #DCE3EE', borderRadius: 10, padding: '9px 13px', fontSize: 12.5, fontFamily: 'inherit', minWidth: 240, outline: 'none' }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={th}>التاريخ والوقت</th>
                <th style={th}>المستخدم</th>
                <th style={th}>الدور</th>
                <th style={th}>الإجراء</th>
                <th style={th}>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {feed.slice(0, 300).map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: '#54627B' }}>{fmt(r.at)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{r.by || '—'}</td>
                  <td style={td}>{ROLE_LOG_LABELS[r.role] || r.role || '—'}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#1D4ED8' }}>{r.action}</td>
                  <td style={td}>
                    {r.target && <span style={{ fontWeight: 700 }}>{r.target}</span>}
                    {r.target && r.note ? ' — ' : ''}
                    {r.note && <span style={{ color: '#54627B' }}>{r.note}</span>}
                  </td>
                </tr>
              ))}
              {!feed.length && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#8A97AD', padding: 30 }}>لا تغييرات مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {AUDIT_API && serverLogs && serverLogs.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>سجل تدقيق الخادم</div>
          <div style={{ fontSize: 12, color: '#8A97AD', marginBottom: 12 }}>
            أحداث الواجهات البرمجية كما سجلها الخادم (آخر {serverLogs.length})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={th}>التاريخ والوقت</th>
                  <th style={th}>الإجراء</th>
                  <th style={th}>المورد</th>
                </tr>
              </thead>
              <tbody>
                {serverLogs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ ...td, whiteSpace: 'nowrap', color: '#54627B' }}>{fmt(new Date(l.createdAt).getTime())}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#1D4ED8' }}>{l.action}</td>
                    <td style={td}>{[l.resourceType, l.resourceId].filter(Boolean).join(' · ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteTab() {
  const s = useStore();
  const site = s.site;
  const [videoBusy, setVideoBusy] = useState(false);
  const pickErr = (msg: string) => s.toast(msg);
  const inp = (v: string, on: (x: string) => void, ph = '', flex = '1 1 180px'): React.ReactNode => (
    <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={{ ...inputSt, flex }} />
  );
  const num = (v: number, on: (x: number) => void, ph = '', flex = '0 0 90px'): React.ReactNode => (
    <input value={String(v)} onChange={(e) => on(Math.max(0, Math.min(100, Number(e.target.value.replace(/[^\d]/g, '')) || 0)))} placeholder={ph} inputMode="numeric" style={{ ...inputSt, flex }} />
  );
  // صف رفع/استعادة صورة من صور الصفحة الرئيسية الثابتة
  const imgRow = (label: string, current: string, apply: (url: string) => void, clear: () => void) => (
    <div style={rowShell}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#54627B', flex: 'none' }}>{label}</span>
      {current ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="" style={{ height: 40, width: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E1E7F1' }} />
          <button
            onClick={clear}
            style={{ border: '1px solid #F0D5D5', background: '#fff', color: '#C0303B', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            استعادة الصورة الرسمية
          </button>
        </span>
      ) : (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
          <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
          رفع صورة بديلة
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) pickImage(f, readWideImage, apply, pickErr);
            }}
          />
        </label>
      )}
    </div>
  );
  const rowShell: CSSProperties = { border: '1px solid #E7ECF4', borderRadius: 12, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
  const delBtn = (onDel: () => void) => (
    <button onClick={onDel} title="حذف" style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <Icon d={IC_TRASH} size={14} color="#C0303B" />
    </button>
  );
  // تعديل صف داخل قائمة من قوائم محتوى الموقع
  const updList = <K extends 'targets' | 'news' | 'streams' | 'phases' | 'principles' | 'history'>(
    key: K,
    idx: number,
    patch: Partial<(typeof site)[K][number]>
  ) => {
    const list = site[key].map((x, i) => (i === idx ? { ...x, ...patch } : x)) as (typeof site)[K];
    s.setSite({ [key]: list } as Partial<typeof site>);
  };
  const delFrom = (key: 'news' | 'streams' | 'phases' | 'principles', idx: number) =>
    s.setSite({ [key]: site[key].filter((_, i) => i !== idx) } as Partial<typeof site>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SiteSection title="الصفحة الرئيسية — العناوين" sub="عنوانا الواجهة فوق الفيديو، ثم عنوان المقدمة ونصها، ثم رسالة الدولة — تُحفظ تلقائياً وتظهر للزوار مباشرة.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={rowShell}>
            {inp(site.heroLine1, (v) => s.setSite({ heroLine1: v }), 'السطر الأول (أبيض)')}
            {inp(site.heroLine2, (v) => s.setSite({ heroLine2: v }), 'السطر الثاني (متدرج)')}
          </div>
          {/* فيديو الواجهة: في نسخة الخادم يُرفع ملف الفيديو نفسه (مرفق) إلى
              مخزن الوسائط ويُخدم بجودته الكاملة مع تخزين مؤقت دائم؛ النسخة
              الثابتة تبقى على الرابط (لا خادم يستقبل الملف). فارغ = الرسمي. */}
          <div style={rowShell}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#54627B', flex: 'none' }}>فيديو الواجهة</span>
            {MEDIA_STORE ? (
              videoBusy ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309', flex: '1 1 auto' }}>جارٍ رفع الفيديو… لا تغلق الصفحة</span>
              ) : (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
                  <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                  {site.heroVideoUrl ? 'استبدال الفيديو (mp4)' : 'رفع ملف الفيديو (mp4)'}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      if (f.size > MAX_VIDEO_MB * 1024 * 1024) return s.toast(`حجم الفيديو يتجاوز ${MAX_VIDEO_MB}MB`);
                      const prev = site.heroVideoUrl;
                      setVideoBusy(true);
                      uploadSiteMedia(f).then((u) => {
                        setVideoBusy(false);
                        if (!u) return s.toast('تعذر رفع الفيديو — أعد المحاولة');
                        releaseSiteMedia(prev);
                        s.setSite({ heroVideoUrl: u });
                        s.toast('تم رفع الفيديو وظهر للزوار');
                      });
                    }}
                  />
                </label>
              )
            ) : (
              inp(site.heroVideoUrl, (v) => s.setSite({ heroVideoUrl: v.trim() }), 'رابط ملف الفيديو (mp4) — اتركه فارغاً للفيديو الرسمي')
            )}
            {site.heroVideoUrl ? (
              <button
                onClick={() => {
                  releaseSiteMedia(site.heroVideoUrl);
                  s.setSite({ heroVideoUrl: '' });
                }}
                style={{ border: '1px solid #F0D5D5', background: '#fff', color: '#C0303B', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flex: 'none' }}
              >
                استعادة الفيديو الرسمي
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0B8A4B', background: '#EAF7F0', borderRadius: 999, padding: '4px 10px', flex: 'none' }}>الفيديو الرسمي</span>
            )}
          </div>
          <div style={rowShell}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#54627B', flex: 'none' }}>غلاف الفيديو</span>
            {site.heroPosterUrl ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={site.heroPosterUrl} alt="" style={{ height: 40, width: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E1E7F1' }} />
                <button
                  onClick={() => {
                    releaseSiteMedia(site.heroPosterUrl);
                    s.setSite({ heroPosterUrl: '' });
                  }}
                  style={{ border: '1px solid #F0D5D5', background: '#fff', color: '#C0303B', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  استعادة الغلاف الرسمي
                </button>
              </span>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
                <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                صورة الغلاف (قبل تشغيل الفيديو)
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickImage(f, readCoverFile, (url) => { releaseSiteMedia(site.heroPosterUrl); s.setSite({ heroPosterUrl: url }); }, pickErr);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
          <div style={rowShell}>
            {inp(site.introPre, (v) => s.setSite({ introPre: v }), 'عنوان المقدمة')}
            {inp(site.introHighlight, (v) => s.setSite({ introHighlight: v }), 'الجزء المميز بالتدرج', '0 0 240px')}
          </div>
          <textarea value={site.introText} onChange={(e) => s.setSite({ introText: e.target.value })} rows={6} style={siteTa} />
          {imgRow(
            'صورة المقدمة',
            site.introImageUrl,
            (url) => {
              releaseSiteMedia(site.introImageUrl);
              s.setSite({ introImageUrl: url });
            },
            () => {
              releaseSiteMedia(site.introImageUrl);
              s.setSite({ introImageUrl: '' });
            }
          )}
          <div style={rowShell}>
            {inp(site.messagePre, (v) => s.setSite({ messagePre: v }), 'نص الرسالة قبل الجزء المميز')}
            {inp(site.messageHighlight, (v) => s.setSite({ messageHighlight: v }), 'الجزء المميز', '0 0 220px')}
            {inp(site.messagePost, (v) => s.setSite({ messagePost: v }), 'تكملة الرسالة', '0 0 200px')}
          </div>
          {imgRow(
            'صورة قسم الرسالة (الإطلاق)',
            site.launchImageUrl,
            (url) => {
              releaseSiteMedia(site.launchImageUrl);
              s.setSite({ launchImageUrl: url });
            },
            () => {
              releaseSiteMedia(site.launchImageUrl);
              s.setSite({ launchImageUrl: '' });
            }
          )}
        </div>
      </SiteSection>

      <SiteSection title="المستهدفات الرئيسية" sub="عمودا المستهدفات: النسبة المعروضة، ونسبة امتلاء العمود، والنص أسفله.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {site.targets.map((t, i) => (
            <div key={i} style={rowShell}>
              {num(t.value, (v) => updList('targets', i, { value: v }), 'النسبة %')}
              {num(t.fill, (v) => updList('targets', i, { fill: v }), 'الامتلاء %')}
              {inp(t.label, (v) => updList('targets', i, { label: v }), 'النص')}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection
        title="آخر الأخبار"
        sub="بطاقات الأخبار في الصفحة الرئيسية — العنوان والنبذة والتاريخ والمصدر ورابط «اقرأ المزيد» وصورة الخبر."
        onAdd={() => s.setSite({ news: [{ id: 'news-' + Date.now(), image: '', date: '', title: '', desc: '', source: '', link: '' }, ...site.news] })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {site.news.map((n, i) => (
            <div key={n.id} style={{ ...rowShell, alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inp(n.title, (v) => updList('news', i, { title: v }), 'عنوان الخبر', '1 1 auto')}
                <textarea value={n.desc} onChange={(e) => updList('news', i, { desc: e.target.value })} placeholder="نبذة الخبر" rows={3} style={{ ...siteTa, minHeight: 0 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {inp(n.date, (v) => updList('news', i, { date: v }), 'التاريخ', '0 0 190px')}
                  {inp(n.source, (v) => updList('news', i, { source: v }), 'المصدر', '0 0 190px')}
                  {inp(n.link, (v) => updList('news', i, { link: v }), 'رابط اقرأ المزيد')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 'none' }}>
                {n.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.image.startsWith('data:') || n.image.startsWith('http') ? n.image : (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/' + n.image.replace(/^\//, '')} alt="" style={{ width: 92, height: 64, borderRadius: 9, objectFit: 'cover', border: '1px solid #E1E7F1' }} />
                    <button onClick={() => updList('news', i, { image: '' })} style={{ border: 'none', background: 'transparent', color: '#C0303B', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إزالة الصورة</button>
                  </>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>
                    <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                    صورة الخبر
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) pickImage(f, readCoverFile, (url) => { releaseSiteMedia(site.news[i]?.image); updList('news', i, { image: url }); }, pickErr);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              {delBtn(() => delFrom('news', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="مسارات المشروع" sub="النص التعريفي وبطاقات المسارات الخمسة في الصفحة الرئيسية.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={rowShell}>{inp(site.streamsSub, (v) => s.setSite({ streamsSub: v }), 'النص أسفل عنوان المسارات')}</div>
          {site.streams.map((t, i) => (
            <div key={t.id} style={rowShell}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#8FA3C4', flex: 'none', width: 26, textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
              {inp(t.title, (v) => updList('streams', i, { title: v }), 'اسم المسار', '0 0 260px')}
              {inp(t.desc, (v) => updList('streams', i, { desc: v }), 'الوصف')}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="البرنامج الزمني للتنفيذ" sub="المراحل الثماني على الخط الزمني في الصفحة الرئيسية.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {site.phases.map((ph, i) => (
            <div key={i} style={rowShell}>
              {inp(ph.phase, (v) => updList('phases', i, { phase: v }), 'المرحلة', '0 0 120px')}
              {inp(ph.title, (v) => updList('phases', i, { title: v }), 'العنوان', '0 0 170px')}
              {inp(ph.range, (v) => updList('phases', i, { range: v }), 'الفترة', '0 0 190px')}
              {inp(ph.months, (v) => updList('phases', i, { months: v }), 'المدة', '0 0 90px')}
              {inp(ph.desc, (v) => updList('phases', i, { desc: v }), 'الوصف')}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="من نحن — الاقتباس والمبادئ" sub="اقتباس القيادة والمبادئ العامة في صفحة «من نحن».">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea value={site.quoteText} onChange={(e) => s.setSite({ quoteText: e.target.value })} rows={3} style={siteTa} />
          <div style={rowShell}>{inp(site.quoteAttribution, (v) => s.setSite({ quoteAttribution: v }), 'نسبة الاقتباس')}</div>
          <div style={rowShell}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#54627B', flex: 'none' }}>صورة الاقتباس</span>
            {site.quoteImageUrl ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={site.quoteImageUrl} alt="" style={{ height: 44, width: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid #E1E7F1' }} />
                <button
                  onClick={() => s.setSite({ quoteImageUrl: '' })}
                  style={{ border: '1px solid #F0D5D5', background: '#fff', color: '#C0303B', borderRadius: 9, padding: '8px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  استعادة الصورة الرسمية
                </button>
              </span>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
                <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                تغيير الصورة
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickImage(f, readWideImage, (url) => { releaseSiteMedia(site.quoteImageUrl); s.setSite({ quoteImageUrl: url }); }, pickErr);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </SiteSection>

      <SiteSection title="من نحن — مسيرة التحول (المحطات والصور)" sub="السنة والعنوان وصورة كل محطة قابلة للتحرير — التخطيط البصري للمحطات ثابت من التصميم، وصورة فارغة تعني صورة المحطة الرسمية.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {site.history.map((h, i) => (
            <div key={i} style={rowShell}>
              {inp(h.year, (v) => updList('history', i, { year: v }), i === 0 ? 'بلا سنة (المقدمة)' : 'السنة', '0 0 90px')}
              {i === 0 ? inp(h.eyebrow || '', (v) => updList('history', i, { eyebrow: v }), 'السطر التمهيدي', '0 0 150px') : null}
              {inp(h.title, (v) => updList('history', i, { title: v }), 'عنوان المحطة')}
              {h.image ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt="" style={{ height: 40, width: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E1E7F1', flex: 'none' }} />
                  <button
                    onClick={() => updList('history', i, { image: '' })}
                    style={{ border: '1px solid #F0D5D5', background: '#fff', color: '#C0303B', borderRadius: 9, padding: '7px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flex: 'none' }}
                  >
                    الصورة الرسمية
                  </button>
                </span>
              ) : (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
                  <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                  تغيير الصورة
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickImage(f, readWideImage, (url) => { releaseSiteMedia(site.history[i]?.image); updList('history', i, { image: url }); }, pickErr);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection
        title="المبادئ العامة"
        sub="القائمة الكاملة للمبادئ في «من نحن» (العدد تلقائي)."
        onAdd={() => s.setSite({ principles: [...site.principles, { n: String(site.principles.length + 1).padStart(2, '0'), title: '', desc: '' }] })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {site.principles.map((t, i) => (
            <div key={i} style={rowShell}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#8FA3C4', flex: 'none', width: 22, textAlign: 'center' }}>{i + 1}</span>
              {inp(t.title, (v) => updList('principles', i, { title: v, n: String(i + 1).padStart(2, '0') }), 'المبدأ', '0 0 220px')}
              {inp(t.desc, (v) => updList('principles', i, { desc: v }), 'الوصف')}
              {delBtn(() => delFrom('principles', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="تواصل معنا" sub="النص التعريفي أعلى نموذج الاستفسارات.">
        <div style={rowShell}>{inp(site.contactSub, (v) => s.setSite({ contactSub: v }), 'النص أعلى النموذج')}</div>
      </SiteSection>

      <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>وثائق المنشورات</div>
          <button
            onClick={s.addLibDoc}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon d={IC_PLUS} size={13} color="#fff" />
            إضافة وثيقة
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginBottom: 14 }}>
          الوثائق المعروضة في صفحة «المنشورات» العامة — أرفق ملف PDF وصورة الغلاف مباشرة من هنا.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {s.libraryDocs.map((d) => (
            <div key={d.id} style={{ border: '1px solid #E7ECF4', borderRadius: 12, padding: '13px 15px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={labelSt}>عنوان الوثيقة</label>
                <input value={d.title} onChange={(e) => s.updLibDoc(d.id, { title: e.target.value })} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>التصنيف</label>
                <select value={d.cat} onChange={(e) => s.updLibDoc(d.id, { cat: e.target.value as DocCat })} style={{ ...inputSt, paddingLeft: 26, cursor: 'pointer' }}>
                  {DOC_CATS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelSt}>التاريخ</label>
                <input value={d.date} onChange={(e) => s.updLibDoc(d.id, { date: e.target.value })} placeholder="يوليو 2026" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>ملف الوثيقة (PDF)</label>
                {d.fileUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 13px', background: '#EAF7F0', border: '1px solid #CBE8D8', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#0B8A4B' }}>
                      <Icon d="M20 6 9 17l-5-5" size={13} color="#0B8A4B" />
                      ملف مرفق
                    </span>
                    <button
                      onClick={() => s.updLibDoc(d.id, { fileUrl: '' })}
                      title="إزالة الملف"
                      style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Icon d={IC_TRASH} size={13} color="#C0303B" />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>
                    <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={14} color="#2563EB" />
                    إرفاق ملف PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 4 * 1024 * 1024) {
                            s.toast('الملف أكبر من 4MB — يُرجى ضغطه أو رفعه عبر فريق التقنية');
                          } else {
                            const fr = new FileReader();
                            fr.onload = () => s.updLibDoc(d.id, { fileUrl: String(fr.result) });
                            fr.readAsDataURL(f);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <div>
                <label style={labelSt}>صورة الغلاف (اختياري)</label>
                {d.coverUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.coverUrl} alt="" style={{ height: 38, width: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid #E1E7F1' }} />
                    <button
                      onClick={() => {
                        releaseSiteMedia(d.coverUrl);
                        s.updLibDoc(d.id, { coverUrl: '' });
                      }}
                      title="إزالة الصورة"
                      style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Icon d={IC_TRASH} size={13} color="#C0303B" />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>
                    <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={14} color="#2563EB" />
                    إرفاق صورة
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) pickImage(f, readCoverFile, (url) => { releaseSiteMedia(d.coverUrl); s.updLibDoc(d.id, { coverUrl: url }); }, pickErr);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <button
                onClick={() => s.removeLibDoc(d.id)}
                title="حذف"
                style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon d={IC_TRASH} size={15} color="#C0303B" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Users table ----------------------------------------------------------
function UsersTab({ a, filtered, roleFilter, setRoleFilter, onAdd, onBulk, onEdit, onToggle, onRemove }: {
  a: VM['admin'];
  filtered: VM['admin']['users'];
  roleFilter: RoleKey | 'all';
  setRoleFilter: (r: RoleKey | 'all') => void;
  onAdd: () => void;
  onBulk: () => void;
  onEdit: (u: UserRec) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const chips: { key: RoleKey | 'all'; label: string }[] = [
    { key: 'all', label: 'الكل' },
    ...a.roleInfo.map((r) => ({ key: r.key, label: r.nameAr })),
  ];
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <button key={c.key} onClick={() => setRoleFilter(c.key)} style={{ border: '1px solid ' + (roleFilter === c.key ? '#1D4ED8' : '#E2E8F2'), background: roleFilter === c.key ? '#EAF1FE' : '#fff', color: roleFilter === c.key ? '#1D4ED8' : '#54627B', borderRadius: 999, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onBulk} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #DDE5F0', background: '#fff', color: '#1D4ED8', borderRadius: 10, padding: '9px 15px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon d={IC_UPLOAD} size={15} color="#1D4ED8" /> رفع دفعة مستخدمين
          </button>
          <button onClick={onAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', borderRadius: 10, padding: '9px 15px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 18px -8px rgba(37,99,235,.7)' }}>
            <Icon d={IC_PLUS} size={15} color="#fff" /> إضافة مستخدم
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#F7F9FD', color: '#8A97AD', fontSize: 11.5 }}>
              {['المستخدم', 'الدور', 'النطاق', 'البريد الإلكتروني', 'الحالة', ''].map((h, i) => (
                <th key={i} style={{ textAlign: i === 5 ? 'left' : 'right', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #EEF2F8', opacity: u.active ? 1 : 0.55 }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: u.roleBg, color: u.roleBadge, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flex: 'none' }}><Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" size={16} color={u.roleBadge} strokeWidth={2.2} /></span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9AA6BC' }}>{u.title || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-block', background: u.roleBg, color: u.roleBadge, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{u.roleLabel}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#54627B', whiteSpace: 'nowrap' }}>{u.scopeLabel}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#54627B', direction: 'ltr', textAlign: 'right' }}>{u.email || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: u.active ? '#0B8A4B' : '#94A3B8' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.active ? '#0B8A4B' : '#94A3B8' }} />
                    {u.active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }}>
                    <IconBtn title="تعديل" d={IC_EDIT} onClick={() => onEdit(u)} />
                    <IconBtn title={u.active ? 'إيقاف' : 'تفعيل'} d={u.active ? IC_X : IC_CHECK} onClick={() => onToggle(u.id)} />
                    {!u.system && <IconBtn title="حذف" d={IC_TRASH} danger onClick={() => onRemove(u.id)} />}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 28, textAlign: 'center', color: '#9AA6BC', fontSize: 13 }}>لا يوجد مستخدمون ضمن هذا الدور.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconBtn({ d, title, onClick, danger }: { d: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid ' + (danger ? '#F6D6D9' : '#E7ECF4'), background: danger ? '#FEF3F3' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon d={d} size={15} color={danger ? '#C0392B' : '#54627B'} />
    </button>
  );
}

// ---- Assign stream heads + committee --------------------------------------
function AssignTab({ a, streams, onEdit, onAdd }: { a: VM['admin']; streams: DbStream[]; onEdit: (u: UserRec) => void; onAdd: (seed: Partial<UserDraft>) => void }) {
  // Matched against the real RBAC role code (see store.ts adminLoadUsers),
  // not the legacy `role` field, since that field can't distinguish head vs
  // deputy and the backend doesn't model that distinction either.
  const heads = a.users.filter((u) => u.roleCode === 'stream_owner');
  const committee = a.users.filter((u) => u.roleCode === 'ai_committee');
  const headByStream = (id: string) => heads.find((h) => h.streamId === id);
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={card}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF2F8', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon d={IC_STAR} size={16} color="#1D4ED8" /> رؤساء المسارات
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12, padding: 16 }}>
          {streams.map((st) => {
            const h = headByStream(st.id);
            return (
              <div key={st.id} style={{ border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 13, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 700 }}>{st.nameAr}</div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 3 }}>{h?.name || 'لم يُعيّن بعد'}</div>
                  {h?.email && <div style={{ fontSize: 11, color: '#9AA6BC', direction: 'ltr', textAlign: 'right' }}>{h.email}</div>}
                </div>
                <button
                  onClick={() => (h ? onEdit(h) : onAdd({ roleCode: 'stream_owner', streamId: st.id, title: `رئيس مسار ${st.nameAr}` }))}
                  style={{ border: '1px solid #D8E3F5', background: '#F1F5FB', color: '#1D4ED8', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flex: 'none' }}>
                  {h ? 'تعديل' : 'تعيين'}
                </button>
              </div>
            );
          })}
          {streams.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#9AA6BC', fontSize: 13 }}>تعذّر تحميل المسارات من الخادم.</div>}
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon d={IC_SHIELD} size={16} color="#1D4ED8" /> اللجنة الوطنية
          </div>
          <button onClick={() => onAdd({ roleCode: 'ai_committee', title: 'عضو اللجنة الوطنية' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #D8E3F5', background: '#F1F5FB', color: '#1D4ED8', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon d={IC_PLUS} size={14} color="#1D4ED8" /> إضافة عضو
          </button>
        </div>
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          {committee.map((c) => (
            <div key={c.id} style={{ border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#9AA6BC', direction: 'ltr', textAlign: 'right' }}>{c.email || c.title}</div>
              </div>
              <button onClick={() => onEdit(c)} style={{ border: '1px solid #D8E3F5', background: '#F1F5FB', color: '#1D4ED8', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flex: 'none' }}>تعديل</button>
            </div>
          ))}
          {committee.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#9AA6BC', fontSize: 13 }}>لا يوجد أعضاء بعد.</div>}
        </div>
      </div>
    </div>
  );
}

// ---- Roles reference ------------------------------------------------------
// Reads live roles + permissions from the database (the same source /admin
// uses) so a role added via prisma/seed.ts — or later via /admin — shows up
// here immediately. Falls back to the static reference cards if the API
// can't be reached (e.g. a local-only demo build).
function RolesTab({ a }: { a: VM['admin'] }) {
  const [dbRoles, setDbRoles] = useState<{ id: string; code: string; nameAr: string; permissions: string[] }[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Only the server deployment has /api/admin/* routes backed by Postgres;
    // the static-export/local-demo build has no server to call.
    if (process.env.NEXT_PUBLIC_DATA_MODE !== 'api') return;
    (async () => {
      try {
        const res = await fetch('/api/admin/roles', { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setDbRoles(data.roles || []);
      } catch {
        setLoadError(true);
      }
    })();
  }, []);

  if (dbRoles) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {dbRoles.map((r) => (
          <div key={r.id} style={{ ...card, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{r.nameAr}</div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#54627B', background: '#EEF2F8', borderRadius: 999, padding: '3px 9px', direction: 'ltr' }}>{r.code}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.permissions.length ? (
                r.permissions.map((p) => (
                  <span key={p} style={{ fontSize: 10.5, fontFamily: 'ui-monospace,monospace', direction: 'ltr', color: '#1D4ED8', background: '#EAF1FE', borderRadius: 7, padding: '3px 7px' }}>{p}</span>
                ))
              ) : (
                <span style={{ fontSize: 11.5, color: '#9AA6BC' }}>لا توجد صلاحيات مرتبطة بعد</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Static fallback — shown only until the fetch resolves, or if it fails.
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {loadError && (
        <div style={{ fontSize: 12, color: '#C0392B', background: '#FEF3F3', border: '1px solid #F6D6D9', borderRadius: 10, padding: '10px 14px' }}>
          تعذّر تحميل الأدوار من الخادم — المعروض أدناه مرجع ثابت قد لا يطابق قاعدة البيانات الفعلية.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {a.roleInfo.map((r) => (
          <div key={r.key} style={{ ...card, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{r.nameAr}</div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#54627B', background: '#EEF2F8', borderRadius: 999, padding: '3px 9px' }}>{r.scope}</span>
            </div>
            <div style={{ fontSize: 12, color: '#54627B', lineHeight: 1.8, marginTop: 8 }}>{r.descAr}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.permissions.map((p) => (
                <span key={p} style={{ fontSize: 10.5, fontFamily: 'ui-monospace,monospace', direction: 'ltr', color: '#1D4ED8', background: '#EAF1FE', borderRadius: 7, padding: '3px 7px' }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- User editor modal ----------------------------------------------------
function UserEditor({ draft, entities, streams, roles, onClose, onSave }: {
  draft: UserDraft;
  entities: DbEntity[];
  streams: DbStream[];
  roles: DbRole[];
  onClose: () => void;
  onSave: (d: UserDraft) => Promise<string | null>;
}) {
  const [f, setF] = useState<UserDraft>(draft);
  const set = (patch: Partial<UserDraft>) => setF((x) => ({ ...x, ...patch }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(f.email.trim());
  const valid = !!f.name.trim() && emailOk;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    const err = await onSave({ ...f, name: f.name.trim(), email: f.email.trim() });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,20,44,.5)' }} />
      <div style={{ position: 'relative', width: 'min(520px,calc(100vw-32px))', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 30px 70px -24px rgba(2,12,35,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{draft.id ? 'تعديل مستخدم' : 'إضافة مستخدم'}</div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5FB', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={IC_X} size={16} color="#54627B" />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelSt}>الاسم الكامل *</label>
            <input style={inputSt} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: محمد أحمد" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>المسمى الوظيفي</label>
              <input style={inputSt} value={f.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <label style={labelSt}>الدور</label>
              {/* البنية المعتمدة أربعة أدوار فقط — الأدوار الخلفية الأخرى
                  (ممثل الجهة/مدقق/مستعرض…) للتوافق ولا تُسنَد من هنا؛ دور
                  قديم مسند لحساب قائم يبقى ظاهراً حتى لا يختفي من المحرر.
                  ولمستخدمي وزارة شؤون مجلس الوزراء يظهر المنسق بمسمى الوزارة */}
              <select style={{ ...inputSt, cursor: 'pointer' }} value={f.roleCode} onChange={(e) => set({ roleCode: e.target.value })}>
                <option value="">— بدون دور (يُعيَّن لاحقًا) —</option>
                {(() => {
                  const APPROVED = ['entity_coordinator', 'stream_owner', 'ai_committee', 'system_admin'];
                  const moca = /وزارة شؤون مجلس الوزراء/.test(entities.find((en) => en.id === f.entityId)?.nameAr || '');
                  const label = (r: DbRole) =>
                    moca && r.code === 'entity_coordinator' ? 'منسق الجهة أو القطاع' : r.nameAr;
                  const list = roles
                    .filter((r) => APPROVED.includes(r.code) || r.code === f.roleCode)
                    .sort((a, b) => APPROVED.indexOf(a.code) - APPROVED.indexOf(b.code));
                  return list.map((r) => <option key={r.code} value={r.code}>{label(r)} ({r.code})</option>);
                })()}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>البريد الإلكتروني *</label>
              <input style={{ ...inputSt, direction: 'ltr', textAlign: 'right' }} value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@aigp.gov.ae" disabled={!!draft.id} />
            </div>
            <div>
              <label style={labelSt}>رقم الهاتف المتحرك</label>
              <input style={{ ...inputSt, direction: 'ltr', textAlign: 'right' }} value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+971 5x xxx xxxx" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>الجهة</label>
              <select
                style={{ ...inputSt, cursor: 'pointer' }}
                value={f.entityId}
                onChange={(e) => {
                  const entityId = e.target.value;
                  const moca = /وزارة شؤون مجلس الوزراء/.test(entities.find((en) => en.id === entityId)?.nameAr || '');
                  // بنية الوزارة جهات ومكاتب لا مسارات — يُمسح المسار تلقائياً
                  set(moca ? { entityId, streamId: '' } : { entityId });
                }}
              >
                <option value="">— بدون جهة —</option>
                {entities.map((en) => <option key={en.id} value={en.id}>{en.nameAr}</option>)}
              </select>
            </div>
            {/وزارة شؤون مجلس الوزراء/.test(entities.find((en) => en.id === f.entityId)?.nameAr || '') ? (
              <div>
                <label style={labelSt}>النطاق</label>
                <div style={{ ...inputSt, background: '#F4F7FC', color: '#54627B', display: 'flex', alignItems: 'center', fontSize: 12 }}>
                  بنية الوزارة: جهات ومكاتب وقطاعات — لا مسارات؛ يعمل على نسخة الوزارة
                </div>
              </div>
            ) : (
              <div>
                <label style={labelSt}>المسار</label>
                <select style={{ ...inputSt, cursor: 'pointer' }} value={f.streamId} onChange={(e) => set({ streamId: e.target.value })}>
                  <option value="">— بدون مسار —</option>
                  {streams.map((st) => <option key={st.id} value={st.id}>{st.nameAr}</option>)}
                </select>
              </div>
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#33405A' }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
            الحساب نشط
          </label>
        </div>

        {error && <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 14 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, marginTop: 20 }}>
          <button disabled={!valid || saving} onClick={handleSave} style={{ border: 'none', background: valid && !saving ? 'linear-gradient(180deg,#2E74EE,#1F5FE0)' : '#C7D2E4', color: '#fff', borderRadius: 11, padding: '11px 22px', fontWeight: 800, fontSize: 13, cursor: valid && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
          <button onClick={onClose} style={{ border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', background: '#fff', color: '#54627B', borderRadius: 11, padding: '11px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Bulk user upload (2 steps: download template → upload it) -------------
type BulkRow = { name: string; email: string; roleCode: string; entityId: string; streamId: string };

function BulkUsers({ entities, streams, roles, onClose, onImported }: {
  entities: DbEntity[];
  streams: DbStream[];
  roles: DbRole[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [parsed, setParsed] = useState<BulkRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<{ added: number; failed: number } | null>(null);

  const roleFromToken = (t: string): string => {
    const s = t.trim();
    return roles.find((r) => r.code === s)?.code || roles.find((r) => r.nameAr === s)?.code || '';
  };
  const streamFromToken = (t: string): string => {
    const s = t.trim();
    return s ? (streams.find((x) => x.id === s)?.id || streams.find((x) => x.nameAr === s)?.id || '') : '';
  };
  const entityFromToken = (t: string): string => {
    const s = t.trim();
    return s ? (entities.find((x) => x.id === s)?.id || entities.find((x) => x.nameAr === s)?.id || '') : '';
  };
  const SAMPLE_EMAILS = new Set(['m.alameri@aigp.gov.ae', 'm.ahmed@aigp.gov.ae', 's.khaled@aigp.gov.ae']);

  const download = async () => {
    setBusy(true);
    try {
      await downloadUsersTemplate(roles.map((r) => r.nameAr), entities.map((e) => e.nameAr), streams.map((s) => s.nameAr));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    setBusy(true);
    setFileName(file.name);
    try {
      const rows = await readSheetRows(file);
      // a data row = has a name (col0) and an email (col1); skip the template
      // title/note/header/example rows
      const recs: BulkRow[] = rows
        .filter((c) => (c[0] || '').trim() && /^\S+@\S+\.\S+$/.test((c[1] || '').trim()) && !SAMPLE_EMAILS.has((c[1] || '').trim()))
        .map((c) => ({
          name: (c[0] || '').trim(),
          email: (c[1] || '').trim(),
          roleCode: roleFromToken(c[2] || ''),
          entityId: entityFromToken(c[3] || ''),
          streamId: streamFromToken(c[4] || ''),
        }));
      setParsed(recs);
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    if (!parsed || !DB_BACKED) return;
    setBusy(true);
    setProgress(0);
    let added = 0;
    let failed = 0;
    // Sequential on purpose — each row needs the create call's returned id
    // before it can assign the role, and this keeps the "n / total" progress
    // readout accurate rather than racing several rows at once.
    for (const row of parsed) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ name: row.name, email: row.email, entityId: row.entityId || undefined, streamId: row.streamId || undefined }),
        });
        const body = await res.json().catch(() => ({} as any));
        if (!res.ok) { failed++; continue; }
        const id = body.user.id;
        if (row.roleCode) {
          await fetch(`/api/admin/users/${id}/roles`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ roleCode: row.roleCode }),
          });
        }
        await fetch(`/api/admin/users/${id}/enable`, { method: 'POST', credentials: 'include' });
        added++;
      } catch {
        failed++;
      } finally {
        setProgress((p) => p + 1);
      }
    }
    onImported();
    setBusy(false);
    setDone({ added, failed });
  };

  const stepNum = (n: number, active: boolean) => (
    <span style={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12.5, background: active ? '#1D4ED8' : '#EAF1FE', color: active ? '#fff' : '#1D4ED8' }}>{n}</span>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,20,44,.5)' }} />
      <div style={{ position: 'relative', width: 'min(560px,calc(100vw-32px))', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 30px 70px -24px rgba(2,12,35,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>رفع دفعة مستخدمين</div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5FB', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={IC_X} size={16} color="#54627B" />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: '#E7F6EE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={IC_CHECK} size={26} color="#0B8A4B" strokeWidth={2.6} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>تمت إضافة {done.added} مستخدمًا{done.failed ? ` — تعذّرت إضافة ${done.failed}` : ''}</div>
            <button onClick={onClose} style={{ marginTop: 18, border: 'none', background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', borderRadius: 11, padding: '11px 26px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>تم</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {/* STEP 1 — download the template */}
            <div style={{ border: '1px solid #E7ECF4', borderRadius: 14, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {stepNum(1, true)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>تنزيل النموذج</div>
                <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, margin: '4px 0 10px' }}>نزّل نموذج Excel المنظّم، وعبّئ صفًّا لكل مستخدم (الاسم، البريد، الدور، الجهة، المسار) مع قوائم منسدلة جاهزة.</div>
                <button disabled={busy} onClick={download} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #DDE5F0', background: '#fff', color: '#1D4ED8', borderRadius: 10, padding: '9px 15px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Icon d="M12 3v12M7 10l5 5 5-5M5 21h14" size={15} color="#1D4ED8" /> تنزيل نموذج Excel
                </button>
              </div>
            </div>

            {/* STEP 2 — upload the filled file */}
            <div style={{ border: '1px solid #E7ECF4', borderRadius: 14, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {stepNum(2, !!parsed)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>رفع الملف المعبّأ</div>
                <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, margin: '4px 0 10px' }}>ارفع الملف بعد تعبئته (Excel أو CSV).</div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px dashed #B9C7DE', background: '#F7FAFF', color: '#1D4ED8', borderRadius: 10, padding: '10px 15px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
                  <Icon d={IC_UPLOAD} size={15} color="#1D4ED8" /> {fileName || 'اختيار الملف'}
                  <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                </label>
                {parsed && (
                  <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: parsed.length ? '#0B8A4B' : '#C0392B' }}>
                    {parsed.length ? `تم التعرف على ${parsed.length} مستخدمًا جاهزًا للإضافة` : 'لم يتم العثور على صفوف صالحة — تحقق من الملف'}
                  </div>
                )}
              </div>
            </div>

            {busy && parsed && (
              <div style={{ fontSize: 12, color: '#54627B', fontWeight: 700 }}>جارٍ الإضافة… {progress} / {parsed.length}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, marginTop: 4 }}>
              <button disabled={!parsed || !parsed.length || busy} onClick={doImport} style={{ border: 'none', background: parsed && parsed.length ? 'linear-gradient(180deg,#2E74EE,#1F5FE0)' : '#C7D2E4', color: '#fff', borderRadius: 11, padding: '11px 24px', fontWeight: 800, fontSize: 13, cursor: parsed && parsed.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>استيراد</button>
              <button onClick={onClose} style={{ border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', borderRadius: 11, padding: '11px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
