// ============================================================================
// واجهة نسخة وزارة شؤون مجلس الوزراء — مستقلة عن واجهة الجهات الاتحادية
// ============================================================================
'use client';
import React, { useMemo, useRef, useState, type CSSProperties } from 'react';
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

// ---- أنماط مشتركة ----------------------------------------------------------
const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #E7ECF4',
  borderRadius: 18,
  boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
};
const label: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#33415C', marginBottom: 6 };
const input: CSSProperties = {
  width: '100%',
  border: '1px solid #DCE3EE',
  borderRadius: 11,
  padding: '11px 13px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#13213C',
  background: '#fff',
  outline: 'none',
};
const invalid: CSSProperties = { borderColor: '#E4808A', background: '#FFF7F7' };
const th: CSSProperties = {
  textAlign: 'right',
  padding: '10px 12px',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#8A97AD',
  borderBottom: '1px solid #EEF1F7',
  whiteSpace: 'nowrap',
};
const td: CSSProperties = { padding: '11px 12px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA' };
const btnPrimary: CSSProperties = {
  background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
  color: '#fff',
  border: 'none',
  borderRadius: 11,
  padding: '11px 20px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const btnGhost: CSSProperties = {
  background: '#fff',
  color: '#33415C',
  border: '1px solid #DCE3EE',
  borderRadius: 11,
  padding: '11px 18px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const btnDanger: CSSProperties = {
  background: '#FDF6F6',
  color: '#C0303B',
  border: '1px solid #F3D4D7',
  borderRadius: 11,
  padding: '11px 16px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const Chip = ({ t, c, bg }: { t: string; c: string; bg: string }) => (
  <span style={{ fontSize: 11, fontWeight: 800, color: c, background: bg, borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap' }}>
    {t}
  </span>
);

// ============================================================================
export function MocaWorkspace() {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const unit = mocaUnitById(s.unitId);
  const list = useMemo(() => mocaVisibleEntries(s), [s]);

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2F9', direction: 'rtl' }}>
      <TopBar />
      <div style={{ maxWidth: 1420, margin: '0 auto', padding: '22px 24px 60px' }}>
        {s.view === 'form' ? (
          <EntryForm />
        ) : s.view === 'bulk' ? (
          <BulkPanel />
        ) : (
          <>
            <Kpis list={list} />
            <Filters />
            <EntriesTable list={list} />
          </>
        )}
      </div>
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
            zIndex: 200,
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
      {/* شارة تعريف النسخة */}
      <div style={{ position: 'fixed', bottom: 14, right: 16, fontSize: 10.5, color: '#93A1B8', fontWeight: 700 }}>
        {isCoord ? mocaScopeLabel(unit.id, s.unitSector) : MOCA_MINISTRY}
      </div>
    </div>
  );
}

// ---- الشريط العلوي ---------------------------------------------------------
function TopBar() {
  const s = useMoca();
  const unit = mocaUnitById(s.unitId);
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #E4EAF3' }}>
      <div style={{ maxWidth: 1420, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: '#13213C' }}>حصر المهام والعمليات</div>
          <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 600 }}>{MOCA_MINISTRY}</div>
        </div>
        {/* مبدّل الدور — للعرض التجريبي */}
        <div style={{ display: 'flex', gap: 4, background: '#F1F4F9', borderRadius: 12, padding: 4 }}>
          {MOCA_ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => s.setRole(r.key)}
              style={{
                border: 'none',
                borderRadius: 9,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: s.role === r.key ? '#fff' : 'transparent',
                color: s.role === r.key ? '#1D4ED8' : '#64748B',
                boxShadow: s.role === r.key ? '0 2px 8px -3px rgba(16,36,79,.25)' : 'none',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        {/* نطاق المنسق: الجهة والقطاع */}
        {s.role === 'coord' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={s.unitId}
              onChange={(e) => s.setScope(e.target.value, '')}
              style={{ ...input, width: 'auto', minWidth: 220, cursor: 'pointer', padding: '9px 12px' }}
            >
              {MOCA_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {!!unit.sectors?.length && (
              <select
                value={s.unitSector}
                onChange={(e) => s.setScope(s.unitId, e.target.value)}
                style={{ ...input, width: 'auto', minWidth: 200, cursor: 'pointer', padding: '9px 12px' }}
              >
                {unit.sectors.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 16 }}>
      {tiles.map((t) => (
        <div key={t.t} style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#13213C' }}>{t.v}</div>
          <div style={{ fontSize: 11.5, color: '#7C8AA3', fontWeight: 700, marginTop: 2 }}>{t.t}</div>
        </div>
      ))}
    </div>
  );
}

// ---- الفلاتر ---------------------------------------------------------------
function Filters() {
  const s = useMoca();
  const sel: CSSProperties = { ...input, width: 'auto', minWidth: 170, cursor: 'pointer', padding: '9px 12px', fontSize: 12.5 };
  return (
    <div style={{ ...card, padding: 14, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        value={s.search}
        onChange={(e) => s.setFilter('search', e.target.value)}
        placeholder="البحث في المهام والعمليات…"
        style={{ ...input, width: 'auto', flex: 1, minWidth: 200, padding: '9px 12px', fontSize: 12.5 }}
      />
      {s.role === 'committee' && (
        <select value={s.fUnit} onChange={(e) => s.setFilter('fUnit', e.target.value)} style={sel}>
          <option value="all">الجهة أو المكتب: الكل</option>
          {MOCA_UNITS.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      )}
      <select value={s.fTransform} onChange={(e) => s.setFilter('fTransform', e.target.value)} style={sel}>
        <option value="all">القابلية للتحول: الكل</option>
        {MOCA_TRANSFORMABILITY.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <select value={s.fStatus} onChange={(e) => s.setFilter('fStatus', e.target.value)} style={sel}>
        <option value="all">الحالة: الكل</option>
        <option value="draft">مسودة</option>
        <option value="pending">قيد اعتماد اللجنة الوطنية</option>
        <option value="approved">معتمد</option>
        <option value="info">للتعديل</option>
        <option value="rejected">تم الرفض</option>
      </select>
    </div>
  );
}

// ---- الجدول ----------------------------------------------------------------
function EntriesTable({ list }: { list: MocaEntry[] }) {
  const s = useMoca();
  const isCoord = s.role === 'coord';
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const draftIds = list.filter((e) => e.wf === 'draft').map((e) => e.id);

  return (
    <div style={card}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid #EEF1F7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#13213C', flex: 1 }}>
          {isCoord ? 'مهام وعمليات ' + mocaScopeLabel(s.unitId, s.unitSector) : 'المدخلات الواردة من جهات الوزارة'}
        </div>
        {isCoord && (
          <>
            {sel.length > 0 && (
              <button
                onClick={() => {
                  s.submitMany(sel);
                  setSel([]);
                }}
                style={btnPrimary}
              >
                إرسال المحدد ({sel.length})
              </button>
            )}
            {draftIds.length > 0 && (
              <button onClick={() => { s.submitMany(draftIds); setSel([]); }} style={sel.length ? btnGhost : btnPrimary}>
                إرسال الكل ({draftIds.length})
              </button>
            )}
            <button onClick={() => s.openBulk()} style={{ ...btnGhost, background: '#0B8A4B', color: '#fff', border: 'none' }}>
              رفع ملف Excel
            </button>
            <button onClick={() => s.openForm()} style={btnPrimary}>+ إضافة مدخل</button>
          </>
        )}
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '46px 18px', textAlign: 'center', color: '#9AA6BC', fontSize: 13 }}>
          {isCoord ? 'لا توجد مدخلات بعد — ابدأ بـ«إضافة مدخل» أو ارفع نموذج الحصر.' : 'لا توجد مدخلات مرسلة للاعتماد بعد.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
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
                <th style={th}>الإجراءات</th>
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
                    <td style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(e.mainProcess || '')}>
                      {String(e.mainProcess || '—')}
                    </td>
                    <td style={{ ...td, maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(e.subProcess || '')}>
                      {String(e.subProcess || '—')}
                    </td>
                    {!isCoord && <td style={td}>{mocaScopeLabel(e.unitId, e.unitSector)}</td>}
                    <td style={td}>{String(e.specialization || '—')}</td>
                    <td style={td}>{String(e.transformability || '—')}</td>
                    <td style={td}>
                      {band && pr ? <Chip t={pr.band} c={band.color} bg={band.bg} /> : '—'}
                    </td>
                    <td style={td}><Chip t={st.label} c={st.color} bg={st.bg} /></td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={() => s.openDetail(e.id)} style={{ ...btnGhost, padding: '7px 12px', fontSize: 11.5, background: '#EAF0FE', color: '#2563EB', border: 'none' }}>
                          عرض
                        </button>
                        {isCoord && e.wf !== 'approved' && (
                          <>
                            <button onClick={() => s.openForm(e.id)} style={{ ...btnGhost, padding: '7px 12px', fontSize: 11.5 }}>تعديل</button>
                            {e.wf === 'draft' && (
                              <button onClick={() => s.submitEntry(e.id)} style={{ ...btnGhost, padding: '7px 12px', fontSize: 11.5, background: '#EAF1FE', color: '#1D4ED8', borderColor: '#C9DBFB' }}>
                                إرسال
                              </button>
                            )}
                            <button onClick={() => s.removeEntry(e.id)} style={{ ...btnDanger, padding: '7px 12px', fontSize: 11.5 }}>إزالة</button>
                          </>
                        )}
                        {!isCoord && e.wf === 'pending' && (
                          <>
                            <button onClick={() => s.approveEntry(e.id)} style={{ ...btnPrimary, padding: '7px 13px', fontSize: 11.5, background: 'linear-gradient(180deg,#0EA371,#0B8A4B)' }}>اعتماد</button>
                            <button onClick={() => s.openReturn(e.id, 'info')} style={{ ...btnGhost, padding: '7px 12px', fontSize: 11.5, background: '#FFF3DE', color: '#B45309', borderColor: '#F1DCBA' }}>إعادة للتعديل</button>
                            <button onClick={() => s.openReturn(e.id, 'reject')} style={{ ...btnDanger, padding: '7px 12px', fontSize: 11.5 }}>رفض</button>
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

// ---- نموذج الإدخال ---------------------------------------------------------
function EntryForm() {
  const s = useMoca();
  const d = s.draft;
  const hi = s.reqHighlight > 0;
  const missing = mocaMissing(d);

  const fieldNode = (f: MocaField) => {
    const blocked = blockedByTransformability(f.key, d);
    const v = String(d[f.key] ?? '');
    const bad = hi && !blocked && f.required && !v.trim();
    const st = { ...input, ...(bad ? invalid : {}), ...(blocked ? { background: '#F1F4F9', cursor: 'not-allowed' } : {}) };
    if (blocked) {
      return (
        <>
          <input value="غير مطلوب — العملية غير قابلة للتحول" disabled style={st} />
          <div style={{ fontSize: 11, color: '#8E9AB0', marginTop: 5 }}>يُحتسب صفراً في أولوية التحول</div>
        </>
      );
    }
    if (f.type === 'select') {
      return (
        <select value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={{ ...st, cursor: 'pointer' }}>
          <option value="">اختر…</option>
          {(f.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    if (f.type === 'longtext') {
      return <textarea value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={{ ...st, minHeight: 84, resize: 'vertical' }} />;
    }
    if (f.type === 'percent') {
      return (
        <input
          value={v}
          onChange={(e) => s.setDraft(f.key, e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
          placeholder="0 – 100"
          inputMode="decimal"
          style={st}
        />
      );
    }
    return <input value={v} onChange={(e) => s.setDraft(f.key, e.target.value)} style={st} />;
  };

  return (
    <div style={{ ...card, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>
            {s.editingId ? 'تعديل المدخل' : 'إضافة مهمة أو عملية فرعية'}
          </div>
          <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 600 }}>
            {mocaScopeLabel(s.unitId, s.unitSector)} — الحقول مطابقة لنموذج حصر المهام والعمليات
          </div>
        </div>
        <button onClick={() => s.closeForm()} style={btnGhost}>إلغاء</button>
      </div>

      {MOCA_GROUPS.map((g) => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1F5FE0', background: '#EEF4FF', borderRadius: 10, padding: '9px 14px', marginBottom: 14 }}>
            {g.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
            {MOCA_FIELDS.filter((f) => f.group === g.key).map((f) => (
              <div key={f.key} style={f.type === 'longtext' ? { gridColumn: '1 / -1' } : undefined}>
                <label style={label}>
                  {f.label} {f.required && <span style={{ color: '#D23B45' }}>*</span>}
                </label>
                {fieldNode(f)}
                {f.hint && <div style={{ fontSize: 11, color: '#8E9AB0', marginTop: 5 }}>{f.hint}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid #EEF1F7', paddingTop: 16, flexWrap: 'wrap' }}>
        <span style={{ flex: 1, fontSize: 12, color: missing.length ? '#B45309' : '#0B8A4B', fontWeight: 700 }}>
          {missing.length ? missing.length + ' حقل مطلوب غير مكتمل' : 'جميع الحقول المطلوبة مكتملة'}
        </span>
        <button onClick={() => s.saveDraft(false)} style={btnGhost}>حفظ كمسودة</button>
        <button onClick={() => s.saveDraft(true)} style={btnPrimary}>إرسال لاعتماد اللجنة الوطنية</button>
      </div>
    </div>
  );
}

// ---- الرفع بالجملة ---------------------------------------------------------
function BulkPanel() {
  const s = useMoca();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const ready = s.bulkRows.filter((r) => !r.missing.length).length;
  const short = s.bulkRows.length - ready;

  return (
    <div style={{ ...card, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>رفع نموذج حصر المهام والعمليات</div>
          <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 600 }}>{mocaScopeLabel(s.unitId, s.unitSector)}</div>
        </div>
        <button onClick={() => s.closeBulk()} style={btnGhost}>إلغاء</button>
      </div>

      <div style={{ background: '#EEF4FF', border: '1px solid #D7E4FB', color: '#28518F', borderRadius: 12, padding: '12px 15px', fontSize: 12.5, lineHeight: 1.9, marginBottom: 16 }}>
        نزّل النموذج، أكمل البيانات المطلوبة، ثم ارفع الملف. تُحفظ جميع الصفوف كمسودات — والصفوف الناقصة تُميَّز
        لاستكمالها قبل الإرسال لاعتماد اللجنة الوطنية.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => mocaDownloadTemplate(mocaScopeLabel(s.unitId, s.unitSector))} style={btnGhost}>
          تنزيل النموذج (Excel)
        </button>
        <button onClick={() => fileRef.current?.click()} style={btnPrimary} disabled={busy}>
          {busy ? 'جارٍ القراءة…' : 'اختيار الملف'}
        </button>
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
      </div>

      {s.bulkError && (
        <div style={{ background: '#FCEEEF', border: '1px solid #F3D4D7', color: '#C0303B', borderRadius: 12, padding: '12px 15px', fontSize: 12.5, fontWeight: 700 }}>
          {s.bulkError}
        </div>
      )}

      {s.bulkLoaded && !s.bulkError && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: '#E3F6EC', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 23, fontWeight: 800, color: '#0B8A4B' }}>{ready}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0B8A4B' }}>جاهز</div>
            </div>
            <div style={{ flex: 1, background: '#FFF3DE', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 23, fontWeight: 800, color: '#B45309' }}>{short}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B45309' }}>بيانات ناقصة</div>
            </div>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid #EEF1F7', borderRadius: 12, marginBottom: 16 }}>
            {s.bulkRows.map((r, i) => (
              <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid #F4F6FA', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: '#13213C' }}>
                  {String(r.data.subProcess || r.data.mainProcess || 'صف ' + (i + 1))}
                </span>
                {r.missing.length ? (
                  <span style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }} title={r.missing.join('، ')}>
                    ناقص: {r.missing.slice(0, 2).join('، ')}{r.missing.length > 2 ? '…' : ''}
                  </span>
                ) : (
                  <Chip t="جاهز" c="#0B8A4B" bg="#E3F6EC" />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => s.saveBulk()} style={btnPrimary}>الحفظ</button>
        </>
      )}
    </div>
  );
}

// ---- التفاصيل --------------------------------------------------------------
function DetailDrawer({ id }: { id: string }) {
  const s = useMoca();
  const e = s.entries.find((x) => x.id === id);
  if (!e) return null;
  const st = mocaStatusOf(e);
  const pr = mocaPriorityScore(e);
  return (
    <div
      onClick={() => s.openDetail(null)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(9,20,42,.45)', zIndex: 150, display: 'flex', justifyContent: 'flex-start' }}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{ width: 'min(680px,96vw)', height: '100%', background: '#F7F9FC', display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(4,14,34,.35)' }}
      >
        <div style={{ background: '#fff', borderBottom: '1px solid #E7ECF4', padding: '16px 22px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C' }}>{String(e.subProcess || e.mainProcess || '—')}</div>
            <div style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 600, marginTop: 3 }}>
              {mocaScopeLabel(e.unitId, e.unitSector)}
            </div>
          </div>
          <Chip t={st.label} c={st.color} bg={st.bg} />
          <button onClick={() => s.openDetail(null)} style={{ ...btnGhost, padding: '7px 12px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {e.ret && (
            <div
              style={{
                background: e.ret.type === 'reject' ? '#FDECEE' : '#FFF3DE',
                border: '1px solid ' + (e.ret.type === 'reject' ? '#F3D4D7' : '#F1DCBA'),
                borderRadius: 12,
                padding: '13px 16px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: e.ret.type === 'reject' ? '#C0303B' : '#B45309', marginBottom: 5 }}>
                {e.ret.type === 'reject' ? 'سبب الرفض من اللجنة الوطنية' : 'ملاحظات اللجنة الوطنية'}
              </div>
              <div style={{ fontSize: 12.5, color: '#33415C', lineHeight: 1.8 }}>{e.ret.note || '—'}</div>
            </div>
          )}
          {pr && (
            <div style={{ ...card, padding: '13px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#33415C', flex: 1 }}>أولوية التحول المحسوبة</span>
              <Chip t={pr.band} c={MOCA_BAND_STYLE[pr.band].color} bg={MOCA_BAND_STYLE[pr.band].bg} />
            </div>
          )}
          {MOCA_GROUPS.map((g) => (
            <div key={g.key} style={{ ...card, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1F5FE0', marginBottom: 12 }}>{g.label}</div>
              {MOCA_FIELDS.filter((f) => f.group === g.key).map((f) => (
                <div key={f.key} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #F4F6FA' }}>
                  <span style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 700, width: 220, flex: 'none' }}>{f.label}</span>
                  <span style={{ fontSize: 12.5, color: '#33415C', fontWeight: 600 }}>
                    {blockedByTransformability(f.key, e) ? '— (غير قابل للتحول)' : String(e[f.key] || '—')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderTop: '1px solid #E7ECF4', padding: '13px 20px', display: 'flex', gap: 10 }}>
          {s.role === 'committee' && e.wf === 'pending' && (
            <>
              <button onClick={() => s.approveEntry(e.id)} style={{ ...btnPrimary, flex: 1, background: 'linear-gradient(180deg,#0EA371,#0B8A4B)' }}>اعتماد</button>
              <button onClick={() => s.openReturn(e.id, 'info')} style={{ ...btnGhost, background: '#FFF3DE', color: '#B45309', borderColor: '#F1DCBA' }}>إعادة للتعديل</button>
              <button onClick={() => s.openReturn(e.id, 'reject')} style={btnDanger}>رفض</button>
            </>
          )}
          {s.role === 'coord' && e.wf !== 'approved' && (
            <>
              <button onClick={() => s.openForm(e.id)} style={{ ...btnPrimary, flex: 1 }}>تعديل المدخل</button>
              {e.wf === 'draft' && <button onClick={() => s.submitEntry(e.id)} style={btnGhost}>إرسال للاعتماد</button>}
              <button onClick={() => s.removeEntry(e.id)} style={btnDanger}>إزالة</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- نافذة الإعادة/الرفض ---------------------------------------------------
function ReturnDialog() {
  const s = useMoca();
  const t = s.returnTarget!;
  const [note, setNote] = useState('');
  const isReject = t.kind === 'reject';
  return (
    <Modal onClose={() => s.closeReturn()}>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C', marginBottom: 6 }}>
        {isReject ? 'رفض المدخل' : 'إعادة المدخل للتعديل'}
      </div>
      <div style={{ fontSize: 12.5, color: '#6B7A93', marginBottom: 14 }}>
        {isReject ? 'يُذكر سبب الرفض ويظهر للمنسق عند فتح التفاصيل.' : 'وضّح ما ينقص حتى يتمكن المنسق من استكماله.'}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={isReject ? 'سبب الرفض…' : 'الملاحظات المطلوبة…'}
        style={{ ...input, minHeight: 110, resize: 'vertical', marginBottom: 14 }}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => s.closeReturn()} style={btnGhost}>إلغاء</button>
        <button
          onClick={() => {
            if (!note.trim()) return s.showToast(isReject ? 'يرجى ذكر سبب الرفض' : 'يرجى كتابة الملاحظات');
            mocaApplyReturn(t.id, t.kind, note);
          }}
          style={isReject ? { ...btnPrimary, background: 'linear-gradient(180deg,#D6454F,#C0303B)' } : btnPrimary}
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
      <div style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C', marginBottom: 8 }}>{c.title}</div>
      <div style={{ fontSize: 12.5, color: '#54627B', lineHeight: 1.9, marginBottom: 18 }}>{c.body}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => s.setConfirm(null)} style={btnGhost}>إلغاء</button>
        <button onClick={c.onOk} style={c.danger ? { ...btnPrimary, background: 'linear-gradient(180deg,#D6454F,#C0303B)' } : btnPrimary}>
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(9,20,42,.5)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: 'min(520px,96vw)', padding: 22 }}>
        {children}
      </div>
    </div>
  );
}
