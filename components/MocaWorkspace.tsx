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
  MOCA_BATCHES,
  MOCA_UC_STATUSES,
  MOCA_UC_STATUS_STYLE,
  mocaUnitById,
  mocaAutoSector,
  mocaScopeLabel,
  mocaStatusOf,
  mocaMissing,
  mocaPriorityScore,
  mocaPlacementState,
  mocaPlacementLocked,
  mocaPlacementChip,
  blockedByTransformability,
  type MocaEntry,
  type MocaField,
  type MocaUseCase,
} from '@/lib/moca';
import { useMoca, mocaVisibleEntries, mocaVisibleUseCases, mocaApplyReturn, mocaApplyPlaceReturn } from '@/lib/mocaStore';
import { DEFAULT_ENTITY, ROLE_PILLS } from '@/lib/domain';
import { FEDERAL_ENTITIES } from '@/lib/entities';
import { svcCatalogEntities } from '@/lib/svcCatalog';
import { useStore } from '@/lib/store';
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
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
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
          {s.view === 'batches' ? (
            <BatchesView />
          ) : s.view === 'usecases' ? (
            <UseCasesView />
          ) : (
            <>
              <Kpis list={list} />
              <Filters />
              <EntriesTable list={list} />
              {s.view === 'form' && <InlineFormSection />}
            </>
          )}
        </div>
      </div>

      {s.view === 'bulk' && <SidePanel />}
      {s.detailId && <DetailDrawer id={s.detailId} />}
      {s.returnTarget && <ReturnDialog />}
      {s.placeReturnTarget && <PlaceReturnDialog />}
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
  // تسجيل الخروج عبر جلسة المنصة نفسها (النسخة الحية تنهي جلسة الخادم أيضاً)
  const signOut = useStore((st) => st.logout);
  // مبدّل الدور والنطاق للنسخة التجريبية فقط — في النسخة الحية يُشتقان من الجلسة
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
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
        {demo ? (
          /* مبدّل الدور — نسخة العرض فقط */
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
            {/* مبدّل الأدوار الموحّد نفسه: المنسق يبقى في نسخة الوزارة،
                وبقية الأدوار تعود بلوحاتها في المنصة القياسية */}
            {ROLE_PILLS.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  if (r.key === 'coord') { s.setRole('coord'); return; }
                  try {
                    const raw = window.localStorage.getItem('aitp_state');
                    const d = raw ? JSON.parse(raw) : {};
                    d.role = r.key;
                    d.view = 'dashboard';
                    window.localStorage.setItem('aitp_state', JSON.stringify(d));
                  } catch { /* ignore */ }
                  window.location.href = BASE + '/dashboard/';
                }}
                style={{
                  borderRadius: 9,
                  padding: '8px 13px',
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  ...(r.key === 'coord' && s.role === 'coord'
                    ? { background: '#fff', color: '#1D4ED8', boxShadow: '0 1px 4px rgba(15,31,61,.10)', border: '1px solid #D8E3F5' }
                    : { background: 'transparent', color: '#54627B', border: '1px solid transparent' }),
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          /* النسخة الحية: هوية الجهة والدور من الجلسة — بلا أي مبدّل */
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C' }}>{MOCA_MINISTRY}</div>
            <div style={{ fontSize: 11.5, color: '#8E9AB0' }}>{role.label}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* مبدّل الجهات (تجريبي): وزارة شؤون مجلس الوزراء محددة — اختيار جهة
            أخرى يعود بالمنسق إلى لوحة الجهات الاتحادية القياسية */}
        {demo && (
          <select
            value={MOCA_MINISTRY}
            onChange={(e) => {
              const v = e.target.value;
              if (v === MOCA_MINISTRY) return;
              // المخزن الرئيسي غير مُحمَّل في صفحة الوزارة التجريبية — الكتابة
              // عبره هنا كانت ستمسح حالة المستخدم المحفوظة، فنعدّل التخزين مباشرة
              try {
                const raw = window.localStorage.getItem('aitp_state');
                const d = raw ? JSON.parse(raw) : {};
                d.entityName = v;
                d.view = 'dashboard';
                window.localStorage.setItem('aitp_state', JSON.stringify(d));
              } catch { /* ignore */ }
              window.location.href = BASE + '/dashboard/';
            }}
            title="التنقل بين الجهات (تجريبي)"
            style={{ height: 38, maxWidth: 230, border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', background: '#fff', borderRadius: 11, padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#13213C', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {Array.from(new Set([DEFAULT_ENTITY, ...svcCatalogEntities(), ...FEDERAL_ENTITIES].filter(Boolean)))
              .sort((a, b) => a.localeCompare(b, 'ar'))
              .map((en) => (
                <option key={en} value={en}>{en}</option>
              ))}
          </select>
        )}
        {/* نطاق المنسق: الجهة ثم القطاع — تبديل في النسخة التجريبية، وعرض
            ثابت من الجلسة في النسخة الحية */}
        {s.role === 'coord' &&
          (demo ? (
            <>
              <FilterSelect value={s.unitId} onChange={(v) => s.setScope(v, '')} minWidth={190} options={MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))} />
              {!!unit.sectors?.length && (
                <FilterSelect value={s.unitSector} onChange={(v) => s.setScope(s.unitId, v)} minWidth={180} options={unit.sectors.map((x) => ({ v: x, label: x }))} />
              )}
            </>
          ) : (s.myUnits || []).length > 1 ? (
            // أُسندت له أكثر من جهة/قطاع داخل الوزارة — يتنقل بينها من هنا
            <select
              value={s.unitSector ? s.unitId + '::' + s.unitSector : s.unitId}
              onChange={(e) => s.pickUnit(e.target.value)}
              style={{
                background: '#fff',
                border: '1px solid #DCE3EE',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#33415C',
                fontFamily: 'inherit',
                cursor: 'pointer',
                maxWidth: 280,
              }}
            >
              {(s.myUnits || []).map((raw) => {
                const [uid2, sec = ''] = raw.split('::');
                return <option key={raw} value={raw}>{mocaScopeLabel(uid2, sec)}</option>;
              })}
            </select>
          ) : (
            <div
              style={{
                background: '#F4F7FC',
                border: '1px solid #E7ECF4',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#54627B',
              }}
            >
              {mocaScopeLabel(s.unitId, s.unitSector)}
            </div>
          ))}
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
              <button
                onClick={() => {
                  setProf(false);
                  signOut();
                  window.location.href = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/';
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px', background: '#fff', border: 'none', borderTop: '1px solid #EEF1F7', color: '#C0303B', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}
              >
                <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={15} color="#C0303B" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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
        {item('حصر المهام والعمليات', IC.list, s.view !== 'batches' && s.view !== 'usecases', list.length, () => s.closeBatches())}
        <div style={{ padding: '14px 13px 2px', fontSize: 11.5, fontWeight: 800, color: '#8A97AD' }}>المتابعة</div>
        {item(
          'دفعات الإطلاق',
          IC.cal,
          s.view === 'batches',
          s.entries.filter(
            (e) =>
              String(e.execBatch || '').trim() &&
              (isCoord
                ? e.unitId === s.unitId && (!s.unitSector || e.unitSector === s.unitSector)
                : e.batchWf === 'pending' || e.batchWf === 'approved')
          ).length,
          () => s.openBatches()
        )}
        {item('حالات الاستخدام', IC.bulb, s.view === 'usecases', mocaVisibleUseCases(s).length, () => s.openUseCases())}
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

// ---- شريط الفلاتر والبحث — بنفس مكوّن الفلاتر في صفحات الجهات ---------------
const FilterChevron = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, flex: 'none', stroke: '#9AA6BC', fill: 'none', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function FilterSelect({
  value,
  options,
  onChange,
  minWidth = 150,
}: {
  value: string;
  options: { v: string; label: string }[];
  onChange: (v: string) => void;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((o) => o.v === value)?.label || options[0]?.label || '';
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  return (
    <div style={{ position: 'relative', flex: 'none' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', minWidth, height: 40, background: '#fff', border: '1px solid #E4ECF7', borderRadius: 11, padding: '0 13px', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>{label}</span>
        <FilterChevron />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '100%', width: 'max-content', maxWidth: 'min(300px, calc(100vw - 32px))', maxHeight: 320, overflowY: 'auto', background: '#fff', border: '1px solid #E4ECF7', borderRadius: 13, boxShadow: '0 18px 44px -14px rgba(15,31,61,.28)', zIndex: 40 }}>
            {options.map((o) => (
              <div
                key={o.v}
                onClick={() => pick(o.v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', fontSize: 12.5, fontWeight: o.v === value ? 800 : 400, color: o.v === value ? '#1D4ED8' : '#33415C', background: o.v === value ? '#F2F7FF' : '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {o.label}
                {o.v === value && <Icon d="M20 6 9 17l-5-5" size={13} color="#1D4ED8" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Filters() {
  const s = useMoca();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={s.search}
          onChange={(e) => s.setFilter('search', e.target.value)}
          placeholder="البحث باسم المدخل…"
          style={{
            height: 40,
            width: 170,
            border: '1px solid #E7ECF4',
            boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
            backgroundColor: '#fff',
            borderRadius: 11,
            padding: '0 36px 0 13px',
            fontSize: 12.5,
            fontWeight: 400,
            color: '#13213C',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
          <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={15} color="#9AA6BC" />
        </span>
      </div>
      {s.role === 'committee' && (
        <FilterSelect
          value={s.fUnit}
          onChange={(v) => s.setFilter('fUnit', v)}
          minWidth={180}
          options={[{ v: 'all', label: 'الجهة أو المكتب: الكل' }, ...MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))]}
        />
      )}
      <FilterSelect
        value={s.fTransform}
        onChange={(v) => s.setFilter('fTransform', v)}
        minWidth={170}
        options={[{ v: 'all', label: 'القابلية للتحول: الكل' }, ...MOCA_TRANSFORMABILITY.map((o) => ({ v: o, label: o }))]}
      />
      <FilterSelect
        value={s.fStatus}
        onChange={(v) => s.setFilter('fStatus', v)}
        minWidth={150}
        options={[
          { v: 'all', label: 'الحالة' },
          { v: 'draft', label: 'مسودة' },
          { v: 'pending', label: 'قيد اعتماد اللجنة الوطنية' },
          { v: 'approved', label: 'معتمد' },
          { v: 'info', label: 'للتعديل' },
          { v: 'rejected', label: 'تم الرفض' },
        ]}
      />
      <div style={{ flex: 1 }} />
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
    // القطاع المعني يُعبَّأ آلياً من نطاق المستخدم — للعرض فقط
    if (f.key === 'sector')
      return (
        <input
          value={mocaAutoSector(s.unitId, s.unitSector)}
          disabled
          style={{ ...inputStyle, backgroundColor: '#F1F4F9', cursor: 'not-allowed', color: '#54627B', fontWeight: 700 }}
        />
      );
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
    // النِّسب المئوية بشريط تمرير بدل الإدخال النصي
    if (f.type === 'percent') {
      const num = Math.max(0, Math.min(100, Number(String(v).replace(/[^\d.]/g, '')) || 0));
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minHeight: 44,
            border: '1px solid ' + (bad ? '#D23B45' : '#DCE3EE'),
            backgroundColor: bad ? '#FFF8F8' : '#fff',
            borderRadius: 11,
            padding: '0 13px',
          }}
        >
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={num}
            onChange={(e) => s.setDraft(f.key, e.target.value)}
            style={{ flex: 1, accentColor: '#2563EB', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', minWidth: 44, textAlign: 'left' }}>{num}%</span>
        </div>
      );
    }
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

// ---- حالات الاستخدام: متابعة ما تعمل عليه الجهات على مهامها المعتمدة -------
function UseCasesView() {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const [fUnitU, setFUnitU] = useState('all');
  const [fStatusU, setFStatusU] = useState('all');
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const addRef = useRef<HTMLDivElement>(null);

  const all = mocaVisibleUseCases(s);
  const list = all.filter(
    (u) => (isCoord || fUnitU === 'all' || u.unitId === fUnitU) && (fStatusU === 'all' || u.status === fStatusU)
  );
  // المدخلات المعتمدة التي لم تُبنَ عليها حالة استخدام بعد
  const addable = isCoord
    ? s.entries.filter(
        (e) =>
          e.wf === 'approved' &&
          e.unitId === s.unitId &&
          (!s.unitSector || e.unitSector === s.unitSector) &&
          !s.useCases.some((u) => u.entryId === e.id)
      )
    : [];

  useEffect(() => {
    if (adding) setTimeout(() => addRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }, [adding]);

  const lastAt = (u: MocaUseCase) => (u.updates.length ? u.updates[u.updates.length - 1].at.slice(0, 10) : '—');
  const lastVendor = (u: MocaUseCase) => {
    const v = [...u.updates].reverse().find((x) => x.vendor);
    return v ? v.vendor : '—';
  };

  return (
    <div style={PANEL}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF1F7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="hd" style={{ fontWeight: 800, fontSize: 15, color: '#13213C', minWidth: 180 }}>
          {isCoord ? 'حالات الاستخدام — ' + mocaScopeLabel(s.unitId, s.unitSector) : 'حالات الاستخدام في جهات الوزارة'}
        </div>
        <div style={{ flex: 1 }} />
        {isCoord && (
          <button onClick={() => setAdding((o) => !o)} style={BTN_PRIMARY}>
            <Icon d={IC.plus} size={17} strokeWidth={2.2} color="#fff" /> إضافة حالة استخدام
          </button>
        )}
        <FilterSelect
          value={fStatusU}
          onChange={setFStatusU}
          minWidth={150}
          options={[{ v: 'all', label: 'الحالة: الكل' }, ...MOCA_UC_STATUSES.map((x) => ({ v: x, label: x }))]}
        />
        {!isCoord && (
          <FilterSelect
            value={fUnitU}
            onChange={setFUnitU}
            minWidth={180}
            options={[{ v: 'all', label: 'الجهة أو المكتب: الكل' }, ...MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))]}
          />
        )}
      </div>

      {isCoord && adding && (
        <div ref={addRef} style={{ padding: '16px 18px', borderBottom: '1px solid #EEF1F7', background: '#FAFBFE' }}>
          {addable.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#8A97AD', lineHeight: 1.8 }}>
              لا توجد مهام فرعية معتمدة متاحة — تُبنى حالات الاستخدام على المدخلات المعتمدة في حصر المهام والعمليات.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <label style={labelStyle}>العملية والمهمة الفرعية (من المدخلات المعتمدة)</label>
                <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">اختر المهمة الفرعية…</option>
                  {addable.map((e) => (
                    <option key={e.id} value={e.id}>
                      {String(e.subProcess || e.mainProcess || '—')} — {String(e.mainProcess || '')}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (!pick) return s.showToast('يرجى اختيار المهمة الفرعية');
                  s.addUseCase(pick);
                  setPick('');
                  setAdding(false);
                }}
                style={BTN_PRIMARY}
              >
                <Icon d={IC.check} size={16} color="#fff" /> إضافة
              </button>
              <button onClick={() => { setAdding(false); setPick(''); }} style={BTN_NEUTRAL}>إلغاء</button>
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ padding: '52px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#54627B', marginBottom: 6 }}>لا توجد حالات استخدام للعرض</div>
          <div style={{ fontSize: 12, color: '#9AA6BC' }}>
            {isCoord
              ? 'ابدأ بإضافة حالة استخدام على إحدى مهامك الفرعية المعتمدة، ثم سجّل تحديثاتها.'
              : 'ستظهر هنا حالات الاستخدام التي تعمل عليها جهات الوزارة وتحديثاتها.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 34 }} />
                <th style={th}>العملية والمهمة الرئيسية</th>
                <th style={th}>العملية والمهمة الفرعية</th>
                {!isCoord && <th style={th}>الجهة أو المكتب</th>}
                <th style={{ ...th, width: 170 }}>الحالة</th>
                <th style={{ ...th, width: 180 }}>المزود (vendor)</th>
                <th style={{ ...th, width: 130 }}>تاريخ التحديث</th>
                <th style={{ ...th, width: 110 }}>التحديثات</th>
                <th style={{ ...th, width: 120 }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const open = openId === u.id;
                const stl = MOCA_UC_STATUS_STYLE[u.status] || MOCA_UC_STATUS_STYLE['لم تبدأ بعد'];
                const cols = isCoord ? 8 : 9;
                return (
                  <React.Fragment key={u.id}>
                    <tr>
                      <td style={{ ...td, width: 34 }}>
                        <button
                          onClick={() => setOpenId(open ? null : u.id)}
                          title={open ? 'إخفاء التحديثات' : 'عرض التحديثات'}
                          aria-label={open ? 'إخفاء التحديثات' : 'عرض التحديثات'}
                          style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: open ? '#EAF1FE' : '#fff', border: '1px solid ' + (open ? '#C9DBFB' : '#E7ECF4'), borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                        >
                          <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                            <Icon d="M6 9l6 6 6-6" size={13} color={open ? '#1D4ED8' : '#8A97AD'} />
                          </span>
                        </button>
                      </td>
                      <td
                        style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        title={u.mainProcess}
                        onClick={() => setOpenId(open ? null : u.id)}
                      >
                        {u.mainProcess || '—'}
                      </td>
                      <td
                        style={{ ...td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        title={u.subProcess}
                        onClick={() => setOpenId(open ? null : u.id)}
                      >
                        {u.subProcess || '—'}
                      </td>
                      {!isCoord && <td style={td}>{mocaScopeLabel(u.unitId, u.unitSector)}</td>}
                      <td style={td}>
                        {isCoord ? (
                          <select
                            value={u.status}
                            onChange={(e) => s.setUseCaseStatus(u.id, e.target.value)}
                            style={{ ...inputStyle, width: 158, cursor: 'pointer', padding: '7px 10px', fontSize: 12, fontWeight: 700 }}
                          >
                            {MOCA_UC_STATUSES.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <Chip t={u.status} c={stl.color} bg={stl.bg} />
                        )}
                      </td>
                      <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastVendor(u)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{lastAt(u)}</td>
                      <td style={td}>{u.updates.length}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }}>
                          {isCoord && (
                            <>
                              <button
                                onClick={() => setOpenId(u.id)}
                                title="إضافة تحديث جديد"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF1FE', border: '1px solid #C9DBFB', color: '#1D4ED8', borderRadius: 9, padding: '7px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              >
                                <Icon d={IC.plus} size={13} strokeWidth={2.4} color="#1D4ED8" /> إضافة تحديث جديد
                              </button>
                              <IconBtn d={IC.trash} title="إزالة حالة الاستخدام" color="#C0303B" bg="#FDF6F6" border="#F3D4D7" onClick={() => s.removeUseCase(u.id)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={cols} style={{ padding: 0, borderBottom: '1px solid #F4F6FA', background: '#FAFBFE' }}>
                          <UcUpdates uc={u} isCoord={isCoord} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// سجل تحديثات حالة استخدام واحدة — يظهر داخل صف الجدول عند التوسيع
function UcUpdates({ uc, isCoord }: { uc: MocaUseCase; isCoord: boolean }) {
  const s = useMoca();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [vendor, setVendor] = useState('');
  return (
    <div style={{ padding: '14px 18px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, borderBottom: '1px solid #E7ECF4' }}>التحديث</th>
            <th style={{ ...th, width: 200, borderBottom: '1px solid #E7ECF4' }}>المزود (vendor)</th>
            <th style={{ ...th, width: 140, borderBottom: '1px solid #E7ECF4' }}>تاريخ التحديث</th>
          </tr>
        </thead>
        <tbody>
          {uc.updates.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ ...td, color: '#9AA6BC', textAlign: 'center', padding: '16px 9px' }}>
                لا توجد تحديثات بعد على حالة الاستخدام هذه.
              </td>
            </tr>
          ) : (
            uc.updates.map((up, ui) => (
              <tr key={ui}>
                <td style={{ ...td, lineHeight: 1.8 }}>{up.text}</td>
                <td style={td}>{up.vendor || '—'}</td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>{String(up.at || '').slice(0, 10)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isCoord && (
        <div style={{ paddingTop: 12 }}>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 34, padding: '0 13px', background: '#EAF1FE', color: '#1D4ED8', border: '1px solid #C9DBFB', borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Icon d={IC.plus} size={14} strokeWidth={2.4} color="#1D4ED8" /> إضافة تحديث
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <label style={labelStyle}>التحديث</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="آخر ما تم إنجازه على حالة الاستخدام…"
                  style={inputStyle}
                />
              </div>
              <div style={{ width: 200 }}>
                <label style={labelStyle}>المزود (vendor)</label>
                <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="اسم المزود" style={inputStyle} />
              </div>
              <button
                onClick={() => {
                  if (!text.trim()) return s.showToast('يرجى كتابة نص التحديث');
                  s.addUcUpdate(uc.id, text, vendor);
                  setText('');
                  setVendor('');
                  setOpen(false);
                }}
                style={BTN_PRIMARY}
              >
                <Icon d={IC.check} size={16} color="#fff" /> حفظ التحديث
              </button>
              <button onClick={() => { setOpen(false); setText(''); setVendor(''); }} style={BTN_NEUTRAL}>إلغاء</button>
              <div style={{ width: '100%', fontSize: 11.5, color: '#8E9AB0' }}>يُسجَّل تاريخ التحديث تلقائياً عند الحفظ.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ---- دفعات الإطلاق: توزيع المدخلات المعتمدة على الدفعات المعتمدة ------------
const dateInput: CSSProperties = {
  border: '1px solid #DCE3EE',
  backgroundColor: '#fff',
  borderRadius: 9,
  padding: '6px 8px',
  fontSize: 11.5,
  fontFamily: 'inherit',
  color: '#13213C',
  width: 128,
};

function BatchesView() {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const [fUnitB, setFUnitB] = useState('all');

  const inScope = (e: MocaEntry) =>
    isCoord
      ? e.unitId === s.unitId && (!s.unitSector || e.unitSector === s.unitSector)
      : e.batchWf === 'pending' || e.batchWf === 'approved';
  const placedAll = s.entries.filter((e) => String(e.execBatch || '').trim() && inScope(e));
  const placed = placedAll.filter((e) => isCoord || fUnitB === 'all' || e.unitId === fUnitB);
  const addable = isCoord
    ? s.entries.filter(
        (e) =>
          e.wf === 'approved' &&
          !String(e.execBatch || '').trim() &&
          e.unitId === s.unitId &&
          (!s.unitSector || e.unitSector === s.unitSector)
      )
    : [];
  const draftIds = placed.filter((e) => mocaPlacementState(e) === 'draft').map((e) => e.id);
  const pendingCount = placed.filter((e) => mocaPlacementState(e) === 'pending').length;

  return (
    <>
      <div style={PANEL}>
        <div style={{ padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="hd" style={{ fontWeight: 800, fontSize: 15, color: '#13213C', minWidth: 180 }}>
            {isCoord ? 'دفعات الإطلاق — ' + mocaScopeLabel(s.unitId, s.unitSector) : 'دفعات الإطلاق — توزيعات جهات الوزارة'}
          </div>
          <div style={{ flex: 1 }} />
          {!isCoord && pendingCount > 0 && (
            <Chip t={pendingCount + (pendingCount === 1 ? ' توزيع بانتظار اعتمادك' : ' توزيعات بانتظار اعتمادك')} c="#B45309" bg="#FFF7EB" />
          )}
          {isCoord && draftIds.length > 0 && (
            <button onClick={() => s.submitPlacements(draftIds)} style={BTN_PRIMARY}>
              <Icon d={IC.send} size={15} color="#fff" /> إرسال الكل للاعتماد ({draftIds.length})
            </button>
          )}
          {!isCoord && (
            <FilterSelect
              value={fUnitB}
              onChange={setFUnitB}
              minWidth={180}
              options={[{ v: 'all', label: 'الجهة أو المكتب: الكل' }, ...MOCA_UNITS.map((u) => ({ v: u.id, label: u.name }))]}
            />
          )}
        </div>
      </div>

      {MOCA_BATCHES.map((b) => {
        const rows = placed.filter((e) => e.execBatch === b.name);
        if (!rows.length && !isCoord) return null;
        return (
          <div key={b.name} style={PANEL}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid #EEF1F7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="hd" style={{ fontWeight: 800, fontSize: 13.5, color: '#13213C' }}>{b.name}</div>
              <span style={{ fontSize: 11, color: '#8A97AD', fontWeight: 700 }}>{b.period}</span>
              <div style={{ flex: 1 }} />
              {isCoord && addable.length > 0 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && s.assignBatch(e.target.value, b.name)}
                  style={{ ...dateInput, width: 250, cursor: 'pointer', fontWeight: 700 }}
                >
                  <option value="">إضافة مدخل معتمد إلى الدفعة…</option>
                  {addable.map((e) => (
                    <option key={e.id} value={e.id}>{String(e.subProcess || e.mainProcess || '—')}</option>
                  ))}
                </select>
              )}
            </div>
            {rows.length === 0 ? (
              <div style={{ padding: '18px', fontSize: 12, color: '#9AA6BC' }}>
                لا توزيعات في هذه الدفعة بعد — {addable.length ? 'أضف المدخلات المعتمدة من القائمة أعلاه.' : 'يُوزَّع المدخل المعتمد فقط.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={th}>العملية والمهمة الرئيسية</th>
                      <th style={th}>العملية والمهمة الفرعية</th>
                      {!isCoord && <th style={th}>الجهة أو المكتب</th>}
                      <th style={th}>تاريخ البدء</th>
                      <th style={th}>تاريخ الانتهاء</th>
                      <th style={th}>حالة المدخل</th>
                      <th style={th}>حالة التوزيع</th>
                      <th style={th}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => {
                      const st = mocaStatusOf(e);
                      const pc = mocaPlacementChip(e);
                      const locked = mocaPlacementLocked(e);
                      const pst = mocaPlacementState(e);
                      return (
                        <tr key={e.id}>
                          <td
                            style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 185, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            title={String(e.mainProcess || '')}
                            onClick={() => s.openDetail(e.id)}
                          >
                            {String(e.mainProcess || '—')}
                          </td>
                          <td
                            style={{ ...td, maxWidth: 195, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            title={String(e.subProcess || '')}
                            onClick={() => s.openDetail(e.id)}
                          >
                            {String(e.subProcess || '—')}
                          </td>
                          {!isCoord && <td style={td}>{mocaScopeLabel(e.unitId, e.unitSector)}</td>}
                          <td style={td}>
                            {isCoord && !locked ? (
                              <input type="date" value={String(e.startDate || '')} min={b.start} max={b.end} onChange={(ev) => s.setBatchDate(e.id, 'startDate', ev.target.value)} style={dateInput} />
                            ) : (
                              String(e.startDate || '—')
                            )}
                          </td>
                          <td style={td}>
                            {isCoord && !locked ? (
                              <input type="date" value={String(e.endDate || '')} min={b.start} max={b.end} onChange={(ev) => s.setBatchDate(e.id, 'endDate', ev.target.value)} style={dateInput} />
                            ) : (
                              String(e.endDate || '—')
                            )}
                          </td>
                          <td style={td}><Chip t={st.label} c={st.color} bg={st.bg} /></td>
                          <td style={td}>
                            {pc ? (
                              <span title={pc.note ? (e.batchRet === 'reject' ? 'سبب الرفض: ' : 'الملاحظات: ') + pc.note : undefined}>
                                <Chip t={pc.label} c={pc.color} bg={pc.bg} />
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ ...td, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }}>
                              {isCoord && !locked && (
                                <>
                                  <select
                                    value={b.name}
                                    onChange={(ev) => s.assignBatch(e.id, ev.target.value)}
                                    title="نقل إلى دفعة أخرى"
                                    style={{ ...dateInput, width: 150, cursor: 'pointer' }}
                                  >
                                    {MOCA_BATCHES.map((bb) => (
                                      <option key={bb.name} value={bb.name}>{bb.name}</option>
                                    ))}
                                  </select>
                                  {pst === 'draft' && (
                                    <IconBtn d={IC.send} title="إرسال التوزيع للاعتماد" color="#1D4ED8" bg="#EAF1FE" border="#C9DBFB" onClick={() => s.submitPlacements([e.id])} />
                                  )}
                                  <IconBtn d={IC.trash} title="إزالة من الدفعة" color="#C0303B" bg="#FDF6F6" border="#F3D4D7" onClick={() => s.assignBatch(e.id, '')} />
                                </>
                              )}
                              {!isCoord && pst === 'pending' && (
                                <>
                                  <button
                                    onClick={() => s.approvePlacement(e.id)}
                                    style={{ background: 'linear-gradient(180deg,#0EA371,#0B8A4B)', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 14px', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}
                                  >
                                    اعتماد
                                  </button>
                                  <IconBtn d={IC.rotate} title="إعادة التوزيع للتعديل" color="#B45309" bg="#FFF3DE" border="#F1DCBA" onClick={() => s.openPlaceReturn(e.id, 'info')} />
                                  <IconBtn d={IC.close} title="رفض التوزيع" color="#C0303B" bg="#FDF6F6" border="#F3D4D7" onClick={() => s.openPlaceReturn(e.id, 'reject')} />
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
      })}

      {!isCoord && placed.length === 0 && (
        <div style={{ ...PANEL, padding: '40px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#54627B', marginBottom: 6 }}>لا توزيعات مرسلة للاعتماد بعد</div>
          <div style={{ fontSize: 12, color: '#9AA6BC' }}>عندما يرسل المنسقون توزيعاتهم على دفعات الإطلاق ستظهر هنا لاعتمادها.</div>
        </div>
      )}
    </>
  );
}

// نافذة إعادة/رفض التوزيع — الملاحظة إلزامية
function PlaceReturnDialog() {
  const s = useMoca();
  const t = s.placeReturnTarget!;
  const [note, setNote] = useState('');
  const isReject = t.kind === 'reject';
  return (
    <Modal onClose={() => s.closePlaceReturn()}>
      <div className="hd" style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C', marginBottom: 6 }}>
        {isReject ? 'رفض التوزيع' : 'إعادة التوزيع للتعديل'}
      </div>
      <div style={{ fontSize: 12.5, color: '#6B7A93', marginBottom: 14, lineHeight: 1.8 }}>
        {isReject
          ? 'يُذكر سبب رفض التوزيع على الدفعة، ويعود للمنسق مسودة قابلة للتعديل.'
          : 'وضّح المطلوب تعديله في التوزيع (الدفعة أو التواريخ) ليعالجه المنسق ويعيد الإرسال.'}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={isReject ? 'سبب الرفض…' : 'الملاحظات المطلوبة…'}
        style={{ ...inputStyle, minHeight: 110, resize: 'vertical', marginBottom: 14 }}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => s.closePlaceReturn()} style={BTN_NEUTRAL}>إلغاء</button>
        <button
          onClick={() => {
            if (!note.trim()) return s.showToast(isReject ? 'يرجى ذكر سبب الرفض' : 'يرجى كتابة الملاحظات');
            mocaApplyPlaceReturn(t.id, t.kind, note);
          }}
          style={isReject ? { ...BTN_PRIMARY, background: 'linear-gradient(180deg,#D6454F,#C0303B)' } : BTN_PRIMARY}
        >
          {isReject ? 'تأكيد الرفض' : 'إعادة للتعديل'}
        </button>
      </div>
    </Modal>
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
