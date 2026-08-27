'use client';
// ===========================================================================
// عرض وزارة شؤون مجلس الوزراء داخل لوحة اللجنة الوطنية — عرض فقط
// الوزارة تُعامل كجهة ضمن قوائم الحصر ودفعات الإطلاق وحالات الاستخدام،
// بينما تبقى دورة الاعتماد الداخلية كاملة في نسختها المستقلة /moca
// ===========================================================================
import { Fragment, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useMoca } from '@/lib/mocaStore';
import {
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

function Header({ title, count }: { title: string; count: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>{MOCA_MINISTRY}</div>
        <span style={{ background: '#EAF1FE', color: '#1D4ED8', borderRadius: 999, padding: '4px 12px', fontSize: 11.5, fontWeight: 800 }}>{title} · {count}</span>
        <span style={{ background: '#F1F4F9', color: '#54627B', borderRadius: 999, padding: '4px 12px', fontSize: 11.5, fontWeight: 800 }}>عرض فقط</span>
      </div>
      <div style={{ fontSize: 12, color: '#9AA6BC', marginTop: 4 }}>
        دورة الاعتماد الداخلية للوزارة تتم في نسختها المستقلة — وتظهر هنا للاطلاع كبقية الجهات
      </div>
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
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // مسودات المنسقين داخل الوزارة تبقى خاصة — يظهر المُرسَل وما بعده فقط
  const visible = entries.filter((e) => e.wf !== 'draft');

  if (mode === 'inv') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header title="حصر المهام والعمليات" count={visible.length} />
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['العملية والمهمة الرئيسية', 'العملية والمهمة الفرعية', 'الجهة أو المكتب', 'القطاع المعني', 'الحالة'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((e: MocaEntry) => {
                const st = mocaStatusOf(e);
                return (
                  <tr key={e.id}>
                    <td style={{ ...td, fontWeight: 800, color: '#13213C' }}>{txt(e.mainProcess)}</td>
                    <td style={td}>{txt(e.subProcess)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{unitLabel(e)}</td>
                    <td style={td}>{txt(e.sector)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
              {!visible.length && (
                <tr><td colSpan={5} style={{ padding: 0 }}><Empty msg="لا مدخلات مرسلة من جهات الوزارة بعد" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (mode === 'batches') {
    const placed = visible
      .filter((e) => String(e.execBatch || '').trim())
      .sort((a, b) => String(a.execBatch).localeCompare(String(b.execBatch), 'ar'));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header title="دفعات الإطلاق" count={placed.length} />
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['الدفعة', 'العملية والمهمة الرئيسية', 'العملية والمهمة الفرعية', 'الجهة أو المكتب', 'حالة التوزيع'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {placed.map((e: MocaEntry) => {
                const bs = e.batchWf === 'approved'
                  ? { t: 'معتمد', c: '#0B8A4B', bg: '#EAF7F0' }
                  : e.batchWf === 'pending'
                    ? { t: 'قيد الاعتماد', c: '#B45309', bg: '#FFF7EB' }
                    : { t: 'مسودة توزيع', c: '#54627B', bg: '#F1F4F9' };
                return (
                  <tr key={e.id}>
                    <td style={{ ...td, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>{txt(e.execBatch)}</td>
                    <td style={td}>{txt(e.mainProcess)}</td>
                    <td style={td}>{txt(e.subProcess)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{unitLabel(e)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: bs.bg, color: bs.c }}>{bs.t}</span>
                    </td>
                  </tr>
                );
              })}
              {!placed.length && (
                <tr><td colSpan={5} style={{ padding: 0 }}><Empty msg="لا توزيعات على دفعات الإطلاق بعد" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // mode === 'usecases'
  const lastUpdate = (u: MocaUseCase) => (u.updates.length ? u.updates[u.updates.length - 1] : null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Header title="حالات الاستخدام" count={useCases.length} />
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
