'use client';
import React from 'react';
import type { VM } from '@/lib/viewModel';
import { RichTextEditor } from './RichText';
import { Icon } from './Icon';
import { SUPPORT_FUNCTIONS, SUPPORT_OPTYPE, OPS_SPECIAL_OPTYPE, OPS_AUTOMATED_OPTIONS, OPS_INTENSITY_OPTIONS, OPS_READINESS_OPTIONS, OPS_LEVEL_OPTIONS, OPS_TRANSFORM_OPTIONS, OPS_NOT_TRANSFORMABLE, OPS_PRIORITY_OPTIONS, OPS_RISK_OPTIONS, STREAM_FIELD_OPTIONS, STREAM_FIELD_SAMPLE, STREAM_FIELDS, LAUNCH_TYPES, typeLabel, pathById, stgPriority, svcPriority, activityTransformYes, isStgBlocked, STG_TRANSFORM_OPTIONS, type ActivityDetail, opsPeriodOptions, OPS_NO_PRIORITY } from '@/lib/domain';
import { BULK_VERDICT_STYLE } from '@/lib/ai';
import { downloadItemsTemplate, downloadOpsTemplate } from '@/lib/export';
import { useSvcCatalog, svcCatalogFor, svcCatalogEntities } from '@/lib/svcCatalog';


// Repeatable single-line rows for الأنشطة — stored as one newline-joined value
// so counters, the Excel template and the detail view keep working unchanged.
function ActivityRows({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = (() => {
    const parts = (value || '').split('\n');
    return parts.length ? parts : [''];
  })();
  const commit = (next: string[]) => onChange(next.join('\n'));
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label} <span style={{ color: '#D23B45' }}>*</span>
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 'none', width: 22, textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#9AA6BC' }}>{i + 1}</span>
            <input
              value={r}
              onChange={(e) => {
                const next = [...rows];
                next[i] = arabicOnly(e.target.value);
                commit(next);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const next = [...rows];
                  next.splice(i + 1, 0, '');
                  commit(next);
                }
              }}
              placeholder={placeholder}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => {
                if (rows.length === 1) return commit(['']);
                commit(rows.filter((_, x) => x !== i));
              }}
              title="حذف النشاط"
              style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #F0D5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={14} color="#C0303B" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => commit([...rows, ''])}
        style={{ marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EAF0FE', color: '#2563EB', border: 'none', borderRadius: 10, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <Icon d="M12 5v14M5 12h14" size={14} color="#2563EB" strokeWidth={2.4} />
        إضافة نشاط
      </button>
    </div>
  );
}

// ============================================================================
// Create wizard side-panel (§9) — faithful RTL reproduction of the prototype.
// ============================================================================

// Arabic-only guard for Arabic text fields: strips Latin letters as the user
// types. Arabic script, digits (Arabic/Western), spaces and punctuation stay.
const arabicOnly = (v: string) => v.replace(/[A-Za-z]/g, '');

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #DCE3EE',
  backgroundColor: '#fff',
  borderRadius: 11,
  padding: '11px 13px',
  fontSize: 13.5,
  outline: 'none',
  fontFamily: 'inherit',
};
// a required field left empty after a failed submit — red ring + marker so
// the form can scroll to the first gap
const INVALID_STYLE: React.CSSProperties = { borderColor: '#D23B45', background: '#FFF8F8', boxShadow: '0 0 0 3px rgba(210,59,69,.12)' };
const isEmptyVal = (v: unknown) => !String(v ?? '').replace(/<[^>]*>/g, '').trim();

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 400,
  color: '#54627B',
  marginBottom: 6,
};
const cardStyle: React.CSSProperties = {
  background: '#FAFBFE',
  border: '1px solid #E7ECF4',
  borderRadius: 16,
  padding: 18,
  marginBottom: 14,
};

// icon path data (stroke SVGs)
const IC = {
  plus: 'M12 5v14M5 12h14',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevron: 'M15 18l-6-6 6-6',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  upload: 'M12 15V3M7 8l5-5 5 5M5 21h14',
  sparkle: 'M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3Z',
  check: 'M20 6L9 17l-5-5',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  x: 'M18 6L6 18M6 6l12 12',
  warnTri: 'M12 9v4M12 17h.01M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  infoCircle: 'M12 8h.01M11 12h1v4h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  download: 'M12 3v12M8 11l4 4 4-4M5 21h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  attach: 'M21.44 11.05 12 20.5a5 5 0 0 1-7-7l9.5-9.5a3.3 3.3 0 0 1 4.7 4.7L9.4 18.1a1.6 1.6 0 0 1-2.3-2.3l8.5-8.5',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  settings:
    'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
};

export function CreatePanel({ vm }: { vm: VM }) {
  const m = vm.modal;
  const s = vm.store;
  const draft = m.draft;

  const setField = (k: string, v: unknown) => s.setDraftField(k as never, v);
  const gv = (k: string): string => (draft ? ((draft as unknown as Record<string, unknown>)[k] as string) ?? '' : '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, direction: 'rtl' }}>
      {/* scrim */}
      <div
        onClick={() => s.closeModal()}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }}
      />
      {/* panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 580,
          maxWidth: '96vw',
          background: '#F7F9FD',
          boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
          animation: 'slideInRight .3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '15px 20px',
            background: '#fff',
            borderBottom: '1px solid #E7ECF4',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flex: 'none',
            }}
          >
            <Icon d={IC.plus} size={20} color="#fff" />
          </div>
          <div className="hd" style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#13213C' }}>{m.createTitle}</div>
          <button
            onClick={() => s.closeModal()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid #E7ECF4',
              background: '#fff',
              color: '#54627B',
              cursor: 'pointer',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {m.mStep === 'path' && <PathStep vm={vm} />}
          {m.mStep === 'type' && <TypeStep vm={vm} />}
          {m.mStep === 'method' && <MethodStep vm={vm} />}
          {m.mStep === 'form' && <FormStep vm={vm} setField={setField} gv={gv} />}
          {m.mStep === 'bulk' && <BulkStep vm={vm} />}
          {m.mStep === 'bulkReview' && <BulkReviewStep vm={vm} />}
          {m.mStep === 'done' && <DoneStep vm={vm} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline add-manually form — rendered UNDER the list table instead of a popup.
// Ends with a confirmation (visible-to-stream-head warning): تأكيد / حفظ كمسودة.
export function InlineCreateForm({ vm }: { vm: VM }) {
  const s = vm.store;
  const m = vm.modal;
  const draft = m.draft;
  const setField = (k: string, v: unknown) => s.setDraftField(k as never, v);
  const gv = (k: string): string => (draft ? ((draft as unknown as Record<string, unknown>)[k] as string) ?? '' : '');
  // the form renders below the (possibly long) entries table — bring it into
  // view when it opens so the coordinator never has to hunt for it
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const t = setTimeout(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={rootRef} style={{ marginTop: 18, scrollMarginTop: 90, background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 18, padding: 20, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon d={IC.plus} size={18} color="#fff" />
        </div>
        <div className="hd" style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#13213C' }}>{m.createTitle}</div>
        <button
          onClick={() => s.closeInline()}
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}
        >
          ✕
        </button>
      </div>
      {m.mStep === 'type' ? <TypeStep vm={vm} /> : <FormStep vm={vm} setField={setField} gv={gv} />}

      {vm.confirmAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => s.cancelConfirmAdd()} style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }} />
          <div style={{ position: 'relative', width: 440, maxWidth: '94vw', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -30px rgba(2,12,35,.6)', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div className="hd" style={{ flex: 1, fontSize: 15.5, fontWeight: 800, color: '#13213C' }}>تأكيد الإضافة</div>
              <button
                onClick={() => s.cancelConfirmAdd()}
                style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#54627B', lineHeight: 1.9, margin: '12px 0 18px' }}>
              هل أنت متأكد من الإضافة؟ سيصبح المدخل مرئياً لفريق عمل المسار بعد التأكيد.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => s.saveDraftOnly()}
                style={{ background: '#EEF1F7', border: 'none', borderRadius: 11, padding: '11px 18px', color: '#54627B', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                حفظ كمسودة
              </button>
              <button
                onClick={() => s.confirmInlineAdd()}
                style={{ background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', border: 'none', borderRadius: 11, padding: '11px 22px', color: '#fff', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)' }}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: PATH
function PathStep({ vm }: { vm: VM }) {
  const m = vm.modal;
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#13213C' }}>اختر المسار</h2>
      <p style={{ fontSize: 12.5, color: '#8A97AD', margin: '0 0 16px' }}>
        حدّد المسار الذي ستُضيف فيه.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {m.pathCards.map((p) => (
          <button
            key={p.id}
            onClick={p.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              width: '100%',
              textAlign: 'right',
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 14,
              padding: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: `${p.color}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Icon d={p.icon} size={20} color={p.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1F2D49' }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 2 }}>{p.desc}</div>
            </div>
            <Icon d={IC.chevronLeft} size={18} color="#C3CDDE" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: TYPE
function TypeStep({ vm }: { vm: VM }) {
  const m = vm.modal;
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {m.typeCards.map((t) => (
          <button
            key={t.key}
            onClick={t.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              width: '100%',
              textAlign: 'right',
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 14,
              padding: 16,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#EAF0FE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Icon d={IC.plus} size={20} color="#2563EB" />
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#1F2D49' }}>
              إضافة {t.label}
            </div>
            <Icon d={IC.chevron} size={18} color="#C3CDDE" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: METHOD
function MethodStep({ vm }: { vm: VM }) {
  const s = vm.store;
  const optCard = (
    onClick: () => void,
    chipBg: string,
    chipColor: string,
    icon: string,
    title: string,
    desc: string
  ) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 13,
        width: '100%',
        textAlign: 'right',
        background: '#fff',
        border: '1px solid #E7ECF4',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: chipBg,
          color: chipColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <Icon d={icon} size={20} color={chipColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2D49', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#9AA6BC', lineHeight: 1.7 }}>{desc}</div>
      </div>
    </button>
  );
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {optCard(
        () => s.chooseManual(),
        '#EAF0FE',
        '#2563EB',
        IC.pencil,
        'التعبئة اليدوية',
        'املأ النموذج بنفسك خطوة بخطوة ثم أرسله للاعتماد.'
      )}
      {optCard(
        () => s.chooseBulk(),
        '#E3F6EC',
        '#0B8A4B',
        IC.upload,
        'رفع المستند',
        'نزّل النموذج، عبّئ عدّة صفوف دفعة واحدة، ثم ارفعه لاستيرادها ومراجعتها قبل الإرسال.'
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: FORM
function FormStep({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const m = vm.modal;
  const s = vm.store;
  const fStep = m.fStep;

  return (
    <div>
      {/* numbered stepper (hidden for single-step forms) */}
      {m.fLabels.length > 1 && (
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
        {m.fLabels.map((_l, _i) => _i + 1).map((n) => {
          const completed = n < fStep;
          const current = n === fStep;
          const filled = completed || current;
          const label = m.fLabels[n - 1] || '';
          return (
            <div
              key={n}
              onClick={completed ? () => s.setFStep(n) : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
                cursor: completed ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background: n > 1 ? (n <= fStep ? '#2563EB' : '#E1E7F1') : 'transparent',
                  }}
                />
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flex: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11.5,
                    fontWeight: 800,
                    background: filled ? '#2563EB' : '#fff',
                    color: filled ? '#fff' : '#9AA6BC',
                    border: filled ? 'none' : '1.5px solid #DCE3EE',
                    boxShadow: current ? '0 0 0 4px rgba(37,99,235,.14)' : 'none',
                  }}
                >
                  {completed ? <Icon d={IC.check} size={14} color="#fff" strokeWidth={3} /> : n}
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background: n < m.fLabels.length ? (n < fStep ? '#2563EB' : '#E1E7F1') : 'transparent',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: current ? '#13213C' : completed ? '#42506B' : '#9AA6BC',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  padding: '0 2px',
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
      )}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>{m.fStepTitle}</div>
        <div style={{ fontSize: 12, color: '#8A97AD', marginTop: 2 }}>{m.fStepHint}</div>
      </div>

      {m.mIsOpsForm ? (
        <FOps vm={vm} setField={setField} gv={gv} />
      ) : m.mIsStgTask ? (
        <FTask vm={vm} setField={setField} gv={gv} />
      ) : m.mIsService ? (
        <FService vm={vm} setField={setField} gv={gv} />
      ) : (
        <>
          {fStep === 1 && <F1 vm={vm} setField={setField} gv={gv} />}
          {fStep === 2 && <F2 vm={vm} setField={setField} gv={gv} />}
          {fStep === 3 && <FOutcome vm={vm} setField={setField} gv={gv} />}
          {fStep === 4 && <FBudget vm={vm} setField={setField} gv={gv} />}
          {fStep === 5 && <FPhases vm={vm} />}
        </>
      )}

      {/* form actions (sticky bottom) */}
      <div
        style={{
          position: 'sticky',
          bottom: -24,
          margin: '10px -24px -24px',
          padding: '20px 24px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'linear-gradient(180deg,rgba(247,249,253,0),#F7F9FD 30%)',
        }}
      >
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={() => s.saveDraftOnly()}
            style={{
              background: '#EEF1F7',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              color: '#54627B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            حفظ كمسودة
          </button>
          <button
            onClick={() => s.fNext()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
              border: 'none',
              borderRadius: 11,
              padding: '11px 18px',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
              fontFamily: 'inherit',
            }}
          >
            {m.fNextLabel}
            <Icon d={IC.chevronLeft} size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

// F1 GENERAL
function F1({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const m = vm.modal;
  const disabledStyle: React.CSSProperties = { ...inputStyle, backgroundColor: '#F1F4F9', cursor: 'not-allowed' };
  return (
    <div style={cardStyle}>
      {m.mIsOp && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>نوع {m.opWordDef} <span style={{ color: '#D23B45' }}>*</span></label>
          <select value={gv('opType')} onChange={(e) => setField('opType', e.target.value)} style={inputStyle}>
            {(m.opWordDef === 'المهمة'
              ? ['المهام التخصصية', 'مهام الدعم المؤسسي']
              : ['العمليات التخصصية', 'عمليات الدعم المؤسسي']
            ).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{m.mIsProjectish ? 'اسم المشروع' : 'اسم ' + m.mTypeLabel} <span style={{ color: '#D23B45' }}>*</span></label>
        <input
          value={gv('title')}
          onChange={(e) => setField('title', arabicOnly(e.target.value))}
          placeholder="اكتب اسماً واضحاً"
          style={inputStyle}
        />
      </div>

      {m.mIsOp && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>هل {m.opWordDef} مرتبطة بخدمة؟ <span style={{ color: '#D23B45' }}>*</span></label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['نعم', 'لا'].map((opt) => {
                const active = gv('linkedToService') === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setField('linkedToService', opt)}
                    style={{
                      flex: 1,
                      border: '1px solid ' + (active ? '#2563EB' : '#DCE3EE'),
                      background: active ? '#EAF1FE' : '#fff',
                      color: active ? '#1D4ED8' : '#54627B',
                      borderRadius: 11,
                      padding: '11px 13px',
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          {gv('linkedToService') === 'نعم' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>ما هي الخدمة؟ <span style={{ color: '#D23B45' }}>*</span></label>
              <input
                value={gv('linkedServiceName')}
                onChange={(e) => setField('linkedServiceName', arabicOnly(e.target.value))}
                placeholder="اسم الخدمة المرتبطة"
                style={inputStyle}
              />
            </div>
          )}
        </>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>وصف مختصر <span style={{ color: '#D23B45' }}>*</span></label>
        <RichTextEditor
          value={gv('desc')}
          onChange={(v) => setField('desc', v)}
          placeholder="نبذة موجزة عن النطاق والهدف"
          minHeight={110}
        />
      </div>

      {m.mIsOp && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>الأنشطة الفرعية <span style={{ color: '#D23B45' }}>*</span></label>
            <RichTextEditor
              value={gv('subActivities')}
              onChange={(v) => setField('subActivities', v)}
              placeholder="مثال: استلام، تدقيق، إصدار"
              minHeight={96}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الجهة الاتحادية المعنية</label>
              <input value={vm.entityName} disabled style={disabledStyle} />
            </div>
            <div>
              <label style={labelStyle}>القطاع المعني <span style={{ color: '#D23B45' }}>*</span></label>
              <input value={gv('sector')} onChange={(e) => setField('sector', arabicOnly(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الإدارة المعنية <span style={{ color: '#D23B45' }}>*</span></label>
              <input value={gv('dept')} onChange={(e) => setField('dept', arabicOnly(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>القسم المعني <span style={{ color: '#D23B45' }}>*</span></label>
              <input value={gv('section')} onChange={(e) => setField('section', arabicOnly(e.target.value))} style={inputStyle} />
            </div>
          </div>
        </>
      )}

      {m.mIsService && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>مالك الخدمة <span style={{ color: '#D23B45' }}>*</span></label>
            <input value={gv('serviceOwner')} onChange={(e) => setField('serviceOwner', arabicOnly(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>الفئة المستهدفة <span style={{ color: '#D23B45' }}>*</span></label>
            <input value={gv('targetUsers')} onChange={(e) => setField('targetUsers', arabicOnly(e.target.value))} style={inputStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

// F2 DETAILED
function F2({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const m = vm.modal;
  const s = vm.store;
  const cardTitle: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#1F2D49', marginBottom: 14 };
  const rankBtn = (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>ترتيب الأولوية <span style={{ color: '#D23B45' }}>*</span></label>
      <button
        onClick={() => s.openRank()}
        style={{
          width: '100%',
          border: '1px solid #DCE3EE',
          background: '#fff',
          borderRadius: 11,
          padding: '11px 13px',
          fontSize: 13.5,
          fontWeight: 700,
          color: '#33405A',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontFamily: 'inherit',
        }}
      >
        <span>{m.rankBtnLabel}</span>
        <Icon d={IC.list} size={16} color="#8A97AD" />
      </button>
    </div>
  );
  const sel = (label: string, key: string, opts: string[]) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label} <span style={{ color: '#D23B45' }}>*</span></label>
      <select value={gv(key)} onChange={(e) => setField(key, e.target.value)} style={inputStyle}>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
  const durs = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
      <div>
        <label style={labelStyle}>المدة الزمنية للإنجاز قبل التحويل <span style={{ color: '#D23B45' }}>*</span></label>
        <input value={gv('durationBefore')} onChange={(e) => setField('durationBefore', arabicOnly(e.target.value))} placeholder="مثال: 3 أيام عمل" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>المدة الزمنية للإنجاز بعد التحويل <span style={{ color: '#D23B45' }}>*</span></label>
        <input value={gv('durationAfter')} onChange={(e) => setField('durationAfter', arabicOnly(e.target.value))} placeholder="مثال: 10 دقائق" style={inputStyle} />
      </div>
    </div>
  );
  const range = (label: string, key: string) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label} <span style={{ color: '#D23B45' }}>*</span></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Number(gv(key)) || 0}
          onChange={(e) => setField(key, Number(e.target.value))}
          style={{ flex: 1, accentColor: '#2563EB' }}
        />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', minWidth: 42, textAlign: 'left' }}>
          {Number(gv(key)) || 0}%
        </span>
      </div>
    </div>
  );

  return (
    <div>
      {!m.mIsOp && (
        <div style={cardStyle}>
          <div style={cardTitle}>التقييم والأولوية</div>
          {sel('الأولوية', 'priority', ['عالية', 'متوسطة', 'منخفضة'])}
          {sel('مستوى التعقيد', 'complexity', ['عالٍ', 'متوسط', 'منخفض'])}
          {m.mIsProjectish
            ? sel(
                gv('type') === 'initiative' ? 'وضع المبادرة' : 'وضع المشروع',
                'status',
                gv('type') === 'initiative'
                  ? ['مبادرة جديدة', 'قيد التنفيذ', 'قائمة', 'مكتملة']
                  : ['مشروع جديد', 'قيد التنفيذ', 'قائم', 'مكتمل']
              )
            : sel('وضع الخدمة', 'status', ['خدمة جديدة', 'قيد التنفيذ', 'قائمة', 'مكتملة'])}
          {rankBtn}
        </div>
      )}

      {m.mIsOp && (
        <>
          <div style={cardStyle}>
            <div style={cardTitle}>التقييم والأولوية</div>
            {sel('الأولوية', 'priority', ['عالية', 'متوسطة', 'منخفضة'])}
            {sel('مستوى التعقيد', 'complexity', ['عالٍ', 'متوسط', 'منخفض'])}
            {rankBtn}
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>معلومات الأتمتة</div>
            {range('نسبة الأتمتة الحالية', 'automationPct')}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>نظام الأتمتة المستخدم <span style={{ color: '#D23B45' }}>*</span></label>
              <input
                value={gv('automationSystem')}
                onChange={(e) => setField('automationSystem', arabicOnly(e.target.value))}
                style={inputStyle}
              />
            </div>
            {sel('كثافة الاستخدام', 'usageIntensity', ['منخفضة', 'متوسطة', 'عالية'])}
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>قابلية التحول للذكاء الاصطناعي المساعد</div>
            {sel('قابلية التحول', 'transformability', ['قابل كلياً', 'قابل جزئياً', 'غير قابل للتحول', 'أخرى'])}
            {sel('أولوية التحول', 'transformPriority', ['منخفضة', 'متوسطة', 'عالية'])}
            {range('جاهزية التحول', 'readiness')}
            {sel('مستوى الأثر المتوقع', 'impact', ['منخفض', 'متوسط', 'عالٍ'])}
            {durs}
          </div>
        </>
      )}

      {m.mIsService && (
        <div style={cardStyle}>
          <div style={cardTitle}>تفاصيل الخدمة</div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>رحلة المتعامل / الخطوات الحالية <span style={{ color: '#D23B45' }}>*</span></label>
            <RichTextEditor
              value={gv('currentJourney')}
              onChange={(v) => setField('currentJourney', v)}
              minHeight={96}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>نقاط الألم <span style={{ color: '#D23B45' }}>*</span></label>
            <RichTextEditor
              value={gv('painPoints')}
              onChange={(v) => setField('painPoints', v)}
              minHeight={96}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>التحسين المتوقع <span style={{ color: '#D23B45' }}>*</span></label>
            <RichTextEditor
              value={gv('expectedImprovement')}
              onChange={(v) => setField('expectedImprovement', v)}
              placeholder="مثال: تقليل زمن الإصدار من 3 أيام إلى دقائق"
              minHeight={96}
            />
          </div>
          {durs}
          <div>
            <label style={labelStyle}>مستوى الأثر المتوقع <span style={{ color: '#D23B45' }}>*</span></label>
            <select value={gv('impact')} onChange={(e) => setField('impact', e.target.value)} style={inputStyle}>
              {['منخفض', 'متوسط', 'عالٍ'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// F-OUTCOME (step3)
function FOutcome({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const m = vm.modal;
  // "مساعدو الذكاء الاصطناعي" figures apply to operations & services only —
  // projects/initiatives don't carry an agent count or nature
  const showAgents = !m.mIsProjectish;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ ...labelStyle, minHeight: 38 }}>نسبة التحول المستهدفة باستخدام الذكاء الاصطناعي <span style={{ color: '#D23B45' }}>*</span></label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #E7ECF4',
              borderRadius: 12,
              backgroundColor: '#fff',
              padding: '0 14px',
              height: 46,
            }}
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Number(gv('targetPct')) || 0}
              onChange={(e) => setField('targetPct', e.target.value)}
              style={{ flex: 1, accentColor: '#2563EB', cursor: 'pointer' }}
            />
            <span
              style={{
                flex: 'none',
                minWidth: 48,
                textAlign: 'center',
                fontSize: 13.5,
                fontWeight: 800,
                color: '#13213C',
                background: '#F0F4FB',
                borderRadius: 8,
                padding: '4px 8px',
              }}
            >
              {Number(gv('targetPct')) || 0}%
            </span>
          </div>
        </div>
        {showAgents && (
          <div>
            <label style={{ ...labelStyle, minHeight: 38 }}>العدد المتوقع لمساعدي الذكاء الاصطناعي <span style={{ color: '#D23B45' }}>*</span></label>
            <input
              type="number"
              min={0}
              value={gv('aiModels')}
              onChange={(e) => setField('aiModels', e.target.value)}
              style={inputStyle}
            />
          </div>
        )}
        {showAgents && (
          <div>
            <label style={{ ...labelStyle, minHeight: 38 }}>طبيعة عمل مساعدي الذكاء الاصطناعي (مشترك ومتخصص) <span style={{ color: '#D23B45' }}>*</span></label>
            <select value={gv('agentNature')} onChange={(e) => setField('agentNature', e.target.value)} style={inputStyle}>
              <option value="">اختر…</option>
              <option>مشترك</option>
              <option>متخصص</option>
              <option>مشترك ومتخصص</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// F-BUDGET (step4)
function FBudget({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  void vm;
  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          نطاق العمل التفصيلي <span style={{ color: '#D23B45' }}>*</span>
        </label>
        <RichTextEditor
          value={gv('scopeOfWork')}
          onChange={(v) => setField('scopeOfWork', v)}
          placeholder="صف نطاق العمل: المكوّنات، المخرجات، التكاملات، والاستثناءات"
          minHeight={130}
        />
      </div>
      <div>
        <label style={labelStyle}>المستند المرفق <span style={{ color: '#D23B45' }}>*</span></label>
        {gv('scopeFile') ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid #DCE3EE',
              background: '#fff',
              borderRadius: 12,
              padding: '11px 13px',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                flex: 'none',
                borderRadius: 9,
                background: '#E3F6EC',
                color: '#0B8A4B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon d={IC.file} size={18} color="#0B8A4B" />
            </span>
            <div style={{ flex: 1, fontSize: 12.5, color: '#1F2D49', fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {gv('scopeFile')}
            </div>
            <label
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: '#2563EB',
                cursor: 'pointer',
                padding: '5px 9px',
                borderRadius: 8,
              }}
            >
              تغيير
              <input
                type="file"
                onChange={(e) => setField('scopeFile', e.target.files?.[0]?.name || '')}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => setField('scopeFile', '')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#FCEEEF',
                color: '#D23B45',
                border: 'none',
                cursor: 'pointer',
                flex: 'none',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1.5px dashed #CDD8EA',
              background: '#FAFCFF',
              borderRadius: 12,
              padding: '13px 15px',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                flex: 'none',
                borderRadius: 9,
                background: '#EAF0FE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon d={IC.attach} size={18} color="#2563EB" />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#54627B' }}>
              أرفق مستند نطاق العمل (PDF)
            </span>
            <input
              type="file"
              onChange={(e) => setField('scopeFile', e.target.files?.[0]?.name || '')}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

// F-PHASES (step 5): pick the execution & launch batch only — launch plans
// are attached centrally via «إدارة خطط الإطلاق» or the dashboard bulk-assign.
// Start/end dates live at the stage level (each stage carries its own period),
// not on the item during creation.
function FPhases({ vm }: { vm: VM }) {
  const m = vm.modal;
  const s = vm.store;
  const draft = m.draft;

  return (
    <div>
      {(draft?.transformability || '') === 'غير قابل' ? (
        <div style={cardStyle}>
          <div style={{ fontSize: 12.5, color: '#8A97AD', lineHeight: 1.8 }}>
            هذا البند غير قابل للتحول بالذكاء الاصطناعي — لا تنطبق عليه خطة إطلاق، ويمكنكم الإرسال للاعتماد مباشرة.
          </div>
        </div>
      ) : (
      <div style={cardStyle}>
        <label style={labelStyle}>
          اختر مرحلة التنفيذ <span style={{ color: '#D23B45' }}>*</span>
        </label>
        <select
          value={draft?.execBatch || ''}
          onChange={(e) => s.selectExecBatch(e.target.value)}
          style={inputStyle}
        >
          <option value="">اختر المرحلة…</option>
          {m.batchOptions.map((b) => (
            <option key={b.name} value={b.name}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      )}
    </div>
  );
}

// F-OPS — العمليات والدعم المؤسسي: حصر قائمة العمليات (single-step form).
// أولوية الاختيار تُحسب وفق مصفوفة العمليات بعد اعتمادها.

// ---------------------------------------------------------------------------
// Repeatable per-نشاط sections: the child unit of every stream (نشاط in
// ops/strategy, خدمة فرعية in services) carries its OWN full details —
// القطاع/الإدارة/القسم، الأتمتة، المصفوفة/أولوية التحول والملاحظات.
// «إضافة نشاط» sits below all of it and appends another complete section.
function ActivitySections({ vm, stream, subOptions }: { vm: VM; stream: 'ops' | 'strategy' | 'services'; subOptions?: string[] | null }) {
  const s = vm.store;
  const m = vm.modal;
  const draftActs = m.draft?.activities;
  const acts: ActivityDetail[] = draftActs && draftActs.length ? draftActs : [{ name: '' }];
  const setActs = (arr: ActivityDetail[]) => s.setDraftField('activities' as never, arr as never);
  React.useEffect(() => {
    if (!draftActs || !draftActs.length) setActs([{ name: '' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lastRef = React.useRef<HTMLDivElement>(null);
  const scrollPending = React.useRef(false);
  React.useEffect(() => {
    if (scrollPending.current) {
      scrollPending.current = false;
      lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [acts.length]);
  const upd = (idx: number, patch: Partial<ActivityDetail>) => setActs(acts.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const unit = stream === 'services' ? 'الخدمة الفرعية' : stream === 'ops' ? 'العملية الفرعية' : 'النشاط';

  const reqOn = (vm.modal.reqHighlight || 0) > 0;
  const field = (label: string, node: React.ReactNode, req = true, bad = false) => (
    <div style={{ marginBottom: 14 }} data-invalid={bad ? '1' : undefined}>
      <label style={labelStyle}>{label} {req && <span style={{ color: '#D23B45' }}>*</span>}</label>
      {node}
      {bad && <div style={{ fontSize: 11.5, color: '#D23B45', fontWeight: 700, marginTop: 5 }}>هذا الحقل مطلوب</div>}
    </div>
  );
  const txtA = (i: number, a: ActivityDetail, label: string, key: keyof ActivityDetail, ph?: string) => {
    const bad = reqOn && isEmptyVal(a[key]);
    return field(
      label,
      <input value={String(a[key] ?? '')} onChange={(e) => upd(i, { [key]: arabicOnly(e.target.value) } as Partial<ActivityDetail>)} placeholder={ph} style={{ ...inputStyle, ...(bad ? INVALID_STYLE : {}) }} />,
      true,
      bad
    );
  };
  const selA = (i: number, a: ActivityDetail, label: string, key: keyof ActivityDetail, opts: string[]) => {
    const bad = reqOn && isEmptyVal(a[key]);
    return field(
      label,
      <select value={String(a[key] ?? '')} onChange={(e) => upd(i, { [key]: e.target.value } as Partial<ActivityDetail>)} style={{ ...inputStyle, ...(bad ? INVALID_STYLE : {}) }}>
        <option value="">اختر…</option>
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>,
      true,
      bad
    );
  };
  const yesNoA = (i: number, a: ActivityDetail, label: string, key: keyof ActivityDetail) =>
    field(
      label,
      <div style={{ display: 'flex', gap: 10, ...(reqOn && isEmptyVal(a[key]) ? { outline: '2px solid rgba(210,59,69,.35)', outlineOffset: 3, borderRadius: 12 } : {}) }}>
        {['نعم', 'لا'].map((opt) => {
          const active = String(a[key] ?? '') === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => upd(i, { [key]: opt } as Partial<ActivityDetail>)}
              style={{ flex: 1, border: '1px solid ' + (active ? '#2563EB' : '#DCE3EE'), background: active ? '#EAF1FE' : '#fff', color: active ? '#1D4ED8' : '#54627B', borderRadius: 11, padding: '11px 13px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {opt}
            </button>
          );
        })}
      </div>,
      true,
      reqOn && isEmptyVal(a[key])
    );
  const derivedPill = (label: string, on: boolean, text: string, colors?: { c: string; bg: string }) =>
    field(
      label,
      on ? (
        <div style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: colors?.bg || '#EAF1FE', color: colors?.c || '#1D4ED8', borderRadius: 999, padding: '8px 16px', fontSize: 13.5, fontWeight: 800 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors?.c || '#1D4ED8', flex: 'none' }} />
            {text}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: '#9AA6BC', background: '#F4F7FC', border: '1px dashed #D8DFEB', borderRadius: 11, padding: '11px 13px' }}>{text}</div>
      ),
      false
    );
  const derivedYesNo = (label: string, derived: string) =>
    field(
      label,
      <div style={{ display: 'flex', gap: 10 }}>
        {['نعم', 'لا'].map((opt) => {
          const active = derived === opt;
          return (
            <span key={opt} style={{ flex: 1, textAlign: 'center', border: '1px solid ' + (active ? '#2563EB' : '#E7ECF4'), background: active ? '#EAF1FE' : '#F7F9FD', color: active ? '#1D4ED8' : '#AAB4C6', borderRadius: 11, padding: '11px 13px', fontSize: 13.5, fontWeight: 800, cursor: 'default' }}>
              {opt}
            </span>
          );
        })}
      </div>,
      false
    );
  // a criterion switched off by «غير قابل للتحول» — shown, disabled, scored 0
  const blockedField = (label: string) =>
    field(
      label,
      <div style={{ fontSize: 12.5, color: '#9AA6BC', background: '#F4F7FC', border: '1px dashed #D8DFEB', borderRadius: 11, padding: '11px 13px', minHeight: 44, display: 'flex', alignItems: 'center' }}>
        لا ينطبق — غير قابل للتحول (يُحتسب صفراً)
      </div>,
      false
    );
  const scale = ['1', '2', '3', '4', '5'];

  return (
    <>
      {acts.map((a, i) => (
        <div key={i} ref={i === acts.length - 1 ? lastRef : undefined} style={{ ...cardStyle, scrollMarginTop: 90, border: '1px solid #D9E4FD' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2D49' }}>{unit} {i + 1}</div>
            {acts.length > 1 && (
              <button
                type="button"
                onClick={() => setActs(acts.filter((_, j) => j !== i))}
                title={'حذف ' + unit}
                style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #F3D4D7', background: '#FDF6F6', color: '#C0303B', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" size={14} color="#C0303B" />
              </button>
            )}
          </div>

          {stream === 'services' ? (
            subOptions ? (
              field(
                'الخدمة الفرعية',
                <select value={a.name || ''} onChange={(e) => upd(i, { name: e.target.value })} style={inputStyle}>
                  <option value="">اختر الخدمة الفرعية…</option>
                  {(a.name && !subOptions.includes(a.name) ? [a.name, ...subOptions] : subOptions).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )
            ) : (
              txtA(i, a, 'الخدمة الفرعية', 'name', 'اسم الخدمة الفرعية')
            )
          ) : (
            txtA(i, a, 'اسم ' + unit, 'name', stream === 'ops' ? 'اسم العملية الفرعية' : 'اسم النشاط')
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {txtA(i, a, 'القطاع المعني', 'sector')}
            {txtA(i, a, 'الإدارة المعنية', 'dept')}
            {txtA(i, a, 'القسم المعني', 'section')}
          </div>

          {stream === 'ops' && (
            <>
              {/* حقول نموذج حصر العمليات المعتمد — قوائم منسدلة، والنسبة شريط تمرير */}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>الأتمتة</div>
              {selA(i, a, 'هل النشاط/ العملية مؤتمتة؟', 'isAutomated', OPS_AUTOMATED_OPTIONS)}
              {(a.isAutomated === 'نعم' || a.isAutomated === 'جزئياً') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {field('ما هو نظام الأتمتة؟', <input value={a.automationSystem || ''} onChange={(e) => upd(i, { automationSystem: e.target.value })} style={inputStyle} />)}
                  {field(
                    'ما هي نسبة الأتمتة؟',
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
                      <input type="range" min={0} max={100} step={5} value={a.automationPct ?? 0} onChange={(e) => upd(i, { automationPct: Number(e.target.value) })} style={{ flex: 1, accentColor: '#2563EB' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', minWidth: 42, textAlign: 'left' }}>{a.automationPct ?? 0}%</span>
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>التقييم</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                {selA(i, a, 'كثافة النشاط/ العملية', 'usageIntensity', OPS_INTENSITY_OPTIONS)}
                {selA(i, a, 'الجاهزية للتحول للذكاء الاصطناعي المساعد', 'readinessLevel', OPS_READINESS_OPTIONS)}
                {selA(i, a, 'مستوى الأثر المتوقع من التحول', 'impactScore', OPS_LEVEL_OPTIONS)}
                {selA(i, a, 'مستوى التعقيد', 'complexity', OPS_LEVEL_OPTIONS)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>التحول للذكاء الاصطناعي المساعد</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                {selA(i, a, 'القابلية للتحول للذكاء الاصطناعي المساعد', 'transformScore', OPS_TRANSFORM_OPTIONS)}
                {selA(i, a, 'مخاطر التحول للذكاء الاصطناعي المساعد', 'riskLevel', OPS_RISK_OPTIONS)}
                {selA(i, a, 'أولوية التحول للذكاء الاصطناعي المساعد', 'transformPriority', OPS_PRIORITY_OPTIONS)}
                {/* فترة التحويل تتبع الأولوية: تُفعَّل لمنخفضة/متوسطة/مرتفعة
                    وتُعطَّل عند «ليست ذات أولوية» أو قبل اختيار الأولوية */}
                {!a.transformPriority || a.transformPriority === OPS_NO_PRIORITY
                  ? field(
                      'فترة التحويل للذكاء الاصطناعي المساعد',
                      <div style={{ fontSize: 12.5, color: '#9AA6BC', background: '#F4F7FC', border: '1px dashed #D8DFEB', borderRadius: 11, padding: '11px 13px', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                        {a.transformPriority === OPS_NO_PRIORITY ? 'لا ينطبق — ليست ذات أولوية' : 'تُفعَّل بعد اختيار أولوية التحول'}
                      </div>,
                      false
                    )
                  : selA(i, a, 'فترة التحويل للذكاء الاصطناعي المساعد', 'transformPeriod', opsPeriodOptions())}
              </div>
            </>
          )}

          {stream === 'strategy' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>الأتمتة</div>
              {selAutomationLevel(i, a, upd, field)}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>التقييم</div>
              {/* approved order (RTL: 1 top-right → 6): الأهمية، كثافة الاستخدام،
                  وضوح المخرجات، قابلية التحول، الجاهزية، الأثر — the last two are
                  blocked and counted as 0 when قابلية التحول = «غير قابل» */}
              {(() => {
                const blocked = isStgBlocked(a.transformScore);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                    {selA(i, a, 'مستوى الأهمية', 'importance', scale)}
                    {selA(i, a, 'كثافة الاستخدام', 'usageIntensity', scale)}
                    {selA(i, a, 'وضوح المخرجات وقابليتها للمراجعة', 'outputClarity', scale)}
                    {field(
                      'قابلية التحول',
                      <select
                        style={reqOn && isEmptyVal(a.transformScore) ? { ...inputStyle, ...INVALID_STYLE } : inputStyle}
                        value={a.transformScore || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          // «غير قابل» blocks الجاهزية والأثر — clear any stale values
                          upd(i, isStgBlocked(v) ? { transformScore: v, readinessLevel: '', impactScore: '' } : { transformScore: v });
                        }}
                      >
                        <option value="">اختر…</option>
                        {STG_TRANSFORM_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>,
                      true,
                      reqOn && isEmptyVal(a.transformScore)
                    )}
                    {blocked
                      ? blockedField('مستوى الجاهزية')
                      : selA(i, a, 'مستوى الجاهزية', 'readinessLevel', scale)}
                    {blocked
                      ? blockedField('مستوى الأثر المتوقع من التحول')
                      : selA(i, a, 'مستوى الأثر المتوقع من التحول', 'impactScore', scale)}
                  </div>
                );
              })()}
              {selA(i, a, 'مستوى المخاطر', 'riskLevel', ['منخفض', 'متوسط', 'عالي'])}
              {(() => {
                const calc = stgPriority(a);
                const cat = calc?.cat || '';
                const c = cat === 'أولوية عالية' ? '#0B8A4B' : cat === 'أولوية متوسطة' ? '#B45309' : '#C0303B';
                const bg = cat === 'أولوية عالية' ? '#EAF7F0' : cat === 'أولوية متوسطة' ? '#FFF3DE' : '#FDECEA';
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {derivedPill('أولوية الاختيار', !!calc, calc ? cat + ' · ' + calc.total + '/30' : 'تُحسب تلقائياً بعد استكمال التقييمات الستة ومستوى المخاطر', calc ? { c, bg } : undefined)}
                    {derivedYesNo('أولوية التحول', activityTransformYes('strategy', a))}
                  </div>
                );
              })()}
            </>
          )}

          {stream === 'services' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49', margin: '4px 0 12px' }}>مصفوفة أولوية الاختيار</div>
              {selA(i, a, 'كثافة الاستخدام', 'usageIntensity', ['منخفضة', 'متوسطة', 'مرتفعة'])}
              {selA(i, a, 'مستوى التعقيد', 'complexity', ['منخفض', 'متوسط', 'مرتفع'])}
              {selA(i, a, 'مستوى الجاهزية', 'readinessLevel', ['منخفض', 'متوسط', 'مرتفع'])}
              {(() => {
                const pr = svcPriority(a.usageIntensity, a.complexity, a.readinessLevel);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {derivedPill('أولوية الاختيار', !!pr, pr ? 'الأولوية ' + pr : 'تُحسب تلقائياً بعد اختيار كثافة الاستخدام ومستوى التعقيد ومستوى الجاهزية')}
                    {derivedYesNo('أولوية التحول', activityTransformYes('services', a))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      ))}

      <div style={{ margin: '2px 0 16px' }}>
        <button
          type="button"
          onClick={() => {
            scrollPending.current = true;
            setActs([...acts, { name: '' }]);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EAF0FE', border: '1px solid #D9E4FD', borderRadius: 11, padding: '10px 18px', fontSize: 13, color: '#2563EB', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Icon d="M12 5v14M5 12h14" size={13} color="#2563EB" />
          إضافة {unit === 'النشاط' ? 'نشاط' : unit === 'العملية الفرعية' ? 'عملية فرعية' : 'خدمة فرعية'}
        </button>
      </div>
    </>
  );
}

// مستوى الأتمتة with the confirmed rules: كلياً = 100% locked، جزئياً ≤ 95%،
// غير مؤتمتة hides نظام/نسبة الأتمتة entirely
function selAutomationLevel(
  i: number,
  a: ActivityDetail,
  upd: (idx: number, patch: Partial<ActivityDetail>) => void,
  field: (label: string, node: React.ReactNode, req?: boolean) => React.ReactNode
) {
  const lvl = a.automationLevel || '';
  const full = lvl === 'مؤتمتة كلياً';
  const partial = lvl === 'مؤتمتة جزئياً';
  const pct = full ? 100 : Math.min(95, a.automationPct ?? 0);
  return (
    <>
      {field(
        'مستوى الأتمتة',
        <select
          value={lvl}
          onChange={(e) => {
            const v = e.target.value;
            upd(i, {
              automationLevel: v,
              automationPct: v === 'مؤتمتة كلياً' ? 100 : v === 'غير مؤتمتة' ? undefined : Math.min(95, a.automationPct ?? 0),
              automationSystem: v === 'غير مؤتمتة' ? undefined : a.automationSystem,
            });
          }}
          style={inputStyle}
        >
          <option value="">اختر…</option>
          {['مؤتمتة كلياً', 'مؤتمتة جزئياً', 'غير مؤتمتة'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
      {(full || partial) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field(
            'ما هي نسبة الأتمتة؟',
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
              <input
                type="range"
                min={0}
                max={full ? 100 : 95}
                step={5}
                disabled={full}
                value={pct}
                onChange={(e) => upd(i, { automationPct: Math.min(full ? 100 : 95, Number(e.target.value)) })}
                style={{ flex: 1, accentColor: '#2563EB', opacity: full ? 0.7 : 1 }}
              />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', minWidth: 42, textAlign: 'left' }}>{pct}%</span>
            </div>
          )}
          {field('ما هو نظام الأتمتة؟', <input value={a.automationSystem || ''} onChange={(e) => upd(i, { automationSystem: e.target.value })} style={inputStyle} />)}
        </div>
      )}
    </>
  );
}

// F-OPS — العمليات والدعم المؤسسي: header + one full section per نشاط.
function FOps({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const sel = (label: string, key: string, opts: string[], req = true) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label} {req && <span style={{ color: '#D23B45' }}>*</span>}</label>
      <select value={gv(key)} onChange={(e) => setField(key, e.target.value)} style={inputStyle}>
        <option value="">اختر…</option>
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
  return (
    <div>
      <div style={cardStyle}>
        {sel('التصنيف', 'opType', [OPS_SPECIAL_OPTYPE, SUPPORT_OPTYPE])}
        {gv('opType') === SUPPORT_OPTYPE && sel('نوع عملية الدعم المؤسسي (اختياري)', 'supportFn', SUPPORT_FUNCTIONS, false)}
        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>العملية الرئيسية <span style={{ color: '#D23B45' }}>*</span></label>
          <input value={gv('title')} onChange={(e) => setField('title', arabicOnly(e.target.value))} placeholder="اسم العملية الرئيسية" style={inputStyle} />
        </div>
      </div>
      {/* كل نشاط فرعي قسم كامل بتفاصيله — القطاع والأتمتة وأولوية التحول والملاحظات */}
      <ActivitySections vm={vm} stream="ops" />
    </div>
  );
}

// F-TASK — العمل الحكومي الاستراتيجي: header + one full section per نشاط.
function FTask({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  const m = vm.modal;
  return (
    <div>
      <div style={cardStyle}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>المحور <span style={{ color: '#D23B45' }}>*</span></label>
          <select value={gv('axis')} onChange={(e) => setField('axis', e.target.value)} style={inputStyle}>
            <option value="">اختر…</option>
            {m.axesOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>المهمة <span style={{ color: '#D23B45' }}>*</span></label>
          <input value={gv('title')} onChange={(e) => setField('title', arabicOnly(e.target.value))} placeholder="اسم المهمة" style={inputStyle} />
        </div>
      </div>
      {/* كل نشاط قسم كامل بتفاصيله — القطاع والأتمتة والتقييم وأولوية التحول */}
      <ActivitySections vm={vm} stream="strategy" />
    </div>
  );
}

// خيار الإدخال اليدوي داخل قائمة الخدمات — للخدمات غير المدرجة في الدليل
const MANUAL_SVC = 'أخرى — إدخال يدوي';

// F-SERVICE — الخدمات الحكومية: الخدمة الرئيسية + one full section per خدمة فرعية.
function FService({
  vm,
  setField,
  gv,
}: {
  vm: VM;
  setField: (k: string, v: unknown) => void;
  gv: (k: string) => string;
}) {
  // دليل الخدمات مرتبط بجهة المستخدم — الخيارات تتغير بتغير الجهة، ولا تُعرض
  // خدمات جهة أخرى إطلاقاً. لا دليل للجهة ⇒ إدخال يدوي.
  const entServices = useSvcCatalog(vm.entityName);
  const catalog = entServices || {};
  const [manual, setManual] = React.useState(false);
  const mainVal = gv('title');
  const mainOpts = Object.keys(catalog);
  const subOpts = manual || !entServices ? null : catalog[mainVal] || [];
  const withCurrent = (opts: string[], cur: string) => (cur && !opts.includes(cur) ? [cur, ...opts] : opts);
  return (
    <div>
      <div style={cardStyle}>
        {/* الجهة الاتحادية — مصدر قائمة الخدمات. تأتي من جلسة المستخدم؛
            وفي النسخة التجريبية يمكن تبديلها لاستعراض دليل كل جهة. */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>الجهة الاتحادية</label>
          {process.env.NEXT_PUBLIC_DEMO_MODE === '1' ? (
            <select
              value={vm.entityName}
              onChange={(e) => {
                vm.store.setEntityName(e.target.value);
                setManual(false);
                setField('title', '');
                setField('activities', [{ name: '' }]);
              }}
              style={inputStyle}
            >
              {(svcCatalogEntities().includes(vm.entityName) ? svcCatalogEntities() : [vm.entityName, ...svcCatalogEntities()]).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input value={vm.entityName} disabled style={{ ...inputStyle, backgroundColor: '#F1F4F9', cursor: 'not-allowed' }} />
          )}
          <div style={{ fontSize: 11.5, color: '#8E9AB0', marginTop: 6 }}>
            قائمة الخدمات أدناه تتبع هذه الجهة فقط
          </div>
        </div>
        {manual ? (
          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>الخدمة <span style={{ color: '#D23B45' }}>*</span></label>
            <input value={mainVal} onChange={(e) => setField('title', arabicOnly(e.target.value))} placeholder="اسم الخدمة الرئيسية" style={inputStyle} />
            <button
              onClick={() => {
                setManual(false);
                setField('title', '');
                setField('activities', [{ name: '' }]);
              }}
              style={{ marginTop: 6, background: 'transparent', border: 'none', color: '#2563EB', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
            >
              العودة إلى دليل الخدمات
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>الخدمة <span style={{ color: '#D23B45' }}>*</span></label>
            <select
              value={mainVal}
              onChange={(e) => {
                if (e.target.value === MANUAL_SVC) {
                  setManual(true);
                  setField('title', '');
                } else {
                  setField('title', e.target.value);
                }
                // the sub-service sections depend on the main service — reset them
                setField('activities', [{ name: '' }]);
              }}
              style={inputStyle}
            >
              <option value="">اختر الخدمة الرئيسية…</option>
              {withCurrent(mainOpts, mainVal).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
              <option value={MANUAL_SVC}>{MANUAL_SVC}</option>
            </select>
            <div style={{ fontSize: 11.5, color: '#8E9AB0', marginTop: 6 }}>
              {entServices
                ? `القائمة وفق دليل خدمات ${vm.entityName}`
                : `لا توجد خدمات مسجلة لـ${vm.entityName} في دليل الخدمات — استخدم «أخرى — إدخال يدوي»`}
            </div>
          </div>
        )}
      </div>
      {/* كل خدمة فرعية قسم كامل بتفاصيله — القطاع والمصفوفة وأولوية التحول */}
      <ActivitySections vm={vm} stream="services" subOptions={subOpts} />
    </div>
  );
}


// ---------------------------------------------------------------------------
// STEP: BULK
function BulkStep({ vm }: { vm: VM }) {
  const s = vm.store;
  // فريق عمل المسار يرفع بالنيابة عن جهة — اختيار الجهة شرط قبل الرفع
  const teamBulk = s.role === 'path';
  const entityChosen = !teamBulk || !!s.ui.bulkEntity;
  return (
    <div>
      {teamBulk && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1F2D49', marginBottom: 8 }}>
            الجهة الاتحادية <span style={{ color: '#D23B45' }}>*</span>
          </label>
          <select
            value={s.ui.bulkEntity || ''}
            onChange={(e) => s.setBulkEntity(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #DCE3EE', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', color: '#16233F', backgroundColor: '#fff', outline: 'none' }}
          >
            <option value="">اختر الجهة…</option>
            {svcCatalogEntities().map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <div style={{ fontSize: 11.5, color: '#8E9AB0', marginTop: 6 }}>
            تُنسب كل مدخلات الملف لهذه الجهة — المكتمل منها يدخل قائمة المراجعة مباشرة والناقص يبقى مسودة لدى الجهة
          </div>
        </div>
      )}
      {/* upload — the primary action; no download step required */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1F2D49', marginBottom: 10 }}>
          رفع الملف
        </div>
        <label
          style={{
            display: 'block',
            border: '1.5px dashed #CDD8EA',
            background: '#FAFCFF',
            borderRadius: 12,
            padding: '30px 14px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              e.target.value = '';
              if (!entityChosen) return s.toast('اختر الجهة أولاً — تُنسب مدخلات الملف إليها');
              const buf = await f.arrayBuffer();
              s.importWorkplan(buf);
            }}
          />
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1F2D49', marginBottom: 6 }}>
            اضغط لاختيار الملف
          </div>
          <div style={{ fontSize: 11.5, color: '#9AA6BC', lineHeight: 1.7 }}>
            ملف Excel بصيغة .xlsx — ستُقرأ جميع البيانات، وأي نقص يُبرز على البطاقة في المراجعة.
          </div>
        </label>
      </div>

      {/* optional: download the stream template (same columns as the entry form) */}
      <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        ليس لديك النموذج؟
        <button
          onClick={() => {
            const path = vm.store.ui.draft?.path || vm.store.myPath;
            const opts: Record<string, string[]> = { ...(STREAM_FIELD_OPTIONS[path] || {}) };
            // مسار العمليات: نموذج حصر العمليات المعتمد بورقتيه — التصنيف تحدده الورقة
            if (path === 'ops') {
              return downloadOpsTemplate(
                (teamBulk ? s.ui.bulkEntity : vm.entityName) || '',
                (STREAM_FIELDS.ops || []).filter((f) => f.key !== 'opType'),
                opts
              );
            }
            // services: الخدمة/الخدمة الفرعية dropdowns from the entity's catalog
            if (path === 'services') {
              // رفع الفريق بالنيابة: دليل خدمات الجهة المختارة لا جهة الفريق
              const cat = svcCatalogFor((teamBulk ? s.ui.bulkEntity : vm.entityName) || '');
              if (cat && Object.keys(cat).length) {
                opts.title = Object.keys(cat);
                opts.subService = Array.from(new Set(Object.values(cat).flat()));
              }
            }
            downloadItemsTemplate(pathById(path).name, STREAM_FIELDS[path] || [], opts, STREAM_FIELD_SAMPLE[path] || {});
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563EB', fontWeight: 800, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
        >
          <Icon d={IC.download} size={15} color="#2563EB" />
          تنزيل نموذج المسار (Excel)
        </button>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: BULK REVIEW
function BulkReviewStep({ vm }: { vm: VM }) {
  const m = vm.modal;
  const s = vm.store;

  const tile = (count: number, label: string, color: string, bg: string) => (
    <div style={{ flex: 1, background: bg, borderRadius: 14, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'linear-gradient(135deg,#2E74EE,#1F5FE0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon d={IC.settings} size={21} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>مراجعة الصفوف المستوردة</div>
          <div style={{ fontSize: 11.5, color: '#9AA6BC' }}>تحقّق من الصفوف المقروءة من الملف قبل حفظها كمسودات</div>
        </div>
      </div>

      {m.bulkLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 0' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid #E1E7F1',
              borderTopColor: '#2563EB',
              animation: 'spin .8s linear infinite',
            }}
          />
          <div style={{ fontSize: 13, color: '#54627B', fontWeight: 700 }}>
            جارٍ قراءة الملف وتجهيز المراجعة…
          </div>
        </div>
      )}

      {m.bulkLoaded && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {tile(m.bulkReadyCount, 'جاهز', '#0B8A4B', '#E3F6EC')}
            {tile(m.bulkReviewCount, 'بيانات ناقصة', '#B45309', '#FFF3DE')}
            {tile(m.bulkErrorCount, 'يوجد خطأ', '#D23B45', '#FCEEEF')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {m.bulkRows.map((b, i) => {
              const st = BULK_VERDICT_STYLE[b._v || ''] || { bg: '#F1F4F9', c: '#54627B' };
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#fff',
                    border: '1px solid #E7ECF4',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                        {b.title || 'بدون عنوان'}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#54627B',
                          background: '#F1F4F9',
                          borderRadius: 999,
                          padding: '2px 8px',
                          flex: 'none',
                        }}
                      >
                        {typeLabel(b.type || 'project')}
                      </span>
                      {b.path && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#54627B',
                            background: '#F1F4F9',
                            borderRadius: 999,
                            padding: '2px 8px',
                            flex: 'none',
                          }}
                        >
                          {pathById(b.path).name}
                        </span>
                      )}
                    </div>
                    {b._v === 'بيانات ناقصة' && b.missing?.length ? (
                      /* الحقول الناقصة نقاطاً مجمّعة بحسب العملية/الخدمة الفرعية
                         بدل فقرة واحدة طويلة يصعب تتبعها */
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#B45309' }}>الحقول الناقصة:</div>
                        <ul style={{ margin: '4px 0 0', paddingRight: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {(() => {
                            const groups = new Map<string, string[]>();
                            for (const m of b.missing || []) {
                              const match = /^(.*?)\s*\((.+)\)$/.exec(m);
                              const g = match ? match[2] : 'بيانات العملية';
                              const f = match ? match[1] : m;
                              if (!groups.has(g)) groups.set(g, []);
                              groups.get(g)!.push(f);
                            }
                            return Array.from(groups.entries()).map(([g, fields]) => (
                              <li key={g} style={{ fontSize: 11.5, color: '#54627B', lineHeight: 1.8 }}>
                                <span style={{ fontWeight: 800, color: '#33415C' }}>{g}:</span> {fields.join('، ')}
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                    ) : (
                      b._note && <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 2 }}>{b._note}</div>
                    )}
                  </div>
                  <span
                    style={{
                      background: st.bg,
                      color: st.c,
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      flex: 'none',
                    }}
                  >
                    {b._v}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: '#F4F7FC',
              border: '1px solid #E1E7F1',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 12,
              color: '#54627B',
              lineHeight: 1.7,
              marginBottom: 14,
            }}
          >
            عند الحفظ: تُحفظ جميع الصفوف كمسودات — والصفوف ذات البيانات الناقصة تُميَّز بـ«بيانات ناقصة» لاستكمالها. لا تُرسل أي مدخلات لفريق عمل المسار إلا بعد اختيارها وتأكيد «إرسال للاعتماد». الصفوف التي بها أخطاء لن تُستورد.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => s.mBack()}
              style={{
                background: '#fff',
                border: '1px solid #DCE3EE',
                borderRadius: 12,
                padding: '12px 20px',
                color: '#54627B',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              رجوع
            </button>
            <button
              onClick={() => s.submitBulk()}
              style={{
                background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
                border: 'none',
                borderRadius: 11,
                padding: '12px 20px',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              الحفظ
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP: DONE
function DoneStep({ vm }: { vm: VM }) {
  const s = vm.store;
  return (
    <div style={{ textAlign: 'center', padding: '30px 10px' }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#E3F6EC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
        }}
      >
        <Icon d={IC.check} size={34} color="#0B8A4B" strokeWidth={3} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#13213C', marginBottom: 8 }}>تم بنجاح</div>
      <p style={{ fontSize: 13, color: '#8A97AD', lineHeight: 1.8, maxWidth: 340, margin: '0 auto 24px' }}>
        تمت الإضافة والإرسال لاعتماد فريق عمل المسار.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={() => s.openCreate()}
          style={{
            background: '#EAF0FE',
            border: '1px solid #D9E4FD',
            borderRadius: 11,
            padding: '12px 20px',
            color: '#2563EB',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          إضافة المزيد
        </button>
        <button
          onClick={() => s.closeModal()}
          style={{
            background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
            border: 'none',
            borderRadius: 11,
            padding: '12px 20px',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          العودة للوحة التحكم
        </button>
      </div>
    </div>
  );
}
