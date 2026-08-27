'use client';
// ===========================================================================
// المشاريع الاستراتيجية — دور «أعضاء المشاريع الاستراتيجية»
//  - اللجنة الوطنية تعرّف المشاريع من صفحتها الجانبية «المشاريع الاستراتيجية»
//    (الاسم/القائد/العضو المسؤول/فترة التنفيذ) وتعتمد النماذج من الصفحة نفسها
//  - العضو يختار مشروعاً معرّفاً ويعبّئ نموذجه: بيانات المشروع، المراحل
//    التنفيذية الرئيسية، فريق العمل — حفظ كمسودة أو إرسال لاعتماد اللجنة
// معزول بالكامل عن مسارات التحول (لا يمسّ عناصرها أو دورات اعتمادها)
// ===========================================================================
import { Fragment, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { PROJECT_LEADS, type ProjDef, type ProjForm, type ProjMember, type ProjPhase } from '@/lib/domain';
import { Icon } from './Icon';

const card: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 16 };
const label: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: '#13213C', marginBottom: 7 };
const inp: CSSProperties = { width: '100%', border: '1px solid #DCE3EE', borderRadius: 11, padding: '11px 13px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#13213C', background: '#fff' };
const req = <span style={{ color: '#C0303B' }}> *</span>;
const btnPrimary: CSSProperties = { background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', border: 'none', borderRadius: 11, padding: '12px 22px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: CSSProperties = { background: '#fff', border: '1px solid #DCE3EE', color: '#54627B', borderRadius: 11, padding: '12px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnDashed: CSSProperties = { background: '#F5F8FF', border: '1.6px dashed #2563EB', color: '#1D4ED8', borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' };

const emptyMember = (): ProjMember => ({ name: '', title: '', entity: '', email: '', phone: '' });
const emptyPhase = (): ProjPhase => ({ name: '', start: '', end: '' });
const blankForm = (projId: string): ProjForm => ({
  id: 'pf' + Date.now(),
  projId,
  owner: '',
  entityResp: '',
  desc: '',
  outputs: ['', '', ''],
  phases: [emptyPhase()],
  team: [emptyMember(), emptyMember()],
  wf: 'draft',
  ret: null,
  log: [],
});

const memberComplete = (m: ProjMember) => !!(m.name.trim() && m.title.trim() && m.entity.trim() && m.email.trim() && m.phone.trim());
const memberTouched = (m: ProjMember) => Object.values(m).some((v) => String(v).trim());

// الحقول الناقصة قبل الإرسال — تُعرض نقاطاً كما في بقية المنصة
function missingOf(f: ProjForm): string[] {
  const miss: string[] = [];
  if (!f.entityResp.trim()) miss.push('الجهة المسؤولة');
  if (!f.desc.trim()) miss.push('وصف المشروع');
  if (!f.outputs.some((o) => o.trim())) miss.push('المخرجات المرجوة (مخرج واحد على الأقل)');
  const phases = f.phases.filter((p) => p.name.trim() || p.start || p.end);
  if (!phases.length) miss.push('المراحل التنفيذية الرئيسية (مرحلة واحدة على الأقل)');
  phases.forEach((p, i) => {
    if (!p.name.trim() || !p.start || !p.end) miss.push('استكمال بيانات المرحلة ' + (i + 1));
  });
  if (!f.team[0] || !memberComplete(f.team[0])) miss.push('بيانات رئيس الفريق كاملة');
  f.team.slice(1).forEach((m, i) => {
    if (memberTouched(m) && !memberComplete(m)) miss.push('استكمال بيانات العضو ' + (i + 1));
  });
  return miss;
}

const WF_CHIP: Record<string, { t: string; c: string; bg: string }> = {
  draft: { t: 'مسودة', c: '#54627B', bg: '#EEF2F9' },
  sent: { t: 'قيد اعتماد اللجنة الوطنية', c: '#B45309', bg: '#FFF3DE' },
  approved: { t: 'معتمد', c: '#0B8A4B', bg: '#EAF7F0' },
};
const chipOf = (f: ProjForm) => (f.ret && f.wf === 'draft' ? { t: 'للتعديل', c: '#B45309', bg: '#FFF3DE' } : WF_CHIP[f.wf]);
const fmtPeriod = (d?: ProjDef) => (d && (d.start || d.end) ? [d.start, d.end].filter(Boolean).join(' ← ') : '—');

// ---------------------------------------------------------------------------
// نموذج المشروع — الأقسام الثلاثة كما في التصميم المعتمد
function ProjFormPanel({ form, setForm, def, readOnly, onSave, onSubmit, onClose }: {
  form: ProjForm;
  setForm: (f: ProjForm) => void;
  def: ProjDef | undefined;
  readOnly: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [missing, setMissing] = useState<string[]>([]);
  const set = (patch: Partial<ProjForm>) => setForm({ ...form, ...patch });
  const ro = readOnly ? { background: '#F7F9FD', pointerEvents: 'none' as const } : {};

  const section = (n: number, title: string, body: ReactNode) => (
    <div style={{ ...card, padding: 22, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: '#E5EEFF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flex: 'none' }}>{n}</span>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: '#13213C' }}>{title}</div>
      </div>
      {body}
    </div>
  );

  const memberCard = (m: ProjMember, idx: number) => (
    <div key={idx} style={{ border: '1px solid #E7ECF4', borderRadius: 14, padding: 18, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ background: '#EEF2F9', color: '#3A4A66', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 800 }}>
          {idx === 0 ? 'رئيس الفريق' : 'العضو ' + (['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'][idx - 1] || idx)}
        </span>
        {!readOnly && idx > 1 && (
          <button onClick={() => set({ team: form.team.filter((_, i) => i !== idx) })} title="إزالة العضو" style={{ background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 9, padding: '6px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            إزالة
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {([
          ['name', 'الاسم', 'الاسم الكامل'],
          ['title', 'المسمى الوظيفي', 'المسمى الوظيفي'],
          ['entity', 'الجهة', 'اسم الجهة'],
          ['email', 'البريد الإلكتروني', 'name@entity.gov.ae'],
          ['phone', 'الهاتف المتحرك', '050 000 0000'],
        ] as const).map(([k, lb, ph]) => (
          <div key={k}>
            <label style={label}>{lb}{req}</label>
            <input
              value={m[k]}
              onChange={(e) => set({ team: form.team.map((x, i) => (i === idx ? { ...x, [k]: e.target.value } : x)) })}
              placeholder={ph}
              dir={k === 'email' || k === 'phone' ? 'ltr' : 'rtl'}
              style={{ ...inp, ...ro, textAlign: k === 'email' || k === 'phone' ? 'left' : 'right' }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div id="proj-form-panel" style={{ scrollMarginTop: 90 }}>
      <div style={{ ...card, padding: 22, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>{def?.name || 'المشروع'}</div>
          <div style={{ fontSize: 12.5, color: '#54627B', marginTop: 6 }}>
            القائد: <b>{def?.lead || '—'}</b> · فترة التنفيذ: <b>{fmtPeriod(def)}</b>
          </div>
          {form.ret && form.wf === 'draft' && (
            <div style={{ marginTop: 10, background: '#FFF3DE', border: '1px solid #F5D9AE', color: '#B45309', borderRadius: 11, padding: '10px 14px', fontSize: 12.5, fontWeight: 700 }}>
              ملاحظات اللجنة الوطنية: {form.ret.note}
            </div>
          )}
        </div>
        <button onClick={onClose} style={btnGhost}>إغلاق</button>
      </div>

      {section(1, 'بيانات المشروع', (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>الجهة المسؤولة{req}</label>
            <input value={form.entityResp} onChange={(e) => set({ entityResp: e.target.value })} placeholder="أدخل اسم الجهة المسؤولة" style={{ ...inp, ...ro }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>وصف المشروع{req}</label>
            <textarea value={form.desc} onChange={(e) => set({ desc: e.target.value })} rows={5} style={{ ...inp, ...ro, resize: 'vertical', lineHeight: 1.8 }} />
          </div>
          <label style={label}>المخرجات المرجوة{req}</label>
          {form.outputs.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#E5EEFF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flex: 'none' }}>{i + 1}</span>
              <input value={o} onChange={(e) => set({ outputs: form.outputs.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={'المخرج المرجو رقم ' + (i + 1)} style={{ ...inp, ...ro }} />
              {!readOnly && form.outputs.length > 1 && (
                <button onClick={() => set({ outputs: form.outputs.filter((_, j) => j !== i) })} title="إزالة المخرج" style={{ background: 'transparent', border: 'none', color: '#C0303B', cursor: 'pointer', fontSize: 16, fontWeight: 800, flex: 'none' }}>✕</button>
              )}
            </div>
          ))}
          {!readOnly && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button onClick={() => set({ outputs: [...form.outputs, ''] })} style={btnDashed}>+ إضافة مخرج</button>
            </div>
          )}
        </>
      ))}

      {section(2, 'المراحل التنفيذية الرئيسية', (
        <>
          <div style={{ overflowX: 'auto', border: '1px solid #E7ECF4', borderRadius: 13, marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#F7F9FD' }}>
                  <th style={{ padding: '11px 14px', fontSize: 12, fontWeight: 800, color: '#54627B', textAlign: 'right', width: 40 }}>#</th>
                  <th style={{ padding: '11px 14px', fontSize: 12, fontWeight: 800, color: '#54627B', textAlign: 'right' }}>اسم المرحلة{req}</th>
                  <th style={{ padding: '11px 14px', fontSize: 12, fontWeight: 800, color: '#54627B', textAlign: 'right' }}>التاريخ المخطط للبدء{req}</th>
                  <th style={{ padding: '11px 14px', fontSize: 12, fontWeight: 800, color: '#54627B', textAlign: 'right' }}>التاريخ المخطط للانتهاء{req}</th>
                  {!readOnly && <th style={{ width: 50 }} />}
                </tr>
              </thead>
              <tbody>
                {form.phases.map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F0F3F9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#8A97AD', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <input value={p.name} onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="اسم المرحلة" style={{ ...inp, ...ro }} />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input type="date" value={p.start} onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} style={{ ...inp, ...ro }} />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input type="date" value={p.end} onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} style={{ ...inp, ...ro }} />
                    </td>
                    {!readOnly && (
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {form.phases.length > 1 && (
                          <button onClick={() => set({ phases: form.phases.filter((_, j) => j !== i) })} title="إزالة المرحلة" style={{ background: 'transparent', border: 'none', color: '#C0303B', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>✕</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!readOnly && <button onClick={() => set({ phases: [...form.phases, emptyPhase()] })} style={btnDashed}>+ إضافة مرحلة</button>}
        </>
      ))}

      {section(3, 'فريق العمل', (
        <>
          {form.team.map((m, i) => memberCard(m, i))}
          {!readOnly && <button onClick={() => set({ team: [...form.team, emptyMember()] })} style={btnDashed}>+ إضافة أعضاء</button>}
        </>
      ))}

      {missing.length > 0 && (
        <div style={{ background: '#FFFBF3', border: '1px solid #F5D9AE', borderRadius: 13, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#B45309', marginBottom: 8 }}>الحقول الناقصة قبل الإرسال:</div>
          <ul style={{ margin: 0, paddingRight: 18, color: '#B45309', fontSize: 12.5, lineHeight: 2 }}>
            {missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginBottom: 30 }}>
          <button
            onClick={() => {
              const miss = missingOf(form);
              setMissing(miss);
              if (miss.length) return;
              onSubmit();
            }}
            style={btnPrimary}
          >
            إرسال النموذج للاعتماد
          </button>
          <button onClick={onSave} style={btnGhost}>حفظ كمسودة</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// قسم العضو — يُعرض داخل قالب المنصة القياسي (الترويسة والشريط الجانبي نفساهما)
export function ProjMemberSection() {
  const s = useStore();
  const defs = s.projDefs;
  const forms = s.projForms;
  const [editing, setEditing] = useState<ProjForm | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  const defOf = (id: string) => defs.find((d) => d.id === id);

  const openForm = (f: ProjForm, ro: boolean) => {
    setEditing(f);
    setReadOnly(ro);
    setTimeout(() => document.getElementById('proj-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
  };

  const kpi = (labelTxt: string, v: number, c: string, bg: string) => (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12.5, color: '#8A97AD', fontWeight: 700 }}>{labelTxt}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#13213C', marginTop: 4 }}>{v}</div>
      </div>
      <span style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" size={19} color={c} />
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* عنوان الصفحة بنمط بقية صفحات المنصة */}
      <div>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>المشاريع الاستراتيجية</div>
        <div style={{ fontSize: 12, color: '#9AA6BC', marginTop: 3 }}>
          تعبئة نماذج المشاريع المعرّفة من اللجنة الوطنية وإرسالها للاعتماد
        </div>
      </div>

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
          {kpi('إجمالي المشاريع', defs.length, '#1D4ED8', '#E5EEFF')}
          {/* يتطلب التعبئة = مشاريع بلا نموذج بعد + المسودات والمعادة للتعديل */}
          {kpi(
            'يتطلب التعبئة',
            defs.filter((d) => {
              const f = forms.find((x) => x.projId === d.id);
              return !f || f.wf === 'draft';
            }).length,
            '#B45309',
            '#FFF3DE'
          )}
          {kpi('قيد اعتماد اللجنة', forms.filter((f) => f.wf === 'sent').length, '#0E7C86', '#E3F4F6')}
          {kpi('معتمدة', forms.filter((f) => f.wf === 'approved').length, '#0B8A4B', '#EAF7F0')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800 }}>نماذج مشاريعي</div>
        </div>

        {/* القائمة: كل المشاريع المعرّفة من اللجنة — بلا إضافة من العضو؛
            المشروع بلا نموذج يبدأ بزر «تعبئة النموذج» مباشرة من صفه */}
        <div style={{ ...card, overflowX: 'auto', marginBottom: 22 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                {['المشروع', 'القائد', 'فترة التنفيذ', 'الجهة المسؤولة', 'الحالة', 'الإجراء'].map((h) => (
                  <th key={h} style={{ textAlign: 'right', padding: '11px 15px', fontSize: 11.5, fontWeight: 700, color: '#8A97AD', borderBottom: '1px solid #EEF1F7', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defs.map((d) => {
                const f = forms.find((x) => x.projId === d.id);
                const chip = f ? chipOf(f) : { t: 'لم يُعبأ بعد', c: '#8A97AD', bg: '#F1F4FA' };
                const editable = !!f && f.wf === 'draft';
                return (
                  <tr key={d.id}>
                    <td style={{ padding: '13px 15px', fontSize: 13, fontWeight: 800, color: '#13213C', borderBottom: '1px solid #F4F6FA' }}>{d.name}</td>
                    <td style={{ padding: '13px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{d.lead || '—'}</td>
                    <td style={{ padding: '13px 15px', fontSize: 12, color: '#54627B', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{fmtPeriod(d)}</td>
                    <td style={{ padding: '13px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA' }}>{f?.entityResp || '—'}</td>
                    <td style={{ padding: '13px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: chip.bg, color: chip.c }}>{chip.t}</span>
                    </td>
                    <td style={{ padding: '13px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!f ? (
                          <button onClick={() => openForm(blankForm(d.id), false)} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 12 }}>تعبئة النموذج</button>
                        ) : (
                          <>
                            <button onClick={() => openForm(f, !editable)} style={{ ...btnGhost, padding: '8px 15px', fontSize: 12 }}>{editable ? 'تعديل' : 'عرض'}</button>
                            {editable && (
                              <button onClick={() => s.deleteProjForm(f.id)} style={{ background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 10, padding: '8px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>حذف</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!defs.length && (
                <tr>
                  <td colSpan={6} style={{ padding: 34, textAlign: 'center', color: '#8A97AD', fontSize: 13 }}>
                    لا مشاريع معرّفة بعد — تضيفها اللجنة الوطنية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* النموذج */}
        {editing && (
          <ProjFormPanel
            form={editing}
            setForm={setEditing}
            def={defOf(editing.projId)}
            readOnly={readOnly}
            onClose={() => setEditing(null)}
            onSave={() => { s.saveProjForm(editing, false); setEditing(null); }}
            onSubmit={() => { s.saveProjForm(editing, true); setEditing(null); }}
          />
        )}
      </div>
    </div>
  );
}

// تفاصيل النموذج المعبأ — تُعرض صفاً ممتداً داخل جدول اللجنة
function ProjFormDetail({ f }: { f: ProjForm }) {
  return (
    <div style={{ background: '#F7F9FD', borderRadius: 12, padding: 16, fontSize: 12.5, color: '#33415C', lineHeight: 1.9 }}>
      <div><b>الجهة المسؤولة:</b> {f.entityResp || '—'}</div>
      <div style={{ marginTop: 4 }}><b>وصف المشروع:</b> {f.desc || '—'}</div>
      <div style={{ marginTop: 8 }}>
        <b>المخرجات المرجوة:</b>
        <ul style={{ margin: '4px 0 0', paddingRight: 18 }}>{f.outputs.filter((o) => o.trim()).map((o, i) => <li key={i}>{o}</li>)}</ul>
      </div>
      <div style={{ marginTop: 8 }}>
        <b>المراحل التنفيذية:</b>
        <ul style={{ margin: '4px 0 0', paddingRight: 18 }}>
          {f.phases.filter((p) => p.name.trim()).map((p, i) => <li key={i}>{p.name} ({p.start || '—'} ← {p.end || '—'})</li>)}
        </ul>
      </div>
      <div style={{ marginTop: 8 }}>
        <b>فريق العمل:</b>
        <ul style={{ margin: '4px 0 0', paddingRight: 18 }}>
          {f.team.filter(memberTouched).map((m, i) => (
            <li key={i}>{i === 0 ? 'رئيس الفريق: ' : ''}{m.name} — {m.title} — {m.entity} — <span dir="ltr">{m.email}</span> — <span dir="ltr">{m.phone}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// صفحة اللجنة الوطنية «المشاريع الاستراتيجية» — تعريف المشاريع وإسنادها
// (القائد + العضو المسؤول) واعتماد النماذج المرسلة، كل ذلك في صفحة واحدة
export function ProjCommitteePage() {
  const s = useStore();
  const [name, setName] = useState('');
  const [lead, setLead] = useState('');
  const [member, setMember] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  // الاعتماد داخل الجدول نفسه: صف تفاصيل ممتد + نافذة ملاحظات الإعادة
  const [openId, setOpenId] = useState<string | null>(null);
  const [retId, setRetId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const reset = () => { setName(''); setLead(''); setMember(''); setStart(''); setEnd(''); setEditId(null); };
  const save = () => {
    if (!name.trim()) return s.toast('أدخل اسم المشروع');
    if (!lead) return s.toast('اختر قائد المشروع');
    if (!member.trim()) return s.toast('أدخل اسم العضو المسؤول من القائد');
    if (!start || !end) return s.toast('حدد فترة التنفيذ (البدء والانتهاء)');
    if (editId) s.updateProjDef(editId, { name, lead, member, start, end });
    else s.addProjDef({ name, lead, member, start, end });
    reset();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>المشاريع الاستراتيجية</div>
        <div style={{ fontSize: 12, color: '#9AA6BC', marginTop: 3 }}>
          تعريف المشاريع وإسنادها إلى القادة وأعضائهم المسؤولين، واعتماد النماذج المرسلة من الأعضاء
        </div>
      </div>

      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{editId ? 'تعديل مشروع' : 'إضافة مشروع استراتيجي'}</div>
        <div style={{ fontSize: 12, color: '#8A97AD', marginBottom: 14 }}>
          المشاريع المعرّفة هنا تظهر لأعضاء المشاريع الاستراتيجية لتعبئة نماذجها وإرسالها لاعتماد اللجنة
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
          <div>
            <label style={label}>اسم المشروع{req}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المشروع" style={inp} />
          </div>
          <div>
            <label style={label}>قائد المشروع{req}</label>
            <select value={lead} onChange={(e) => setLead(e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="">اختر القائد…</option>
              {PROJECT_LEADS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>العضو المسؤول{req}</label>
            <input value={member} onChange={(e) => setMember(e.target.value)} placeholder="اسم العضو المسؤول من القائد" style={inp} />
          </div>
          <div>
            <label style={label}>تاريخ البدء{req}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>تاريخ الانتهاء{req}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={inp} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={save} style={btnPrimary}>{editId ? 'حفظ التعديلات' : 'إضافة المشروع'}</button>
          {editId && <button onClick={reset} style={btnGhost}>إلغاء</button>}
        </div>
      </div>

      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              {['المشروع', 'القائد', 'العضو المسؤول', 'فترة التنفيذ', 'حالة النموذج', 'الإجراء'].map((h) => (
                <th key={h} style={{ textAlign: 'right', padding: '11px 15px', fontSize: 11.5, fontWeight: 700, color: '#8A97AD', borderBottom: '1px solid #EEF1F7', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.projDefs.map((d) => {
              const f = s.projForms.find((x) => x.projId === d.id);
              const st = f ? chipOf(f) : { t: 'لم يُعبأ بعد', c: '#8A97AD', bg: '#F1F4FA' };
              const isSent = f?.wf === 'sent';
              const isApproved = f?.wf === 'approved';
              const smallBtn = { padding: '7px 14px', fontSize: 12 } as const;
              return (
                <Fragment key={d.id}>
                <tr>
                  <td style={{ padding: '12px 15px', fontSize: 13, fontWeight: 800, color: '#13213C', borderBottom: '1px solid #F4F6FA' }}>{d.name}</td>
                  <td style={{ padding: '12px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{d.lead}</td>
                  <td style={{ padding: '12px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{d.member || '—'}</td>
                  <td style={{ padding: '12px 15px', fontSize: 12, color: '#54627B', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{fmtPeriod(d)}</td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.c }}>{st.t}</span>
                  </td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                    {/* الإجراءات تتبدل بحسب حالة النموذج في الصف نفسه */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {f && (
                        <button onClick={() => setOpenId(openId === d.id ? null : d.id)} style={{ ...btnGhost, ...smallBtn }}>
                          {openId === d.id ? 'إخفاء' : 'عرض'}
                        </button>
                      )}
                      {isSent && (
                        <>
                          <button onClick={() => s.approveProjForm(f.id)} style={{ background: 'linear-gradient(180deg,#0EA371,#0B8A4B)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', ...smallBtn }}>
                            اعتماد
                          </button>
                          <button onClick={() => { setRetId(f.id); setNote(''); }} style={{ background: '#FFF3DE', color: '#B45309', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', ...smallBtn }}>
                            إعادة بملاحظات
                          </button>
                        </>
                      )}
                      {!isSent && !isApproved && (
                        <>
                          <button onClick={() => { setEditId(d.id); setName(d.name); setLead(d.lead); setMember(d.member || ''); setStart(d.start); setEnd(d.end); }} style={{ ...btnGhost, ...smallBtn }}>تعديل</button>
                          <button onClick={() => setDelId(d.id)} style={{ background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', ...smallBtn }}>حذف</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {f && openId === d.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 15px 14px', borderBottom: '1px solid #F4F6FA' }}>
                      <ProjFormDetail f={f} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
            {!s.projDefs.length && (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#8A97AD', fontSize: 13 }}>لا مشاريع معرّفة بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {retId && (
        <div onClick={() => setRetId(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(9,20,45,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#13213C', marginBottom: 10 }}>إعادة النموذج للعضو</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="الملاحظات المطلوب معالجتها…" style={{ ...inp, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => { if (note.trim()) { s.returnProjForm(retId, note); setRetId(null); } else s.toast('نرجو كتابة الملاحظات المطلوب معالجتها'); }}
                style={btnPrimary}
              >
                إعادة النموذج
              </button>
              <button onClick={() => setRetId(null)} style={btnGhost}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div onClick={() => setDelId(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(9,20,45,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#13213C', marginBottom: 8 }}>حذف المشروع</div>
            <div style={{ fontSize: 12.5, color: '#54627B', lineHeight: 1.9, marginBottom: 14 }}>
              سيُحذف المشروع وكل النماذج المعبأة له نهائياً ولا يمكن التراجع. هل تريد المتابعة؟
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { s.removeProjDef(delId); setDelId(null); }} style={{ background: 'linear-gradient(180deg,#E24B59,#C0303B)', color: '#fff', border: 'none', borderRadius: 11, padding: '11px 20px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                حذف نهائياً
              </button>
              <button onClick={() => setDelId(null)} style={btnGhost}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
