'use client';
// ---------------------------------------------------------------------------
// Admin console (لوحة المشرف): the system administrator manages users & roles,
// and specifically assigns the stream heads (رؤساء المسارات) and the national
// committee (اللجنة الوطنية). Coordinators are provisioned by the entity rep
// in team setup, so they appear here read-only for oversight.
// ---------------------------------------------------------------------------
import { useMemo, useState, type CSSProperties } from 'react';
import { CONTACT_STREAMS } from '@/lib/domain';
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

type Tab = 'users' | 'assign' | 'roles' | 'site' | 'contact';

const blankUser = (): UserRec => ({
  id: '', role: 'coord', name: '', title: '', email: '', phone: '', active: true,
});

export function AdminConsole({ vm }: { vm: VM }) {
  const s = useStore();
  const a = vm.admin;
  const [tab, setTab] = useState<Tab>('users');
  const [roleFilter, setRoleFilter] = useState<RoleKey | 'all'>('all');
  const [editing, setEditing] = useState<UserRec | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(
    () => (roleFilter === 'all' ? a.users : a.users.filter((u) => u.role === roleFilter)),
    [a.users, roleFilter]
  );

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
          <UsersTab a={a} filtered={filtered} roleFilter={roleFilter} setRoleFilter={setRoleFilter} onAdd={() => setEditing(blankUser())} onBulk={() => setBulkOpen(true)} onEdit={setEditing} onToggle={a.toggleUser} onRemove={a.removeUser} />
        )}
        {tab === 'assign' && <AssignTab a={a} onEdit={setEditing} onAdd={(u) => setEditing(u)} />}
        {tab === 'roles' && <RolesTab a={a} />}
        {tab === 'site' && <SiteTab />}
        {tab === 'contact' && <ContactTab a={a} />}
      </div>

      {editing && (
        <UserEditor
          a={a}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(u) => {
            a.saveUser(u.id ? u : { ...u, id: 'u-' + Math.abs(hashStr(u.email + u.name + u.role)).toString(36) });
            setEditing(null);
          }}
        />
      )}

      {bulkOpen && <BulkUsers a={a} onClose={() => setBulkOpen(false)} />}
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

// read a picked cover image, downscale to ≤640px wide and store as data URL
function readCoverFile(file: File, done: (dataUrl: string) => void) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
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

function SiteTab() {
  const s = useStore();
  const ab = s.about;
  const inp = (v: string, on: (x: string) => void, ph = '', flex = '1 1 180px'): React.ReactNode => (
    <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={{ ...inputSt, flex }} />
  );
  const rowShell: CSSProperties = { border: '1px solid #E7ECF4', borderRadius: 12, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
  const delBtn = (onDel: () => void) => (
    <button onClick={onDel} title="حذف" style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <Icon d={IC_TRASH} size={14} color="#C0303B" />
    </button>
  );
  const updList = <K extends 'timeline' | 'tracks' | 'scope' | 'principles'>(key: K, idx: number, patch: Partial<(typeof ab)[K][number]>) => {
    const list = ab[key].map((x, i) => (i === idx ? { ...x, ...patch } : x));
    s.setAbout({ [key]: list } as Partial<typeof ab>);
  };
  const delFrom = (key: 'timeline' | 'tracks' | 'scope' | 'principles', idx: number) =>
    s.setAbout({ [key]: ab[key].filter((_, i) => i !== idx) } as Partial<typeof ab>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SiteSection title="محتوى صفحة «عن المشروع» — النص التعريفي" sub="النص أعلى الصفحة العامة — يُحفظ تلقائياً ويظهر للزوار مباشرة.">
        <textarea value={s.aboutHero} onChange={(e) => s.setAboutHero(e.target.value)} rows={7} style={siteTa} />
      </SiteSection>

      <SiteSection
        title="مسيرة التحول الحكومي (الخط الزمني)"
        sub="محطات المسيرة — «رئيسية» تظهر بدائرة صورة على الخط، و«فرعية» أسفل الخط."
        onAdd={() => s.setAbout({ timeline: [...ab.timeline, { year: '', title: '', sub: '', major: true }] })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ab.timeline.map((t, i) => (
            <div key={i} style={rowShell}>
              {inp(t.year, (v) => updList('timeline', i, { year: v }), 'السنة', '0 0 80px')}
              {inp(t.title, (v) => updList('timeline', i, { title: v }), 'العنوان')}
              {inp(t.sub, (v) => updList('timeline', i, { sub: v }), 'الوصف')}
              <select value={t.major ? '1' : '0'} onChange={(e) => updList('timeline', i, { major: e.target.value === '1' })} style={{ ...inputSt, flex: '0 0 110px', paddingLeft: 26, cursor: 'pointer' }}>
                <option value="1">رئيسية</option>
                <option value="0">فرعية</option>
              </select>
              {t.img ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.img} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid #E1E7F1', flex: 'none' }} />
                  <button
                    onClick={() => updList('timeline', i, { img: '' })}
                    title="إزالة الصورة"
                    style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon d={IC_TRASH} size={12} color="#C0303B" />
                  </button>
                </span>
              ) : (
                <label title="إرفاق صورة المحطة" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#F4F7FC', border: '1px dashed #C7D1E2', borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', flex: 'none' }}>
                  <Icon d="M12 15V3M7 8l5-5 5 5M5 21h14" size={13} color="#2563EB" />
                  صورة
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readCoverFile(f, (url) => updList('timeline', i, { img: url }));
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
              {delBtn(() => delFrom('timeline', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="المستهدفات الرئيسية" sub="بطاقتا المستهدفات والملاحظة أسفلهما.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={rowShell}>
            {inp(ab.targets.label1, (v) => s.setAbout({ targets: { ...ab.targets, label1: v } }), 'عنوان البطاقة الأولى', '0 0 140px')}
            {inp(ab.targets.value1, (v) => s.setAbout({ targets: { ...ab.targets, value1: v } }), 'الرقم', '0 0 90px')}
            {inp(ab.targets.text1, (v) => s.setAbout({ targets: { ...ab.targets, text1: v } }), 'النص')}
          </div>
          <div style={rowShell}>
            {inp(ab.targets.label2, (v) => s.setAbout({ targets: { ...ab.targets, label2: v } }), 'عنوان البطاقة الثانية', '0 0 140px')}
            {inp(ab.targets.value2, (v) => s.setAbout({ targets: { ...ab.targets, value2: v } }), 'الرقم', '0 0 90px')}
            {inp(ab.targets.text2, (v) => s.setAbout({ targets: { ...ab.targets, text2: v } }), 'النص')}
          </div>
          <textarea value={ab.targets.note} onChange={(e) => s.setAbout({ targets: { ...ab.targets, note: e.target.value } })} rows={3} placeholder="ملاحظة النتائج والأثر المتوقع" style={siteTa} />
        </div>
      </SiteSection>

      <SiteSection title="المسارات" sub="قائمة المسارات المعروضة للزوار (الترقيم تلقائي)." onAdd={() => s.setAbout({ tracks: [...ab.tracks, { title: '', desc: '' }] })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ab.tracks.map((t, i) => (
            <div key={i} style={rowShell}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#8FA3C4', flex: 'none', width: 26, textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
              {inp(t.title, (v) => updList('tracks', i, { title: v }), 'اسم المسار', '0 0 220px')}
              {inp(t.desc, (v) => updList('tracks', i, { desc: v }), 'الوصف')}
              {delBtn(() => delFrom('tracks', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="نطاق التحويل" sub="بطاقات نطاق التحويل المعروضة للزوار." onAdd={() => s.setAbout({ scope: [...ab.scope, { title: '', desc: '' }] })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ab.scope.map((t, i) => (
            <div key={i} style={rowShell}>
              {inp(t.title, (v) => updList('scope', i, { title: v }), 'العنوان', '0 0 200px')}
              {inp(t.desc, (v) => updList('scope', i, { desc: v }), 'الوصف')}
              {delBtn(() => delFrom('scope', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection title="المبادئ العامة" sub="القائمة الكاملة للمبادئ (العدد تلقائي)." onAdd={() => s.setAbout({ principles: [...ab.principles, { title: '', desc: '' }] })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ab.principles.map((t, i) => (
            <div key={i} style={rowShell}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#8FA3C4', flex: 'none', width: 22, textAlign: 'center' }}>{i + 1}</span>
              {inp(t.title, (v) => updList('principles', i, { title: v }), 'المبدأ', '0 0 220px')}
              {inp(t.desc, (v) => updList('principles', i, { desc: v }), 'الوصف')}
              {delBtn(() => delFrom('principles', i))}
            </div>
          ))}
        </div>
      </SiteSection>

      <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>وثائق المكتبة</div>
          <button
            onClick={s.addLibDoc}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon d={IC_PLUS} size={13} color="#fff" />
            إضافة وثيقة
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#8A97AD', lineHeight: 1.7, marginBottom: 14 }}>
          الوثائق المعروضة في صفحة «المكتبة» العامة — أرفق ملف PDF وصورة الغلاف مباشرة من هنا.
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
                <select value={d.cat} onChange={(e) => s.updLibDoc(d.id, { cat: e.target.value as 'guide' | 'system' })} style={{ ...inputSt, paddingLeft: 26, cursor: 'pointer' }}>
                  <option value="guide">دليل</option>
                  <option value="system">نظام عمل</option>
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
                      onClick={() => s.updLibDoc(d.id, { coverUrl: '' })}
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
                        if (f) readCoverFile(f, (url) => s.updLibDoc(d.id, { coverUrl: url }));
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

function hashStr(x: string): number {
  let h = 0;
  for (let i = 0; i < x.length; i++) h = (h << 5) - h + x.charCodeAt(i) | 0;
  return h || x.length + 1;
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
function AssignTab({ a, onEdit, onAdd }: { a: VM['admin']; onEdit: (u: UserRec) => void; onAdd: (seed: UserRec) => void }) {
  const heads = a.users.filter((u) => (u.role === 'path' || u.role === 'deputy'));
  const committee = a.users.filter((u) => (u.role === 'ai' || u.role === 'secretariat'));
  const headByStream = (id: string) => heads.find((h) => h.streamId === id);
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={card}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF2F8', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon d={IC_STAR} size={16} color="#1D4ED8" /> رؤساء المسارات
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12, padding: 16 }}>
          {a.streams.map((st) => {
            const h = headByStream(st.id);
            return (
              <div key={st.id} style={{ border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 13, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 700 }}>{st.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 3 }}>{h?.name || 'لم يُعيّن بعد'}</div>
                  {h?.email && <div style={{ fontSize: 11, color: '#9AA6BC', direction: 'ltr', textAlign: 'right' }}>{h.email}</div>}
                </div>
                <button
                  onClick={() => (h ? onEdit(h) : onAdd({ id: '', role: 'path', name: '', title: `رئيس مسار ${st.name}`, email: '', phone: '', streamId: st.id, active: true }))}
                  style={{ border: '1px solid #D8E3F5', background: '#F1F5FB', color: '#1D4ED8', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flex: 'none' }}>
                  {h ? 'تعديل' : 'تعيين'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon d={IC_SHIELD} size={16} color="#1D4ED8" /> اللجنة الوطنية
          </div>
          <button onClick={() => onAdd({ id: '', role: 'ai', name: '', title: 'عضو اللجنة الوطنية', email: '', phone: '', active: true })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #D8E3F5', background: '#F1F5FB', color: '#1D4ED8', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
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
function RolesTab({ a }: { a: VM['admin'] }) {
  return (
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
  );
}

// ---- User editor modal ----------------------------------------------------
function UserEditor({ a, user, onClose, onSave }: { a: VM['admin']; user: UserRec; onClose: () => void; onSave: (u: UserRec) => void }) {
  const [f, setF] = useState<UserRec>(user);
  const set = (patch: Partial<UserRec>) => setF((x) => ({ ...x, ...patch }));
  const needsEntity = f.role === 'coord';
  const needsStream = f.role === 'coord' || f.role === 'path';
  const emailOk = /^\S+@\S+\.\S+$/.test(f.email.trim());
  const valid = f.name.trim() && emailOk && (!needsEntity || f.entityName) && (!needsStream || f.streamId);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,20,44,.5)' }} />
      <div style={{ position: 'relative', width: 'min(520px,calc(100vw-32px))', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 30px 70px -24px rgba(2,12,35,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{user.id ? 'تعديل مستخدم' : 'إضافة مستخدم'}</div>
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
              <label style={labelSt}>الدور *</label>
              <select style={{ ...inputSt, cursor: 'pointer' }} value={f.role} onChange={(e) => set({ role: e.target.value as RoleKey })}>
                {a.roleInfo.map((r) => <option key={r.key} value={r.key}>{r.nameAr}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>البريد الإلكتروني *</label>
              <input style={{ ...inputSt, direction: 'ltr', textAlign: 'right' }} value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@aigp.gov.ae" />
            </div>
            <div>
              <label style={labelSt}>رقم الهاتف المتحرك</label>
              <input style={{ ...inputSt, direction: 'ltr', textAlign: 'right' }} value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+971 5x xxx xxxx" />
            </div>
          </div>
          {(needsEntity || needsStream) && (
            <div style={{ display: 'grid', gridTemplateColumns: needsEntity && needsStream ? '1fr 1fr' : '1fr', gap: 12 }}>
              {needsEntity && (
                <div>
                  <label style={labelSt}>الجهة *</label>
                  <select style={{ ...inputSt, cursor: 'pointer' }} value={f.entityName || ''} onChange={(e) => set({ entityName: e.target.value })}>
                    <option value="">اختر الجهة…</option>
                    {a.entities.map((en) => <option key={en} value={en}>{en}</option>)}
                  </select>
                </div>
              )}
              {needsStream && (
                <div>
                  <label style={labelSt}>المسار *</label>
                  <select style={{ ...inputSt, cursor: 'pointer' }} value={f.streamId || ''} onChange={(e) => set({ streamId: e.target.value })}>
                    <option value="">اختر المسار…</option>
                    {a.streams.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#33405A' }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
            الحساب نشط
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, marginTop: 20 }}>
          <button disabled={!valid} onClick={() => valid && onSave({ ...f, name: f.name.trim(), email: f.email.trim(), entityName: needsEntity ? f.entityName : undefined, streamId: needsStream ? f.streamId : undefined })} style={{ border: 'none', background: valid ? 'linear-gradient(180deg,#2E74EE,#1F5FE0)' : '#C7D2E4', color: '#fff', borderRadius: 11, padding: '11px 22px', fontWeight: 800, fontSize: 13, cursor: valid ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            حفظ
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
function BulkUsers({ a, onClose }: { a: VM['admin']; onClose: () => void }) {
  const [parsed, setParsed] = useState<{ valid: boolean; rec: UserRec }[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ added: number; skipped: number } | null>(null);

  const roleLabels = a.roleInfo.map((r) => r.nameAr);
  const roleFromToken = (t: string): RoleKey | null => {
    const s = t.trim();
    return a.roleInfo.find((r) => r.key === s)?.key || a.roleInfo.find((r) => r.nameAr === s)?.key || null;
  };
  const streamFromToken = (t: string): string | undefined => {
    const s = t.trim();
    return s ? (a.streams.find((x) => x.id === s)?.id || a.streams.find((x) => x.name === s)?.id) : undefined;
  };
  const entityFromToken = (t: string): string | undefined => {
    const s = t.trim();
    return s ? (a.entities.find((e) => e === s) || s) : undefined;
  };
  const SAMPLE_EMAILS = new Set(['m.alameri@aigp.gov.ae', 'm.ahmed@aigp.gov.ae', 's.khaled@aigp.gov.ae']);

  const download = async () => {
    setBusy(true);
    try {
      await downloadUsersTemplate(roleLabels, a.entities, a.streams.map((x) => x.name));
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
      const recs = rows
        .filter((c) => (c[0] || '').trim() && /^\S+@\S+\.\S+$/.test((c[1] || '').trim()) && !SAMPLE_EMAILS.has((c[1] || '').trim()))
        .map((c) => {
          const role = roleFromToken(c[2] || '') || 'coord';
          const needsEntity = role === 'entity' || role === 'coord';
          const needsStream = role === 'coord' || role === 'path';
          return {
            valid: true,
            rec: {
              id: '', role, name: (c[0] || '').trim(), title: '', email: (c[1] || '').trim(), phone: '',
              entityName: needsEntity ? entityFromToken(c[3] || '') : undefined,
              streamId: needsStream ? streamFromToken(c[4] || '') : undefined,
              active: true,
            } as UserRec,
          };
        });
      setParsed(recs);
    } finally {
      setBusy(false);
    }
  };

  const doImport = () => {
    if (!parsed) return;
    parsed.forEach((p, i) => a.saveUser({ ...p.rec, id: 'u-b' + Math.abs(hashStr(p.rec.email + p.rec.name + i)).toString(36) }));
    setDone({ added: parsed.length, skipped: 0 });
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
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>تمت إضافة {done.added} مستخدمًا</div>
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
