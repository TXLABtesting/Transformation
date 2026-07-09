'use client';
// ---------------------------------------------------------------------------
// Admin console (لوحة المشرف): the system administrator manages users & roles,
// and specifically assigns the stream heads (رؤساء المسارات) and the national
// committee (اللجنة الوطنية). Coordinators are provisioned by the entity rep
// in team setup, so they appear here read-only for oversight.
// ---------------------------------------------------------------------------
import { useMemo, useState, type CSSProperties } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import type { RoleKey, UserRec } from '@/lib/domain';
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

type Tab = 'users' | 'assign' | 'roles';

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
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: u.roleBg, color: u.roleBadge, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flex: 'none' }}>{u.initials}</span>
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
  const heads = a.users.filter((u) => u.role === 'path');
  const committee = a.users.filter((u) => u.role === 'ai');
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
  const needsEntity = f.role === 'entity' || f.role === 'coord';
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
              <label style={labelSt}>رقم الهاتف</label>
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

// ---- Bulk user upload -----------------------------------------------------
// Admins import many accounts at once: paste rows or load a .csv, one user per
// line as «الاسم,البريد,الدور,الجهة,المسار». Role accepts the key
// (admin|coord|entity|path|ai) or the Arabic name; stream accepts the id or
// its Arabic name. Rows missing a name/email are skipped.
function BulkUsers({ a, onClose }: { a: VM['admin']; onClose: () => void }) {
  const [text, setText] = useState('');
  const [done, setDone] = useState<{ added: number; skipped: number } | null>(null);

  const roleFromToken = (t: string): RoleKey | null => {
    const s = t.trim();
    const byKey = a.roleInfo.find((r) => r.key === s);
    if (byKey) return byKey.key;
    const byName = a.roleInfo.find((r) => r.nameAr === s);
    return byName ? byName.key : null;
  };
  const streamFromToken = (t: string): string | undefined => {
    const s = t.trim();
    if (!s) return undefined;
    const byId = a.streams.find((x) => x.id === s);
    if (byId) return byId.id;
    const byName = a.streams.find((x) => x.name === s);
    return byName ? byName.id : undefined;
  };
  const entityFromToken = (t: string): string | undefined => {
    const s = t.trim();
    return s ? (a.entities.find((e) => e === s) || s) : undefined;
  };

  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#/.test(l) && !/^الاسم\s*,/.test(l) && !/^name\s*,/i.test(l));

  const parsed = rows.map((line) => {
    const c = line.split(/[,\t]/).map((x) => x.trim());
    const [name, email, roleTok = '', entTok = '', streamTok = ''] = c;
    const role = roleFromToken(roleTok) || 'coord';
    const needsEntity = role === 'entity' || role === 'coord';
    const needsStream = role === 'coord' || role === 'path';
    const valid = !!(name && /^\S+@\S+\.\S+$/.test(email || ''));
    return {
      valid,
      rec: {
        id: '',
        role,
        name: name || '',
        title: '',
        email: email || '',
        phone: '',
        entityName: needsEntity ? entityFromToken(entTok) : undefined,
        streamId: needsStream ? streamFromToken(streamTok) : undefined,
        active: true,
      } as UserRec,
    };
  });
  const validCount = parsed.filter((p) => p.valid).length;

  const doImport = () => {
    let added = 0;
    parsed.forEach((p, i) => {
      if (!p.valid) return;
      a.saveUser({ ...p.rec, id: 'u-b' + Math.abs(hashStr(p.rec.email + p.rec.name + i)).toString(36) });
      added++;
    });
    setDone({ added, skipped: parsed.length - added });
  };

  const template = 'الاسم,البريد الإلكتروني,الدور,الجهة,المسار\nمحمد أحمد,m.ahmed@aigp.gov.ae,coord,وزارة شؤون مجلس الوزراء,services\nسارة خالد,s.khaled@aigp.gov.ae,entity,وزارة الاقتصاد والسياحة,';
  const templateHref = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(template);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,20,44,.5)' }} />
      <div style={{ position: 'relative', width: 'min(620px,calc(100vw-32px))', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 30px 70px -24px rgba(2,12,35,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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
            {done.skipped > 0 && <div style={{ fontSize: 12.5, color: '#8A97AD', marginTop: 4 }}>تم تجاهل {done.skipped} صفًا غير مكتمل</div>}
            <button onClick={onClose} style={{ marginTop: 18, border: 'none', background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', borderRadius: 11, padding: '11px 26px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>تم</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: '#54627B', lineHeight: 1.9, background: '#F7F9FD', border: '1px solid #EEF2F8', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              أدخل مستخدمًا واحدًا في كل سطر بالصيغة: <b>الاسم، البريد الإلكتروني، الدور، الجهة، المسار</b>.
              <br />الدور: <code>admin</code> / <code>coord</code> / <code>entity</code> / <code>path</code> / <code>ai</code> (أو الاسم بالعربية). الجهة والمسار مطلوبان حسب الدور.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #DDE5F0', background: '#fff', color: '#1D4ED8', borderRadius: 10, padding: '8px 13px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                <Icon d={IC_UPLOAD} size={14} color="#1D4ED8" /> اختيار ملف CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const rd = new FileReader();
                    rd.onload = () => setText(String(rd.result || ''));
                    rd.readAsText(f);
                  }}
                />
              </label>
              <a href={templateHref} download="users-template.csv" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #DDE5F0', background: '#fff', color: '#54627B', borderRadius: 10, padding: '8px 13px', fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>
                تنزيل قالب
              </a>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={template}
              spellCheck={false}
              style={{ width: '100%', minHeight: 160, border: '1px solid #DDE5F0', borderRadius: 12, padding: 12, fontSize: 12.5, fontFamily: 'ui-monospace,monospace', direction: 'ltr', textAlign: 'right', resize: 'vertical', outline: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 10 }}>
              <div style={{ fontSize: 12.5, color: '#54627B' }}>{validCount} مستخدم جاهز للإضافة</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', borderRadius: 11, padding: '11px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                <button disabled={!validCount} onClick={doImport} style={{ border: 'none', background: validCount ? 'linear-gradient(180deg,#2E74EE,#1F5FE0)' : '#C7D2E4', color: '#fff', borderRadius: 11, padding: '11px 22px', fontWeight: 800, fontSize: 13, cursor: validCount ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>استيراد</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
