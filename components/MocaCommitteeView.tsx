'use client';
// ===========================================================================
// وزارة شؤون مجلس الوزراء داخل لوحة اللجنة الوطنية — الوزارة جهة ضمن قوائم
// الحصر ودفعات الإطلاق وحالات الاستخدام، واعتماد مدخلاتها وتوزيعاتها يتم هنا
// من اللجنة الوطنية مباشرة (منسقو الوزارة يرسلون، واللجنة تعتمد أو تعيد)
// ===========================================================================
import { Fragment, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useMoca, mocaApplyReturn, mocaApplyPlaceReturn } from '@/lib/mocaStore';
import {
  MOCA_BATCHES,
  MOCA_FIELDS,
  MOCA_MINISTRY,
  MOCA_UC_STATUS_STYLE,
  mocaStatusOf,
  mocaUnitById,
  type MocaEntry,
  type MocaUseCase,
} from '@/lib/moca';

const card: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 16 };
const th: CSSProperties = { textAlign: 'right', padding: '11px 15px', fontSize: 11.5, fontWeight: 700, color: '#8A97AD', borderBottom: '1px solid #EEF1F7', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '12px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA', verticalAlign: 'middle' };

const unitLabel = (e: { unitId: string; unitSector?: string }) =>
  mocaUnitById(e.unitId).name + (e.unitSector ? ' — ' + e.unitSector : '');

const txt = (v: unknown) => String(v ?? '').trim() || '—';

function Header({ title, pending, sub }: { title: string; pending?: number; sub?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>{title}</div>
        {!!pending && (
          <span style={{ background: '#FFF3DE', color: '#B45309', borderRadius: 999, padding: '4px 12px', fontSize: 11.5, fontWeight: 800 }}>بانتظار اعتماد اللجنة: {pending}</span>
        )}
      </div>
      {sub ? <div style={{ fontSize: 12, color: '#9AA6BC', marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

// أزرار الاعتماد والإجراءات — بنمط بقية لوحات المنصة
const btnApprove: CSSProperties = { background: 'linear-gradient(180deg,#0EA371,#0B8A4B)', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const btnAmber: CSSProperties = { background: '#FFF3DE', color: '#B45309', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const btnRed: CSSProperties = { background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const btnView: CSSProperties = { background: '#fff', border: '1px solid #DCE3EE', color: '#54627B', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };

// نافذة ملاحظات الإعادة/الرفض
function ReturnModal({ title, onSubmit, onClose }: { title: string; onSubmit: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(9,20,45,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 16, padding: 22 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#13213C', marginBottom: 10 }}>{title}</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="الملاحظات المطلوب معالجتها…" style={{ width: '100%', border: '1px solid #DCE3EE', borderRadius: 11, padding: '11px 13px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => note.trim() && onSubmit(note.trim())} style={{ ...btnApprove, background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', padding: '11px 20px', fontSize: 12.5 }}>إرسال</button>
          <button onClick={onClose} style={{ ...btnView, padding: '11px 20px', fontSize: 12.5 }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// تفاصيل المدخل كاملة — كل حقول نموذج الوزارة المعبأة
function EntryDetail({ e }: { e: MocaEntry }) {
  const rows = MOCA_FIELDS.map((f) => ({ label: f.label, v: String((e as Record<string, unknown>)[f.key] ?? '').trim() })).filter((r) => r.v);
  return (
    <div style={{ background: '#F7F9FD', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ fontSize: 12.5, color: '#33415C', lineHeight: 1.8 }}>
          <b style={{ color: '#54627B' }}>{r.label}:</b> {r.v}
        </div>
      ))}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: 34, textAlign: 'center', color: '#8A97AD', fontSize: 13 }}>{msg}</div>;
}

export function MocaCommitteeView({ mode }: { mode: 'inv' | 'batches' | 'usecases' }) {
  const hydrate = useMoca((s) => s.hydrate);
  const entries = useMoca((s) => s.entries);
  const useCases = useMoca((s) => s.useCases);
  const approveEntry = useMoca((s) => s.approveEntry);
  const approvePlacement = useMoca((s) => s.approvePlacement);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ret, setRet] = useState<{ id: string; kind: 'info' | 'reject'; place: boolean } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const retModal = ret && (
    <ReturnModal
      title={ret.kind === 'reject' ? 'رفض المدخل — الملاحظات' : 'إعادة للتعديل — الملاحظات'}
      onClose={() => setRet(null)}
      onSubmit={(note) => {
        if (ret.place) mocaApplyPlaceReturn(ret.id, ret.kind, note);
        else mocaApplyReturn(ret.id, ret.kind, note);
        setRet(null);
      }}
    />
  );

  // مسودات المنسقين داخل الوزارة تبقى خاصة — يظهر المُرسَل وما بعده فقط
  const visible = entries.filter((e) => e.wf !== 'draft');

  if (mode === 'inv') {
    const pending = visible.filter((e) => e.wf === 'pending' && !e.ret).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header title={'حصر مهام وعمليات ' + MOCA_MINISTRY} pending={pending} />
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                {['العملية والمهمة الرئيسية', 'العملية والمهمة الفرعية', 'الجهة أو المكتب', 'القطاع المعني', 'الحالة', 'الإجراء'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((e: MocaEntry) => {
                const st = mocaStatusOf(e);
                const isPending = e.wf === 'pending' && !e.ret;
                const open = openId === e.id;
                return (
                  <Fragment key={e.id}>
                  <tr>
                    <td style={{ ...td, fontWeight: 800, color: '#13213C' }}>{txt(e.mainProcess)}</td>
                    <td style={td}>{txt(e.subProcess)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{unitLabel(e)}</td>
                    <td style={td}>{txt(e.sector)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => setOpenId(open ? null : e.id)} style={btnView}>{open ? 'إخفاء' : 'عرض'}</button>
                        {isPending && (
                          <>
                            <button onClick={() => approveEntry(e.id)} style={btnApprove}>اعتماد</button>
                            <button onClick={() => setRet({ id: e.id, kind: 'info', place: false })} style={btnAmber}>إعادة بملاحظات</button>
                            <button onClick={() => setRet({ id: e.id, kind: 'reject', place: false })} style={btnRed}>رفض</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={6} style={{ padding: '4px 15px 14px', borderBottom: '1px solid #F4F6FA' }}>
                        <EntryDetail e={e} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {!visible.length && (
                <tr><td colSpan={6} style={{ padding: 0 }}><Empty msg="لا مدخلات مرسلة من جهات الوزارة بعد" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {retModal}
      </div>
    );
  }

  if (mode === 'batches') {
    // بطاقة لكل دفعة كصفحة دفعات المسارات: ترويسة الدفعة وفترتها ثم جدول مدخلاتها
    const placed = visible.filter((e) => String(e.execBatch || '').trim());
    const pendingPlace = placed.filter((e) => e.batchWf === 'pending').length;
    const known = new Set(MOCA_BATCHES.map((b) => b.name));
    const groups: { name: string; period: string; rows: MocaEntry[] }[] = [
      ...MOCA_BATCHES.map((b) => ({ name: b.name, period: b.period, rows: placed.filter((e) => String(e.execBatch).trim() === b.name) })),
      // أي دفعة خارج القائمة المعتمدة تظهر بعدها بلا فترة
      ...Array.from(new Set(placed.map((e) => String(e.execBatch).trim()).filter((n) => !known.has(n))))
        .sort((a, b) => a.localeCompare(b, 'ar'))
        .map((name) => ({ name, period: '', rows: placed.filter((e) => String(e.execBatch).trim() === name) })),
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="hd" style={{ fontSize: 18, fontWeight: 800, color: '#13213C' }}>دفعات الإطلاق — {MOCA_MINISTRY}</div>
          {pendingPlace > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309', background: '#FFF7EB', borderRadius: 999, padding: '6px 14px' }}>
              {pendingPlace} {pendingPlace === 1 ? 'توزيع بانتظار اعتمادك' : 'توزيعات بانتظار اعتمادك'}
            </span>
          )}
        </div>
        {groups.map((g) => (
          <div key={g.name} style={{ background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '18px 22px 14px', borderBottom: '1px solid #EEF1F7' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>{g.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#42506B', background: '#F1F4F9', borderRadius: 999, padding: '3px 10px' }}>{g.rows.length} مدخل</span>
                </div>
                {g.period && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9AA6BC', fontWeight: 400, marginTop: 5 }}>{g.period}</div>
                )}
              </div>
            </div>
            {g.rows.length === 0 ? (
              <div style={{ padding: '22px 16px', textAlign: 'center', fontSize: 12.5, color: '#9AA6BC' }}>لا مدخلات ضمن هذه الدفعة بعد</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                  <thead>
                    <tr>
                      {['العملية والمهمة الرئيسية', 'العملية والمهمة الفرعية', 'الجهة أو المكتب', 'حالة المدخل', 'حالة التوزيع', 'الإجراءات'].map((h) => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((e: MocaEntry) => {
                      const st = mocaStatusOf(e);
                      const bs = e.batchWf === 'approved'
                        ? { t: 'معتمد', c: '#0B8A4B', bg: '#EAF7F0' }
                        : e.batchWf === 'pending'
                          ? { t: 'قيد الاعتماد', c: '#B45309', bg: '#FFF7EB' }
                          : { t: 'مسودة', c: '#54627B', bg: '#F1F4F9' };
                      const open = openId === e.id;
                      return (
                        <Fragment key={e.id}>
                          <tr>
                            <td style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={txt(e.mainProcess)}>{txt(e.mainProcess)}</td>
                            <td style={{ ...td, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={txt(e.subProcess)}>{txt(e.subProcess)}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>{unitLabel(e)}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                            </td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>
                              <span title={e.ret?.note ? 'السبب: ' + e.ret.note : undefined} style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: bs.bg, color: bs.c }}>{bs.t}</span>
                            </td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {e.batchWf === 'pending' && (
                                  <>
                                    <button onClick={() => approvePlacement(e.id)} style={btnApprove}>اعتماد</button>
                                    <button onClick={() => setRet({ id: e.id, kind: 'info', place: true })} style={btnAmber}>إعادة للتعديل</button>
                                  </>
                                )}
                                <button onClick={() => setOpenId(open ? null : e.id)} style={btnView}>{open ? 'إخفاء' : 'عرض'}</button>
                              </div>
                            </td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={6} style={{ padding: '4px 15px 14px', borderBottom: '1px solid #F4F6FA' }}>
                                <EntryDetail e={e} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {retModal}
      </div>
    );
  }

  // mode === 'usecases'
  const lastUpdate = (u: MocaUseCase) => (u.updates.length ? u.updates[u.updates.length - 1] : null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Header title={'حالات استخدام ' + MOCA_MINISTRY} />
      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              {['العملية والمهمة', 'الجهة أو المكتب', 'الحالة', 'التحديثات', 'آخر تحديث', ''].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {useCases.map((u: MocaUseCase) => {
              const st = MOCA_UC_STATUS_STYLE[u.status] || { color: '#54627B', bg: '#F1F4F9' };
              const last = lastUpdate(u);
              const open = openId === u.id;
              return (
                <Fragment key={u.id}>
                  <tr>
                    <td style={{ ...td, fontWeight: 800, color: '#13213C' }}>
                      {txt(u.mainProcess)}
                      <div style={{ fontSize: 11.5, fontWeight: 400, color: '#8A97AD', marginTop: 3 }}>{txt(u.subProcess)}</div>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{unitLabel(u)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.color }}>{u.status}</span>
                    </td>
                    <td style={td}>{u.updates.length}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{last ? last.at : '—'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      {u.updates.length > 0 && (
                        <button onClick={() => setOpenId(open ? null : u.id)} style={{ background: '#fff', border: '1px solid #DCE3EE', color: '#54627B', borderRadius: 9, padding: '7px 14px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {open ? 'إخفاء التحديثات' : 'عرض التحديثات'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={6} style={{ padding: '4px 15px 14px', borderBottom: '1px solid #F4F6FA' }}>
                        <div style={{ background: '#F7F9FD', borderRadius: 12, padding: 14 }}>
                          {u.updates.map((up, i) => (
                            <div key={i} style={{ padding: '8px 4px', borderBottom: i < u.updates.length - 1 ? '1px solid #E7ECF4' : 'none', fontSize: 12.5, color: '#33415C', lineHeight: 1.8 }}>
                              {up.text}
                              <div style={{ fontSize: 11, color: '#8A97AD', marginTop: 3 }}>{[up.vendor, up.at].filter(Boolean).join(' · ')}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!useCases.length && (
              <tr><td colSpan={6} style={{ padding: 0 }}><Empty msg="لا حالات استخدام مسجلة في جهات الوزارة بعد" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
