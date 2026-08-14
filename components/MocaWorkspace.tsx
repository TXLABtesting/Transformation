// ============================================================================
// واجهة نسخة وزارة شؤون مجلس الوزراء
// تتبع لغة تصميم المنصة نفسها (الشريط الجانبي، الترويسة، البطاقات، لوحة
// الإضافة الجانبية) دون أي مساس بملفات منصة الجهات الاتحادية.
// ============================================================================
'use client';
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@/components/Icon';
import {
  MOCA_FIELDS,
  MOCA_GROUPS,
  MOCA_UNITS,
  MOCA_ROLES,
  MOCA_MINISTRY,
  MOCA_TRANSFORMABILITY,
  MOCA_BAND_STYLE,
  mocaUnitById,
  mocaScopeLabel,
  mocaStatusOf,
  mocaMissing,
  mocaPriorityScore,
  blockedByTransformability,
  type MocaEntry,
  type MocaField,
} from '@/lib/moca';
import { useMoca, mocaVisibleEntries, mocaApplyReturn } from '@/lib/mocaStore';
import { mocaDownloadTemplate, mocaParseWorkbook } from '@/lib/mocaExcel';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const RAIL = 248;

// ---- لغة التصميم نفسها المستخدمة في المنصة --------------------------------
const PANEL: CSSProperties = {
  background: '#fff',
  border: '1px solid #E7ECF4',
  boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
  borderRadius: 18,
};
const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #DCE3EE',
  backgroundColor: '#fff',
  borderRadius: 11,
  padding: '11px 13px',
  fontSize: 13.5,
  outline: 'none',
  fontFamily: 'inherit',
  color: '#13213C',
};
const INVALID_STYLE: CSSProperties = {
  borderColor: '#D23B45',
  backgroundColor: '#FFF8F8',
  boxShadow: '0 0 0 3px rgba(210,59,69,.12)',
};
const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 400,
  color: '#54627B',
  marginBottom: 6,
};
const cardStyle: CSSProperties = {
  background: '#FAFBFE',
  border: '1px solid #E7ECF4',
  borderRadius: 16,
  padding: 18,
  marginBottom: 14,
};
const th: CSSProperties = {
  textAlign: 'right',
  padding: '10px 9px',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#8A97AD',
  borderBottom: '1px solid #EEF1F7',
  whiteSpace: 'nowrap',
};
const td: CSSProperties = { padding: '11px 9px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA' };
const BTN_PRIMARY: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 18px',
  background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
  color: '#fff',
  border: 'none',
  borderRadius: 11,
  fontWeight: 800,
  fontSize: 13.5,
  cursor: 'pointer',
  boxShadow: '0 2px 6px -2px rgba(37,99,235,.35)',
  fontFamily: 'inherit',
};
const BTN_GREEN: CSSProperties = {
  ...BTN_PRIMARY,
  background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
  boxShadow: '0 2px 6px -2px rgba(11,138,75,.4)',
};
const BTN_NEUTRAL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 16px',
  background: '#fff',
  color: '#33405A',
  border: '1px solid #E7ECF4',
  borderRadius: 11,
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const BTN_DANGER: CSSProperties = {
  ...BTN_NEUTRAL,
  background: '#FDF6F6',
  color: '#C0303B',
  border: '1px solid #F3D4D7',
};
const IC = {
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 15V3M7 8l5-5 5 5M5 21h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  check: 'M20 6L9 17l-5-5',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  download: 'M12 3v12M8 11l4 4 4-4M5 21h14',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  building: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01',
  rotate: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  close: 'M18 6 6 18M6 6l12 12',
};

// زر إجراء مضغوط بأيقونة — يبقي عمود الإجراء ضمن عرض الجدول
const IconBtn = ({
  d,
  title,
  color,
  bg,
  border,
  onClick,
}: {
  d: string;
  title: string;
  color: string;
  bg: string;
  border: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    style={{
      width: 32,
      height: 32,
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: bg,
      border: '1px solid ' + border,
      borderRadius: 9,
      cursor: 'pointer',
      fontFamily: 'inherit',
      padding: 0,
    }}
  >
    <Icon d={d} size={14} color={color} />
  </button>
);

const Chip = ({ t, c, bg }: { t: string; c: string; bg: string }) => (
  <span style={{ fontSize: 11, fontWeight: 800, color: c, background: bg, borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap' }}>
    {t}
  </span>
);

// ============================================================================
export function MocaWorkspace() {
  const s = useMoca();
  const list = useMemo(() => mocaVisibleEntries(s), [s]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#F7F9FD,#EEF2F9)',
        direction: 'rtl',
        overflowX: 'hidden',
        paddingRight: RAIL,
      }}
    >
      <Header />
      <div style={{ display: 'flex', gap: 16, padding: '16px 24px 44px', alignItems: 'flex-start' }}>
        <Rail list={list} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Kpis list={list} />
          <Filters />
          <EntriesTable list={list} />
          {s.view === 'form' && <InlineFormSection />}
        </div>
      </div>

      {s.view === 'bulk' && <SidePanel />}
      {s.detailId && <DetailDrawer id={s.detailId} />}
      {s.returnTarget && <ReturnDialog />}
      {s.confirm && <ConfirmDialog />}
      {s.toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 130,
            background: '#0F1F3D',
            color: '#fff',
            padding: '13px 22px',
            borderRadius: 13,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 18px 40px -16px rgba(2,12,35,.6)',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {s.toast}
        </div>
      )}
    </div>
  );
}

// ---- الترويسة ---------------------------------------------------------------
function Header() {
  const s = useMoca();
  const unit = mocaUnitById(s.unitId);
  const role = MOCA_ROLES.find((r) => r.key === s.role)!;
  const [prof, setProf] = useState(false);
  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #E7ECF4',
        padding: '11px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* مبدّل الدور — نسخة العرض فقط */}
        <div
          style={{
            display: 'flex',
            background: '#F4F7FC',
            border: '1px solid #E7ECF4',
            boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
            borderRadius: 12,
            padding: 3,
            gap: 2,
          }}
        >
          {MOCA_ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => s.setRole(r.key)}
              style={{
                borderRadius: 9,
                padding: '8px 13px',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                ...(s.role === r.key
                  ? { background: '#fff', color: '#1D4ED8', boxShadow: '0 1px 4px rgba(15,31,61,.10)', border: '1px solid #D8E3F5' }
                  : { background: 'transparent', color: '#54627B', border: '1px solid transparent' }),
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* نطاق المنسق: الجهة ثم القطاع — بنفس شكل مبدّل المسار في المنصة */}
        {s.role === 'coord' && (
          <>
            <Select value={s.unitId} onChange={(v) => s.setScope(v, '')} minWidth={210} options={MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))} />
            {!!unit.sectors?.length && (
              <Select value={s.unitSector} onChange={(v) => s.setScope(s.unitId, v)} minWidth={200} options={unit.sectors.map((x) => ({ v: x, label: x }))} />
            )}
          </>
        )}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setProf((o) => !o)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon d={IC.user} size={18} color="#fff" strokeWidth={2.2} />
          </div>
          {prof && (
            <div
              style={{
                position: 'absolute',
                top: 46,
                left: 0,
                width: 260,
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 14,
                boxShadow: '0 24px 60px -20px rgba(2,12,35,.45)',
                zIndex: 40,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon d={IC.user} size={18} color="#fff" strokeWidth={2.2} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C' }}>{role.label}</div>
                  <div style={{ fontSize: 11, color: '#9AA6BC', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.role === 'coord' ? mocaScopeLabel(s.unitId, s.unitSector) : MOCA_MINISTRY}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  minWidth = 170,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
  minWidth?: number;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 40,
        minWidth,
        maxWidth: 260,
        border: '1px solid #E7ECF4',
        backgroundColor: '#fff',
        borderRadius: 11,
        padding: '0 12px',
        fontSize: 12.5,
        fontWeight: 700,
        color: '#33405A',
        cursor: 'pointer',
        fontFamily: 'inherit',
        outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.label}</option>
      ))}
    </select>
  );
}

// ---- الشريط الجانبي ---------------------------------------------------------
function Rail({ list }: { list: MocaEntry[] }) {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const item = (label: string, icon: string, active: boolean, count?: number, onClick?: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 13px',
        borderRadius: 11,
        border: 'none',
        background: active ? '#EAF1FE' : 'transparent',
        color: active ? '#1D4ED8' : '#42506B',
        fontWeight: active ? 800 : 400,
        fontSize: 13,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit',
        textAlign: 'right',
      }}
    >
      {active && (
        <span style={{ position: 'absolute', right: -12, top: 9, bottom: 9, width: 3.5, borderRadius: 999, background: '#2563EB' }} />
      )}
      <Icon d={icon} size={16} color={active ? '#2563EB' : '#8A97AD'} />
      {label}
      {typeof count === 'number' && (
        <span
          style={{
            marginInlineStart: 'auto',
            minWidth: 22,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: active ? '#1D4ED8' : '#8A97AD',
            background: active ? '#DCE8FE' : '#F1F4F9',
            borderRadius: 999,
            padding: '1px 7px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
  return (
    <aside
      style={{
        width: RAIL,
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        zIndex: 30,
        background: '#fff',
        borderLeft: '1px solid #E7ECF4',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '14px 14px 12px',
          borderBottom: '1px solid #F0F3F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BASE + '/assets/logo.png'} alt="logo" style={{ height: 46, minWidth: 0, objectFit: 'contain' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '14px 13px 2px', fontSize: 11.5, fontWeight: 800, color: '#8A97AD' }}>قوائم الحصر</div>
        {item('حصر المهام والعمليات', IC.list, true, list.length)}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #F0F3F8' }}>
        <div style={{ fontSize: 10.5, color: '#93A1B8', fontWeight: 700, textAlign: 'center', lineHeight: 1.8 }}>
          {MOCA_MINISTRY}
        </div>
      </div>
    </aside>
  );
}

// ---- المؤشرات --------------------------------------------------------------
function Kpis({ list }: { list: MocaEntry[] }) {
  const n = (f: (e: MocaEntry) => boolean) => list.filter(f).length;
  const tiles = [
    { v: list.length, t: 'إجمالي المهام والعمليات الفرعية' },
    { v: n((e) => String(e.transformability || '').startsWith('قابل')), t: 'القابلة للتحول' },
    { v: n((e) => String(e.priority || '') === 'نعم'), t: 'ذات أولوية للتحول' },
    { v: n((e) => e.wf === 'pending'), t: 'قيد اعتماد اللجنة الوطنية' },
    { v: n((e) => e.wf === 'approved'), t: 'معتمدة' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
      {tiles.map((t) => (
        <div key={t.t} style={{ ...PANEL, padding: '16px 18px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#13213C' }}>{t.v}</div>
          <div style={{ fontSize: 11.5, color: '#7C8AA3', fontWeight: 700, marginTop: 2, lineHeight: 1.6 }}>{t.t}</div>
        </div>
      ))}
    </div>
  );
}

// ---- اختيار المعايير --------------------------------------------------------
function Filters() {
  const s = useMoca();
  return (
    <div style={{ ...PANEL, padding: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#33415C', marginInlineEnd: 4 }}>اختيار المعايير</div>
      <input
        value={s.search}
        onChange={(e) => s.setFilter('search', e.target.value)}
        placeholder="البحث في المهام والعمليات…"
        style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: 200, height: 40, padding: '0 13px', fontSize: 12.5 }}
      />
      {s.role === 'committee' && (
        <Select
          value={s.fUnit}
          onChange={(v) => s.setFilter('fUnit', v)}
          minWidth={200}
          options={[{ v: 'all', label: 'الجهة أو المكتب: الكل' }, ...MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))]}
        />
      )}
      <Select
        value={s.fTransform}
        onChange={(v) => s.setFilter('fTransform', v)}
        minWidth={190}
        options={[{ v: 'all', label: 'القابلية للتحول: الكل' }, ...MOCA_TRANSFORMABILITY.map((o) => ({ v: o, label: o }))]}
      />
      <Select
        value={s.fStatus}
        onChange={(v) => s.setFilter('fStatus', v)}
        minWidth={200}
        options={[
          { v: 'all', label: 'معيار الحالة: الكل' },
          { v: 'draft', label: 'مسودة' },
          { v: 'pending', label: 'قيد اعتماد اللجنة الوطنية' },
          { v: 'approved', label: 'معتمد' },
          { v: 'info', label: 'للتعديل' },
          { v: 'rejected', label: 'تم الرفض' },
        ]}
      />
    </div>
  );
}

// ---- جدول المدخلات ----------------------------------------------------------
function EntriesTable({ list }: { list: MocaEntry[] }) {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const draftIds = list.filter((e) => e.wf === 'draft').map((e) => e.id);

  return (
    <div style={PANEL}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF1F7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="hd" style={{ fontWeight: 800, fontSize: 15, color: '#13213C', flex: 1, minWidth: 180 }}>
          {isCoord ? 'مهام وعمليات ' + mocaScopeLabel(s.unitId, s.unitSector) : 'المدخلات الواردة من جهات الوزارة'}
        </div>
        {isCoord && (
          <>
            {sel.length > 0 && (
              <button onClick={() => { s.submitMany(sel); setSel([]); }} style={BTN_PRIMARY}>
                إرسال المحدد ({sel.length})
              </button>
            )}
            {draftIds.length > 0 && (
              <button
                onClick={() => { s.submitMany(draftIds); setSel([]); }}
                style={sel.length ? { ...BTN_NEUTRAL, background: '#EAF1FE', color: '#1D4ED8', border: '1px solid #C9DBFB' } : BTN_PRIMARY}
              >
                إرسال الكل ({draftIds.length})
              </button>
            )}
            <button onClick={() => s.openBulk()} style={BTN_GREEN}>
              <Icon d={IC.upload} size={16} strokeWidth={2.2} color="#fff" /> رفع ملف Excel
            </button>
            <button onClick={() => s.openForm()} style={BTN_PRIMARY}>
              <Icon d={IC.plus} size={17} strokeWidth={2.2} color="#fff" /> إضافة المدخلات
            </button>
          </>
        )}
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '52px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#54627B', marginBottom: 6 }}>لا توجد نتائج للعرض</div>
          <div style={{ fontSize: 12, color: '#9AA6BC' }}>
            {isCoord ? 'يمكنكم البدء بالإضافة من زر «إضافة المدخلات» أو عبر رفع نموذج الحصر.' : 'لا توجد مدخلات مرسلة للاعتماد بعد.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                {isCoord && <th style={{ ...th, width: 34 }} />}
                <th style={th}>العملية والمهمة الرئيسية</th>
                <th style={th}>العملية والمهمة الفرعية</th>
                {!isCoord && <th style={th}>الجهة أو المكتب</th>}
                <th style={th}>التصنيف</th>
                <th style={th}>القابلية للتحول</th>
                <th style={th}>أولوية التحول</th>
                <th style={th}>الحالة</th>
                <th style={th}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const st = mocaStatusOf(e);
                const pr = mocaPriorityScore(e);
                const band = pr ? MOCA_BAND_STYLE[pr.band] : null;
                return (
                  <tr key={e.id}>
                    {isCoord && (
                      <td style={{ ...td, width: 34 }}>
                        {e.wf === 'draft' && (
                          <input
                            type="checkbox"
                            checked={sel.includes(e.id)}
                            onChange={() => toggle(e.id)}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563EB' }}
                          />
                        )}
                      </td>
                    )}
                    <td
                      style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 175, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      title={String(e.mainProcess || '')}
                      onClick={() => s.openDetail(e.id)}
                    >
                      {String(e.mainProcess || '—')}
                    </td>
                    <td
                      style={{ ...td, maxWidth: 185, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      title={String(e.subProcess || '')}
                      onClick={() => s.openDetail(e.id)}
                    >
                      {String(e.subProcess || '—')}
                    </td>
                    {!isCoord && <td style={td}>{mocaScopeLabel(e.unitId, e.unitSector)}</td>}
                    <td style={td}>{String(e.specialization || '—')}</td>
                    <td style={td}>{String(e.transformability || '—')}</td>
                    <td style={td}>{band && pr ? <Chip t={pr.band} c={band.color} bg={band.bg} /> : '—'}</td>
                    <td style={td}><Chip t={st.label} c={st.color} bg={st.bg} /></td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => s.openDetail(e.id)}
                          style={{ background: '#EAF0FE', color: '#2563EB', border: 'none', borderRadius: 9, padding: '7px 14px', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          عرض التفاصيل
                        </button>
                        {isCoord && e.wf !== 'approved' && (
                          <>
                            <IconBtn d={IC.pencil} title="تعديل المدخل" color="#54627B" bg="#fff" border="#E7ECF4" onClick={() => s.openForm(e.id)} />
                            {e.wf === 'draft' && (
                              <IconBtn d={IC.send} title="إرسال لاعتماد اللجنة الوطنية" color="#1D4ED8" bg="#EAF1FE" border="#C9DBFB" onClick={() => s.submitEntry(e.id)} />
                            )}
                            <IconBtn d={IC.trash} title="إزالة المدخل" color="#C0303B" bg="#FDF6F6" border="#F3D4D7" onClick={() => s.removeEntry(e.id)} />
                          </>
                        )}
                        {!isCoord && e.wf === 'pending' && (
                          <>
                            <button onClick={() => s.approveEntry(e.id)} style={{ background: 'linear-gradient(180deg,#0EA371,#0B8A4B)', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 14px', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>اعتماد</button>
                            <IconBtn d={IC.rotate} title="إعادة للتعديل" color="#B45309" bg="#FFF3DE" border="#F1DCBA" onClick={() => s.openReturn(e.id, 'info')} />
                            <IconBtn d={IC.close} title="رفض المدخل" color="#C0303B" bg="#FDF6F6" border="#F3D4D7" onClick={() => s.openReturn(e.id, 'reject')} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- قسم الإضافة أسفل الجدول — تنزلق الشاشة إليه عند الإضافة أو التعديل ----
function InlineFormSection() {
  const s = useMoca();
  const secRef = useRef<HTMLDivElement>(null);
  // عند فتح النموذج (إضافة أو تعديل) تنزلق الشاشة إلى القسم تلقائياً
  useEffect(() => {
    const t = setTimeout(() => secRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [s.editingId]);
  return (
    <div ref={secRef} style={{ ...PANEL, scrollMarginTop: 76 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', borderBottom: '1px solid #EEF1F7' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon d={s.editingId ? IC.pencil : IC.plus} size={19} color="#fff" />
        </div>
        <div className="hd" style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#13213C' }}>
          {s.editingId ? 'تعديل المدخل' : 'إضافة المدخلات'}
        </div>
        <button
          onClick={() => s.closeForm()}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: 22 }}>
        <FormStep />
      </div>
    </div>
  );
}

// ---- اللوحة الجانبية: رفع الملف --------------------------------------------
function SidePanel() {
  const s = useMoca();
  const close = () => s.closeBulk();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, direction: 'rtl' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 640,
          maxWidth: '96vw',
          background: '#F7F9FD',
          boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
          animation: 'slideInRight .3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', background: '#fff', borderBottom: '1px solid #E7ECF4' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <Icon d={IC.upload} size={20} color="#fff" />
          </div>
          <div className="hd" style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#13213C' }}>
            رفع نموذج حصر المهام والعمليات
          </div>
          <button
            onClick={close}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}><BulkStep /></div>
      </div>
    </div>
  );
}

// ---- نموذج الإدخال ----------------------------------------------------------
function FormStep() {
  const s = useMoca();
  const d = s.draft;
  const hi = s.reqHighlight > 0;
  const missing = mocaMissing(d);
  const firstBad = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hi) firstBad.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [s.reqHighlight, hi]);

  let badSeen = false;
  const fieldNode = (f: MocaField) => {
    const blocked = blockedByTransformability(f.key, d);
    const v = String(d[f.key] ?? '');
    const bad = hi && !blocked && !!f.required && !v.trim();
    const st: CSSProperties = {
      ...inputStyle,
      ...(bad ? INVALID_STYLE : {}),
      ...(blocked ? { backgroundColor: '#F1F4F9', cursor: 'not-allowed', color: '#8A97AD' } : {}),
    };
    if (blocked) return <input value="غير مطلوب — العملية غير قابلة للتحول" disabled style={st} />;
    if (f.type === 'select')
      return (
        <select value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={{ ...st, cursor: 'pointer' }}>
          <option value="">اختر…</option>
          {(f.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    if (f.type === 'longtext')
      return <textarea value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={{ ...st, minHeight: 88, resize: 'vertical' }} />;
    if (f.type === 'percent')
      return (
        <input
          value={v}
          onChange={(e) => s.setDraft(f.key, e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
          placeholder="0 – 100"
          inputMode="decimal"
          style={st}
        />
      );
    return <input value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={st} />;
  };

  return (
    <div>
      {MOCA_GROUPS.map((g) => (
        <div key={g.key} style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 16, borderRadius: 999, background: '#2563EB' }} />
            {g.label}
          </div>
          {MOCA_FIELDS.filter((f) => f.group === g.key).map((f) => {
            const blocked = blockedByTransformability(f.key, d);
            const bad = hi && !blocked && !!f.required && !String(d[f.key] ?? '').trim();
            const isFirstBad = bad && !badSeen;
            if (isFirstBad) badSeen = true;
            return (
              <div key={f.key} ref={isFirstBad ? firstBad : undefined} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  {f.label} {f.required && <span style={{ color: '#D23B45' }}>*</span>}
                </label>
                {fieldNode(f)}
                {blocked && <div style={{ fontSize: 11.5, color: '#8E9AB0', marginTop: 5 }}>يُحتسب صفراً في أولوية التحول</div>}
                {!blocked && f.hint && <div style={{ fontSize: 11.5, color: '#8E9AB0', marginTop: 5 }}>{f.hint}</div>}
                {bad && <div style={{ fontSize: 11.5, color: '#D23B45', fontWeight: 700, marginTop: 5 }}>هذا الحقل مطلوب</div>}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
        <span style={{ flex: 1, minWidth: 150, fontSize: 12, color: missing.length ? '#B45309' : '#0B8A4B', fontWeight: 700 }}>
          {missing.length ? missing.length + ' حقل مطلوب غير مكتمل' : 'جميع الحقول المطلوبة مكتملة'}
        </span>
        <button onClick={() => s.saveDraft(false)} style={BTN_NEUTRAL}>حفظ كمسودة</button>
        <button onClick={() => s.saveDraft(true)} style={BTN_PRIMARY}>
          <Icon d={IC.send} size={15} color="#fff" /> إرسال لاعتماد اللجنة الوطنية
        </button>
      </div>
    </div>
  );
}

// ---- الرفع بالجملة ----------------------------------------------------------
function BulkStep() {
  const s = useMoca();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const ready = s.bulkRows.filter((r) => !r.missing.length).length;
  const short = s.bulkRows.length - ready;

  const tile = (count: number, txt: string, color: string, bg: string) => (
    <div style={{ flex: 1, background: bg, borderRadius: 14, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color, marginTop: 2 }}>{txt}</div>
    </div>
  );

  return (
    <div>
      <div style={{ background: '#EEF4FF', border: '1px solid #D7E4FB', color: '#28518F', borderRadius: 12, padding: '12px 15px', fontSize: 12, lineHeight: 1.9, marginBottom: 16 }}>
        حمّل النموذج، وأكمل البيانات المطلوبة، ثم ارفع الملف. تُحفظ جميع الصفوف كمسودات — والصفوف الناقصة تُميَّز
        لاستكمالها قبل الإرسال لاعتماد اللجنة الوطنية.
      </div>

      <label
        onClick={() => fileRef.current?.click()}
        style={{
          display: 'block',
          border: '2px dashed #C7D6EE',
          background: '#fff',
          borderRadius: 16,
          padding: '30px 18px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            margin: '0 auto 12px',
            borderRadius: 13,
            background: '#EAF1FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon d={IC.upload} size={22} color="#2563EB" strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1F2D49', marginBottom: 6 }}>
          {busy ? 'جارٍ قراءة الملف…' : 'اضغط لاختيار الملف'}
        </div>
        <div style={{ fontSize: 11.5, color: '#9AA6BC', lineHeight: 1.7 }}>
          ملف Excel بصيغة .xlsx — نموذج حصر المهام والعمليات
        </div>
      </label>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          e.target.value = '';
          setBusy(true);
          try {
            const { rows, error } = await mocaParseWorkbook(await f.arrayBuffer());
            s.setBulkRows(rows, error);
          } catch {
            s.setBulkRows([], 'تعذّرت قراءة الملف — تأكد أنه بصيغة xlsx.');
          }
          setBusy(false);
        }}
      />

      <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        ليس لديك النموذج؟
        <button
          onClick={() => mocaDownloadTemplate(mocaScopeLabel(s.unitId, s.unitSector))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563EB', fontWeight: 800, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
        >
          <Icon d={IC.download} size={15} color="#2563EB" /> تنزيل النموذج (Excel)
        </button>
      </div>

      {s.bulkError && (
        <div style={{ background: '#FCEEEF', border: '1px solid #F3D4D7', color: '#C0303B', borderRadius: 12, padding: '12px 15px', fontSize: 12.5, fontWeight: 700 }}>
          {s.bulkError}
        </div>
      )}

      {s.bulkLoaded && !s.bulkError && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {tile(ready, 'جاهز', '#0B8A4B', '#E3F6EC')}
            {tile(short, 'بيانات ناقصة', '#B45309', '#FFF3DE')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {s.bulkRows.map((r, i) => (
              <div key={i} style={{ ...cardStyle, marginBottom: 0, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800, color: '#13213C', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(r.data.subProcess || r.data.mainProcess || 'صف ' + (i + 1))}
                </span>
                {r.missing.length ? (
                  <span style={{ fontSize: 11, color: '#B45309', fontWeight: 800 }} title={r.missing.join('، ')}>
                    بيانات ناقصة: {r.missing.slice(0, 2).join('، ')}{r.missing.length > 2 ? '…' : ''}
                  </span>
                ) : (
                  <Chip t="جاهز" c="#0B8A4B" bg="#E3F6EC" />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => s.saveBulk()} style={BTN_PRIMARY}>
            <Icon d={IC.check} size={16} color="#fff" /> الحفظ
          </button>
        </>
      )}
    </div>
  );
}

// ---- التفاصيل ---------------------------------------------------------------
function DetailDrawer({ id }: { id: string }) {
  const s = useMoca();
  const e = s.entries.find((x) => x.id === id);
  if (!e) return null;
  const st = mocaStatusOf(e);
  const pr = mocaPriorityScore(e);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl' }}>
      <div onClick={() => s.openDetail(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 680,
          maxWidth: '96vw',
          background: '#F7F9FD',
          boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
          animation: 'slideInRight .3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ background: '#fff', borderBottom: '1px solid #E7ECF4', padding: '15px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hd" style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>{String(e.subProcess || e.mainProcess || '—')}</div>
            <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 3 }}>{mocaScopeLabel(e.unitId, e.unitSector)}</div>
          </div>
          <Chip t={st.label} c={st.color} bg={st.bg} />
          <button
            onClick={() => s.openDetail(null)}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', flex: 'none' }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {e.ret && (
            <div
              style={{
                background: e.ret.type === 'reject' ? '#FDECEE' : '#FFF3DE',
                border: '1px solid ' + (e.ret.type === 'reject' ? '#F3D4D7' : '#F1DCBA'),
                borderRadius: 14,
                padding: '13px 16px',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: e.ret.type === 'reject' ? '#C0303B' : '#B45309', marginBottom: 5 }}>
                {e.ret.type === 'reject' ? 'سبب الرفض من اللجنة الوطنية' : 'ملاحظات اللجنة الوطنية'}
              </div>
              <div style={{ fontSize: 12.5, color: '#33415C', lineHeight: 1.8 }}>{e.ret.note || '—'}</div>
            </div>
          )}
          {pr && (
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#33415C', flex: 1 }}>أولوية التحول المحسوبة</span>
              <Chip t={pr.band} c={MOCA_BAND_STYLE[pr.band].color} bg={MOCA_BAND_STYLE[pr.band].bg} />
            </div>
          )}
          {MOCA_GROUPS.map((g) => (
            <div key={g.key} style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 16, borderRadius: 999, background: '#2563EB' }} />
                {g.label}
              </div>
              {MOCA_FIELDS.filter((f) => f.group === g.key).map((f) => (
                <div key={f.key} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #EFF2F7' }}>
                  <span style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 400, width: 230, flex: 'none', lineHeight: 1.7 }}>{f.label}</span>
                  <span style={{ fontSize: 12.5, color: '#13213C', fontWeight: 700, lineHeight: 1.7 }}>
                    {blockedByTransformability(f.key, e) ? '— (غير قابل للتحول)' : String(e[f.key] || '—')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {((s.role === 'committee' && e.wf === 'pending') || (s.role === 'coord' && e.wf !== 'approved')) && (
          <div style={{ background: '#fff', borderTop: '1px solid #E7ECF4', padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.role === 'committee' ? (
              <>
                <button onClick={() => s.approveEntry(e.id)} style={{ ...BTN_PRIMARY, flex: 1, height: 46, justifyContent: 'center', background: '#0B8A4B' }}>اعتماد</button>
                <button onClick={() => s.openReturn(e.id, 'info')} style={{ ...BTN_NEUTRAL, height: 46, background: '#FFF3DE', color: '#B45309', border: '1px solid #F1DCBA' }}>إعادة للتعديل</button>
                <button onClick={() => s.openReturn(e.id, 'reject')} style={{ ...BTN_DANGER, height: 46 }}>رفض</button>
              </>
            ) : (
              <>
                <button onClick={() => s.openForm(e.id)} style={{ ...BTN_PRIMARY, flex: 1, height: 46, justifyContent: 'center' }}>
                  <Icon d={IC.pencil} size={16} color="#fff" /> تعديل المدخل
                </button>
                {e.wf === 'draft' && <button onClick={() => s.submitEntry(e.id)} style={{ ...BTN_NEUTRAL, height: 46 }}>إرسال للاعتماد</button>}
                <button onClick={() => s.removeEntry(e.id)} style={{ ...BTN_DANGER, height: 46 }}>
                  <Icon d={IC.trash} size={15} color="#C0303B" /> إزالة
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- نافذة الإعادة/الرفض ----------------------------------------------------
function ReturnDialog() {
  const s = useMoca();
  const t = s.returnTarget!;
  const [note, setNote] = useState('');
  const isReject = t.kind === 'reject';
  return (
    <Modal onClose={() => s.closeReturn()}>
      <div className="hd" style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C', marginBottom: 6 }}>
        {isReject ? 'رفض المدخل' : 'إعادة المدخل للتعديل'}
      </div>
      <div style={{ fontSize: 12.5, color: '#6B7A93', marginBottom: 14, lineHeight: 1.8 }}>
        {isReject ? 'يُذكر سبب الرفض ويظهر للمنسق عند فتح التفاصيل.' : 'وضّح ما ينقص حتى يتمكن المنسق من استكماله.'}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={isReject ? 'سبب الرفض…' : 'الملاحظات المطلوبة…'}
        style={{ ...inputStyle, minHeight: 110, resize: 'vertical', marginBottom: 14 }}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => s.closeReturn()} style={BTN_NEUTRAL}>إلغاء</button>
        <button
          onClick={() => {
            if (!note.trim()) return s.showToast(isReject ? 'يرجى ذكر سبب الرفض' : 'يرجى كتابة الملاحظات');
            mocaApplyReturn(t.id, t.kind, note);
          }}
          style={isReject ? { ...BTN_PRIMARY, background: 'linear-gradient(180deg,#D6454F,#C0303B)' } : BTN_PRIMARY}
        >
          {isReject ? 'تأكيد الرفض' : 'إعادة للتعديل'}
        </button>
      </div>
    </Modal>
  );
}

function ConfirmDialog() {
  const s = useMoca();
  const c = s.confirm!;
  return (
    <Modal onClose={() => s.setConfirm(null)}>
      <div className="hd" style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C', marginBottom: 8 }}>{c.title}</div>
      <div style={{ fontSize: 12.5, color: '#54627B', lineHeight: 1.9, marginBottom: 18 }}>{c.body}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => s.setConfirm(null)} style={BTN_NEUTRAL}>إلغاء</button>
        <button onClick={c.onOk} style={c.danger ? { ...BTN_PRIMARY, background: 'linear-gradient(180deg,#D6454F,#C0303B)' } : BTN_PRIMARY}>
          {c.okLabel}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,18,40,.5)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, boxShadow: '0 30px 80px -30px rgba(2,12,35,.5)', width: 'min(520px,96vw)', padding: 22 }}
      >
        {children}
      </div>
    </div>
  );
}
