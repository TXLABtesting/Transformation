'use client';
import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

// ============================================================================
// Admin Panel — Full management interface for system_admin / program_admin
// Accessible from the gear icon in the dashboard header.
// Tabs: Users | Entities | Streams | Roles & Permissions | Audit Logs
// ============================================================================

type Tab = 'users' | 'entities' | 'streams' | 'roles' | 'rules' | 'audit';

// ---- Types ----
interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  accessEnabled: boolean;
  entityId: string | null;
  streamId: string | null;
  entity?: string;
  stream?: string;
  roles: { id: string; code: string; nameAr: string }[];
  entityScopes: string[];
  streamScopes: string[];
  lastLoginAt: string | null;
  createdAt: string;
}
interface AdminEntity {
  id: string;
  nameAr: string;
  isActive: boolean;
  createdAt: string;
}
interface AdminStream {
  id: string;
  nameAr: string;
  descAr: string;
  headName: string | null;
  sortOrder: number;
}
interface AdminRole {
  id: string;
  code: string;
  nameAr: string;
  permissions: string[];
}
interface RoleRule {
  id: string;
  email: string;
  roleCode: string;
  entityId: string | null;
  streamId: string | null;
  entityName: string | null;
  streamName: string | null;
  displayName: string | null;
  isConsumed: boolean;
  consumedAt: string | null;
  createdAt: string;
}
interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  actorUserId: string | null;
  entityId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
}

// ---- Helpers ----
const BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '';
async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...opts });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-AE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const roleLabel: Record<string, string> = {
  system_admin: 'مدير النظام',
  program_admin: 'مدير البرنامج',
  entity_admin: 'مسؤول الجهة',
  entity_coordinator: 'منسق المسار في الجهة الاتحادية',
  entity_representative: 'ممثل الجهة',
  stream_owner: 'فريق عمل المسار في المشروع',
  ai_committee: 'اللجنة الوطنية للذكاء الاصطناعي المساعد',
  viewer: 'مستعرض',
  auditor: 'مدقق',
};

const statusLabel: Record<string, string> = {
  active: 'نشط',
  pending: 'قيد الانتظار',
  disabled: 'معطّل',
};
const statusColor: Record<string, string> = {
  active: '#16A34A',
  pending: '#D97706',
  disabled: '#DC2626',
};

const actionLabel: Record<string, string> = {
  bootstrap_admin_login: 'تسجيل دخول مدير',
  user_enabled: 'تفعيل مستخدم',
  user_disabled: 'تعطيل مستخدم',
  user_updated: 'تحديث مستخدم',
  role_assigned: 'تعيين دور',
  role_removed: 'إزالة دور',
  item_created: 'إنشاء عنصر',
  item_updated: 'تحديث عنصر',
  item_submitted: 'تقديم عنصر',
  item_approved: 'اعتماد عنصر',
  item_rejected: 'رفض عنصر',
  item_returned: 'إرجاع عنصر',
  mock_login: 'دخول تجريبي',
  team_registered: 'تسجيل فريق العمل',
  role_rule_created: 'إنشاء قاعدة صلاحية',
  role_rule_deleted: 'حذف قاعدة صلاحية',
};

// ---- Styles ----
const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(0,0,0,.45)',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  direction: 'rtl',
  animation: 'fadeIn .2s ease both',
};
const panel: CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-8px 0 40px rgba(0,0,0,.18)',
  animation: 'slideInRight .25s cubic-bezier(.23,1,.32,1) both',
};
const tabBar: CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '2px solid #E7ECF4',
  padding: '0 24px',
  background: '#FAFBFE',
};
const tabBtn = (active: boolean): CSSProperties => ({
  padding: '14px 20px',
  fontSize: 13.5,
  fontWeight: active ? 800 : 600,
  color: active ? '#0B2A66' : '#7B8BA5',
  background: 'none',
  border: 'none',
  borderBottom: active ? '3px solid #0B2A66' : '3px solid transparent',
  cursor: 'pointer',
  transition: 'all .15s',
  marginBottom: -2,
});
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: 13,
};
const th: CSSProperties = {
  textAlign: 'right',
  padding: '12px 14px',
  fontWeight: 700,
  color: '#54627B',
  background: '#F7F9FD',
  borderBottom: '1px solid #E7ECF4',
  whiteSpace: 'nowrap',
  fontSize: 12,
};
const td: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #F0F3F8',
  color: '#13213C',
  verticalAlign: 'top',
};
const badge = (color: string): CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  color: '#fff',
  background: color,
});
const smallBtn = (bg: string, fg: string): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  color: fg,
  background: bg,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity .15s',
});

// ---- Sub-components ----
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E7ECF4', borderTopColor: '#0B2A66', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9AA6BC' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{text}</div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', maxWidth: 320 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px 10px 36px',
          borderRadius: 10,
          border: '1px solid #E7ECF4',
          fontSize: 13,
          color: '#13213C',
          background: '#F7F9FD',
          outline: 'none',
        }}
      />
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9AA6BC' }}>
        <Icon d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
      </span>
    </div>
  );
}

// ---- Role Assignment Modal ----
function RoleModal({ user, roles, entities, streams, onClose, onSave }: {
  user: AdminUser;
  roles: AdminRole[];
  entities: AdminEntity[];
  streams: AdminStream[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState(user.roles[0]?.code || '');
  const [selectedEntity, setSelectedEntity] = useState(user.entityId || '');
  const [selectedStream, setSelectedStream] = useState(user.streamId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // 1. Assign role
      if (selectedRole) {
        await apiFetch(`/api/admin/users/${user.id}/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleCode: selectedRole }),
        });
      }
      // 2. Update entity/stream assignment
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: selectedEntity || null,
          streamId: selectedStream || null,
        }),
      });
      onSave();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: '28px 30px', width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,.3)', animation: 'fadeUp .2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#13213C', margin: 0 }}>تعديل صلاحيات المستخدم</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9AA6BC', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#F7F9FD', borderRadius: 12, border: '1px solid #E7ECF4' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#13213C' }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#7B8BA5', marginTop: 4 }}>{user.email || 'لا يوجد بريد إلكتروني'}</div>
        </div>

        {/* Role */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>الدور</label>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, background: '#fff' }}>
          <option value="">— اختر الدور —</option>
          {roles.map((r) => <option key={r.code} value={r.code}>{r.nameAr} ({r.code})</option>)}
        </select>

        {/* Entity */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>الجهة</label>
        <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, background: '#fff' }}>
          <option value="">— بدون جهة —</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.nameAr}</option>)}
        </select>

        {/* Stream */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>المسار</label>
        <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 20, background: '#fff' }}>
          <option value="">— بدون مسار —</option>
          {streams.map((st) => <option key={st.id} value={st.id}>{st.nameAr}</option>)}
        </select>

        {error && <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...smallBtn('#0B2A66', '#fff'), padding: '10px 28px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button onClick={onClose} style={{ ...smallBtn('#F0F3F8', '#54627B'), padding: '10px 28px', fontSize: 14 }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ---- Add User Modal ----
function AddUserModal({ roles, entities, streams, onClose, onCreated }: {
  roles: AdminRole[];
  entities: AdminEntity[];
  streams: AdminStream[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [enableNow, setEnableNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const valid = name.trim().length > 0 && emailOk;

  const handleCreate = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      // 1. Create the account
      const { user } = await apiFetch<{ user: { id: string } }>('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          entityId: selectedEntity || undefined,
          streamId: selectedStream || undefined,
        }),
      });
      // 2. Assign the RBAC role (grants the actual permissions — the
      // legacy `role` field alone does not).
      if (selectedRole) {
        await apiFetch(`/api/admin/users/${user.id}/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleCode: selectedRole }),
        });
      }
      // 3. New accounts are created disabled (status: pending) — enable
      // immediately unless the admin unchecks it.
      if (enableNow) {
        await apiFetch(`/api/admin/users/${user.id}/enable`, { method: 'POST' });
      }
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: '28px 30px', width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,.3)', animation: 'fadeUp .2s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#13213C', margin: 0 }}>إضافة مستخدم</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9AA6BC', fontSize: 20 }}>✕</button>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>الاسم</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المستخدم" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16 }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>البريد الإلكتروني</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@entity.gov.ae" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, direction: 'ltr', textAlign: 'right' }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>الدور</label>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, background: '#fff' }}>
          <option value="">— بدون دور (يُعيَّن لاحقًا) —</option>
          {roles.map((r) => <option key={r.code} value={r.code}>{r.nameAr} ({r.code})</option>)}
        </select>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>الجهة</label>
        <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, background: '#fff' }}>
          <option value="">— بدون جهة —</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.nameAr}</option>)}
        </select>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#54627B', marginBottom: 6 }}>المسار</label>
        <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7ECF4', fontSize: 13, marginBottom: 16, background: '#fff' }}>
          <option value="">— بدون مسار —</option>
          {streams.map((st) => <option key={st.id} value={st.id}>{st.nameAr}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#54627B', marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={enableNow} onChange={(e) => setEnableNow(e.target.checked)} />
          تفعيل الحساب مباشرة
        </label>

        {error && <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
          <button onClick={handleCreate} disabled={saving || !valid} style={{ ...smallBtn('#0B2A66', '#fff'), padding: '10px 28px', fontSize: 14, opacity: saving || !valid ? 0.6 : 1 }}>
            {saving ? 'جارٍ الإضافة...' : 'إضافة المستخدم'}
          </button>
          <button onClick={onClose} style={{ ...smallBtn('#F0F3F8', '#54627B'), padding: '10px 28px', fontSize: 14 }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ADMIN PANEL
// ============================================================================
export function AdminPanel({ onClose, fullPage = false }: { onClose: () => void; fullPage?: boolean }) {
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [entities, setEntities] = useState<AdminEntity[]>([]);
  const [streams, setStreams] = useState<AdminStream[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [roleRules, setRoleRules] = useState<RoleRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Role modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  // Add-user modal
  const [addUserOpen, setAddUserOpen] = useState(false);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      switch (t) {
        case 'users': {
          const d = await apiFetch<{ users: AdminUser[] }>('/api/admin/users');
          setUsers(d.users);
          // Also load entities/streams/roles for the role modal
          const [eRes, sRes, rRes] = await Promise.all([
            apiFetch<{ entities: AdminEntity[] }>('/api/admin/entities'),
            apiFetch<{ streams: AdminStream[] }>('/api/admin/streams'),
            apiFetch<{ roles: AdminRole[] }>('/api/admin/roles'),
          ]);
          setEntities(eRes.entities);
          setStreams(sRes.streams);
          setRoles(rRes.roles);
          break;
        }
        case 'entities': {
          const d = await apiFetch<{ entities: AdminEntity[] }>('/api/admin/entities');
          setEntities(d.entities);
          break;
        }
        case 'streams': {
          const d = await apiFetch<{ streams: AdminStream[] }>('/api/admin/streams');
          setStreams(d.streams);
          break;
        }
        case 'roles': {
          const [rRes, pRes] = await Promise.all([
            apiFetch<{ roles: AdminRole[] }>('/api/admin/roles'),
            apiFetch<{ permissions: { id: string; code: string; description: string }[] }>('/api/admin/permissions'),
          ]);
          setRoles(rRes.roles);
          break;
        }
        case 'rules': {
          const d = await apiFetch<{ rules: RoleRule[] }>('/api/admin/role-rules');
          setRoleRules(d.rules);
          // Also load entities/streams for the add form
          const [eRes2, sRes2] = await Promise.all([
            apiFetch<{ entities: AdminEntity[] }>('/api/admin/entities'),
            apiFetch<{ streams: AdminStream[] }>('/api/admin/streams'),
          ]);
          setEntities(eRes2.entities);
          setStreams(sRes2.streams);
          break;
        }
        case 'audit': {
          const d = await apiFetch<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs?limit=200');
          setAuditLogs(d.auditLogs);
          break;
        }
      }
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch('');
  };

  // ---- User actions ----
  const toggleUser = async (u: AdminUser) => {
    const action = u.accessEnabled ? 'disable' : 'enable';
    try {
      await apiFetch(`/api/admin/users/${u.id}/${action}`, { method: 'POST' });
      loadTab('users');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ---- Role Rules actions ----
  const deleteRule = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
    try {
      await apiFetch('/api/admin/role-rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      loadTab('rules');
    } catch (e) { alert((e as Error).message); }
  };
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleEmail, setNewRuleEmail] = useState('');
  const [newRuleRole, setNewRuleRole] = useState('entity_coordinator');
  const [newRuleEntity, setNewRuleEntity] = useState('');
  const [newRuleStream, setNewRuleStream] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const addRule = async () => {
    if (!newRuleEmail.trim()) return alert('البريد الإلكتروني مطلوب');
    setAddingRule(true);
    try {
      await apiFetch('/api/admin/role-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newRuleEmail.trim(), roleCode: newRuleRole, entityId: newRuleEntity || null, streamId: newRuleStream || null, displayName: newRuleName || null }),
      });
      setNewRuleEmail(''); setNewRuleName(''); setShowAddRule(false);
      loadTab('rules');
    } catch (e) { alert((e as Error).message); }
    finally { setAddingRule(false); }
  };

  // ---- Filtered data ----
  const filteredUsers = users.filter((u) =>
    !search || u.name.includes(search) || (u.email || '').includes(search) || (u.entity || '').includes(search)
  );
  const filteredEntities = entities.filter((e) => !search || e.nameAr.includes(search));
  const filteredStreams = streams.filter((s) => !search || s.nameAr.includes(search));
  const filteredRules = roleRules.filter((r) =>
    !search || r.email.includes(search) || (r.displayName || '').includes(search) || (r.entityName || '').includes(search)
  );
  const filteredAudit = auditLogs.filter((a) =>
    !search || (a.action || '').includes(search) || (a.resourceType || '').includes(search) || (a.actorUserId || '').includes(search)
  );

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: 'users', label: 'المستخدمون', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', count: users.length },
    { key: 'entities', label: 'الجهات', icon: 'M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M12 3l9 4H3l9-4z', count: entities.length },
    { key: 'streams', label: 'المسارات', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', count: streams.length },
    { key: 'roles', label: 'الأدوار والصلاحيات', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { key: 'rules', label: 'قواعد الصلاحيات', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2', count: roleRules.length },
    { key: 'audit', label: 'سجل المراجعة', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  ];

  const wrapperStyle: CSSProperties = fullPage
    ? { minHeight: '100vh', background: '#EEF2F9', display: 'flex', direction: 'rtl' }
    : overlay;
  const panelStyle: CSSProperties = fullPage
    ? { ...panel, maxWidth: '100%', width: '100%', boxShadow: 'none', borderRadius: 0 }
    : panel;

  return (
    <div style={wrapperStyle} onClick={fullPage ? undefined : onClose}>
      <div style={panelStyle} onClick={fullPage ? undefined : (e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E7ECF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0B2A66,#1A4B9C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#13213C', margin: 0 }}>لوحة الإدارة</h2>
              <p style={{ fontSize: 12, color: '#7B8BA5', margin: '2px 0 0' }}>إدارة المستخدمين والجهات والأدوار</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#54627B', transition: 'background .15s' }}>
            <Icon d="M18 6L6 18M6 6l12 12" />
          </button>
        </div>

        {/* Tabs */}
        <div style={tabBar}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => handleTabChange(t.key)} style={tabBtn(tab === t.key)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon d={t.icon} size={15} />
                {t.label}
                {t.count !== undefined && <span style={{ fontSize: 11, color: tab === t.key ? '#0B2A66' : '#9AA6BC', fontWeight: 800 }}>({t.count})</span>}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '16px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SearchInput value={search} onChange={setSearch} placeholder={tab === 'users' ? 'بحث بالاسم أو البريد أو الجهة...' : tab === 'audit' ? 'بحث بالإجراء أو النوع...' : 'بحث...'} />
          {tab === 'users' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#7B8BA5', fontWeight: 600 }}>
                {filteredUsers.length} مستخدم
              </div>
              <button onClick={() => setAddUserOpen(true)} style={smallBtn('#0B2A66', '#fff')}>
                + إضافة مستخدم
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 24px' }}>
          {loading ? <Spinner /> : (
            <>
              {/* ==================== USERS ==================== */}
              {tab === 'users' && (
                filteredUsers.length === 0 ? <EmptyState text="لا يوجد مستخدمون" /> : (
                  <div style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={th}>الاسم</th>
                          <th style={th}>البريد الإلكتروني</th>
                          <th style={th}>الدور</th>
                          <th style={th}>الجهة</th>
                          <th style={th}>المسار</th>
                          <th style={th}>الحالة</th>
                          <th style={th}>آخر دخول</th>
                          <th style={th}>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} style={{ transition: 'background .1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFBFE')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                            <td style={td}>
                              <div style={{ fontWeight: 700 }}>{u.name}</div>
                            </td>
                            <td style={{ ...td, direction: 'ltr', textAlign: 'right', fontSize: 12, color: '#54627B' }}>{u.email || '—'}</td>
                            <td style={td}>
                              {u.roles.length > 0 ? (
                                <span style={{ ...badge('#0B2A66'), fontSize: 11 }}>{u.roles[0].nameAr}</span>
                              ) : (
                                <span style={{ color: '#9AA6BC', fontSize: 12 }}>بدون دور</span>
                              )}
                            </td>
                            <td style={{ ...td, fontSize: 12 }}>{u.entity || '—'}</td>
                            <td style={{ ...td, fontSize: 12 }}>{u.stream || '—'}</td>
                            <td style={td}>
                              <span style={badge(statusColor[u.status] || '#9AA6BC')}>{statusLabel[u.status] || u.status}</span>
                            </td>
                            <td style={{ ...td, fontSize: 12, color: '#7B8BA5' }}>{formatDate(u.lastLoginAt)}</td>
                            <td style={td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setEditUser(u)} style={smallBtn('#EEF2F9', '#0B2A66')} title="تعديل الصلاحيات">
                                  <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={14} />
                                </button>
                                <button onClick={() => toggleUser(u)} style={smallBtn(u.accessEnabled ? '#FEF2F2' : '#F0FDF4', u.accessEnabled ? '#DC2626' : '#16A34A')} title={u.accessEnabled ? 'تعطيل' : 'تفعيل'}>
                                  {u.accessEnabled ? (
                                    <Icon d="M18.36 6.64A9 9 0 0 1 20.77 15M5.63 18.36A9 9 0 0 1 3.23 9M1 1l22 22" size={14} />
                                  ) : (
                                    <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ==================== ENTITIES ==================== */}
              {tab === 'entities' && (
                filteredEntities.length === 0 ? <EmptyState text="لا توجد جهات" /> : (
                  <div style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th}>اسم الجهة</th>
                          <th style={th}>الحالة</th>
                          <th style={th}>تاريخ الإنشاء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntities.map((e, i) => (
                          <tr key={e.id} onMouseEnter={(ev) => (ev.currentTarget.style.background = '#FAFBFE')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                            <td style={{ ...td, fontWeight: 700, color: '#7B8BA5', width: 50 }}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{e.nameAr}</td>
                            <td style={td}>
                              <span style={badge(e.isActive ? '#16A34A' : '#DC2626')}>{e.isActive ? 'نشطة' : 'غير نشطة'}</span>
                            </td>
                            <td style={{ ...td, fontSize: 12, color: '#7B8BA5' }}>{formatDate(e.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ==================== STREAMS ==================== */}
              {tab === 'streams' && (
                filteredStreams.length === 0 ? <EmptyState text="لا توجد مسارات" /> : (
                  <div style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th}>اسم المسار</th>
                          <th style={th}>الوصف</th>
                          <th style={th}>فريق عمل المسار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStreams.map((s, i) => (
                          <tr key={s.id} onMouseEnter={(ev) => (ev.currentTarget.style.background = '#FAFBFE')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                            <td style={{ ...td, fontWeight: 700, color: '#7B8BA5', width: 50 }}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{s.nameAr}</td>
                            <td style={{ ...td, fontSize: 12, color: '#54627B' }}>{s.descAr}</td>
                            <td style={{ ...td, fontSize: 13 }}>{s.headName || <span style={{ color: '#9AA6BC' }}>لم يُعيّن</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ==================== ROLES & PERMISSIONS ==================== */}
              {tab === 'roles' && (
                roles.length === 0 ? <EmptyState text="لا توجد أدوار" /> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {roles.map((r) => (
                      <div key={r.id} style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', background: '#F7F9FD', borderBottom: '1px solid #E7ECF4', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#0B2A66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" color="#fff" size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C' }}>{r.nameAr}</div>
                            <div style={{ fontSize: 11, color: '#7B8BA5', direction: 'ltr', textAlign: 'right' }}>{r.code}</div>
                          </div>
                          <span style={{ marginRight: 'auto', fontSize: 11, fontWeight: 700, color: '#0B2A66', background: '#EEF2F9', padding: '4px 10px', borderRadius: 8 }}>
                            {r.permissions.length} صلاحية
                          </span>
                        </div>
                        <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {r.permissions.map((p) => (
                            <span key={p} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#54627B', background: '#F0F3F8', border: '1px solid #E7ECF4' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ==================== ROLE RULES ==================== */}
              {tab === 'rules' && (
                <div>
                  {/* Add Rule Button */}
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: '#7B8BA5', fontWeight: 600 }}>
                      قواعد تعيين الصلاحيات تلقائياً عند أول تسجيل دخول للمستخدم
                    </p>
                    <button onClick={() => setShowAddRule(!showAddRule)} style={smallBtn('#0B2A66', '#fff')}>
                      {showAddRule ? 'إلغاء' : '+ إضافة قاعدة'}
                    </button>
                  </div>

                  {/* Add Rule Form */}
                  {showAddRule && (
                    <div style={{ padding: 18, borderRadius: 14, border: '1px solid #E7ECF4', background: '#F7F9FD', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#54627B', display: 'block', marginBottom: 4 }}>البريد الإلكتروني *</label>
                          <input value={newRuleEmail} onChange={(e) => setNewRuleEmail(e.target.value)} placeholder="user@entity.gov.ae" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DCE3EE', fontSize: 13, direction: 'ltr' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#54627B', display: 'block', marginBottom: 4 }}>الاسم</label>
                          <input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="اسم المستخدم" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DCE3EE', fontSize: 13 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#54627B', display: 'block', marginBottom: 4 }}>الدور *</label>
                          <select value={newRuleRole} onChange={(e) => setNewRuleRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DCE3EE', fontSize: 13, background: '#fff' }}>
                            <option value="entity_admin">مسؤول الجهة</option>
                            <option value="entity_coordinator">منسق المسار في الجهة</option>
                            <option value="entity_representative">ممثل الجهة</option>
                            <option value="stream_owner">فريق عمل المسار في المشروع</option>
                            <option value="ai_committee">اللجنة الوطنية</option>
                            <option value="program_admin">مدير البرنامج</option>
                            <option value="system_admin">مدير النظام</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#54627B', display: 'block', marginBottom: 4 }}>الجهة</label>
                          <select value={newRuleEntity} onChange={(e) => setNewRuleEntity(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DCE3EE', fontSize: 13, background: '#fff' }}>
                            <option value="">كل الجهات</option>
                            {entities.map((e) => <option key={e.id} value={e.id}>{e.nameAr}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#54627B', display: 'block', marginBottom: 4 }}>المسار</label>
                          <select value={newRuleStream} onChange={(e) => setNewRuleStream(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #DCE3EE', fontSize: 13, background: '#fff' }}>
                            <option value="">كل المسارات</option>
                            {streams.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
                          </select>
                        </div>
                      </div>
                      <button onClick={addRule} disabled={addingRule} style={{ ...smallBtn('#16A34A', '#fff'), alignSelf: 'flex-start', opacity: addingRule ? 0.6 : 1 }}>
                        {addingRule ? 'جاري الحفظ...' : 'حفظ القاعدة'}
                      </button>
                    </div>
                  )}

                  {/* Rules Table */}
                  {filteredRules.length === 0 ? <EmptyState text="لا توجد قواعد صلاحيات" /> : (
                    <div style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={th}>البريد الإلكتروني</th>
                            <th style={th}>الاسم</th>
                            <th style={th}>الدور</th>
                            <th style={th}>الجهة</th>
                            <th style={th}>المسار</th>
                            <th style={th}>الحالة</th>
                            <th style={th}>تاريخ الإنشاء</th>
                            <th style={th}>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRules.map((r) => (
                            <tr key={r.id} onMouseEnter={(ev) => (ev.currentTarget.style.background = '#FAFBFE')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                              <td style={{ ...td, direction: 'ltr', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{r.email}</td>
                              <td style={td}>{r.displayName || '—'}</td>
                              <td style={td}><span style={{ ...badge('#0B2A66'), fontSize: 11 }}>{roleLabel[r.roleCode] || r.roleCode}</span></td>
                              <td style={{ ...td, fontSize: 12 }}>{r.entityName || 'كل الجهات'}</td>
                              <td style={{ ...td, fontSize: 12 }}>{r.streamName || 'كل المسارات'}</td>
                              <td style={td}>
                                {r.isConsumed
                                  ? <span style={badge('#16A34A')}>مفعّل</span>
                                  : <span style={badge('#D97706')}>بانتظار الدخول</span>
                                }
                              </td>
                              <td style={{ ...td, fontSize: 12, color: '#7B8BA5', whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                              <td style={td}>
                                <button onClick={() => deleteRule(r.id)} style={smallBtn('#FEE2E2', '#DC2626')} title="حذف">
                                  <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== AUDIT LOGS ==================== */}
              {tab === 'audit' && (
                filteredAudit.length === 0 ? <EmptyState text="لا توجد سجلات" /> : (
                  <div style={{ borderRadius: 14, border: '1px solid #E7ECF4', overflow: 'hidden' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={th}>التاريخ</th>
                          <th style={th}>الإجراء</th>
                          <th style={th}>نوع المورد</th>
                          <th style={th}>معرّف المورد</th>
                          <th style={th}>المستخدم</th>
                          <th style={th}>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudit.map((a) => (
                          <tr key={a.id} onMouseEnter={(ev) => (ev.currentTarget.style.background = '#FAFBFE')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                            <td style={{ ...td, fontSize: 12, color: '#7B8BA5', whiteSpace: 'nowrap' }}>{formatDate(a.createdAt)}</td>
                            <td style={td}>
                              <span style={{ ...badge('#0B2A66'), fontSize: 11 }}>{actionLabel[a.action] || a.action}</span>
                            </td>
                            <td style={{ ...td, fontSize: 12 }}>{a.resourceType || '—'}</td>
                            <td style={{ ...td, fontSize: 11, color: '#7B8BA5', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{a.resourceId ? a.resourceId.slice(0, 12) + '…' : '—'}</td>
                            <td style={{ ...td, fontSize: 11, color: '#7B8BA5', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{a.actorUserId ? a.actorUserId.slice(0, 12) + '…' : '—'}</td>
                            <td style={{ ...td, fontSize: 12, direction: 'ltr', textAlign: 'right', color: '#7B8BA5' }}>{a.ipAddress || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Role assignment modal */}
      {editUser && (
        <RoleModal
          user={editUser}
          roles={roles}
          entities={entities}
          streams={streams}
          onClose={() => setEditUser(null)}
          onSave={() => loadTab('users')}
        />
      )}

      {/* Add-user modal */}
      {addUserOpen && (
        <AddUserModal
          roles={roles}
          entities={entities}
          streams={streams}
          onClose={() => setAddUserOpen(false)}
          onCreated={() => loadTab('users')}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
