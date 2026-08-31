'use client';
// ===========================================================================
// المشاريع الاستراتيجية — دور «أعضاء المشاريع الاستراتيجية»
//  - اللجنة الوطنية تعرّف المشاريع من صفحتها الجانبية «المشاريع الاستراتيجية»
//    (الاسم/القائد/العضو المسؤول/فترة التنفيذ) وتعتمد النماذج من الصفحة نفسها
//  - العضو يختار مشروعاً معرّفاً ويعبّئ نموذجه: بيانات المشروع، المراحل
//    التنفيذية الرئيسية، فريق العمل — حفظ كمسودة أو إرسال لاعتماد اللجنة
// معزول بالكامل عن مسارات التحول (لا يمسّ عناصرها أو دورات اعتمادها)
// ===========================================================================
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { PROJECT_LEADS, type ProjDef, type ProjForm, type ProjMember, type ProjPhase } from '@/lib/domain';
import { Icon } from './Icon';

const card: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 16 };
const label: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: '#13213C', marginBottom: 7 };
const inp: CSSProperties = { width: '100%', border: '1px solid #DCE3EE', borderRadius: 11, padding: '11px 13px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#13213C', backgroundColor: '#fff' };
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

// الحقول العربية لا تقبل حروفاً لاتينية — تُحذف أثناء الكتابة (بنفس قاعدة نماذج المسارات)
const arOnly = (v: string) => v.replace(/[A-Za-z]/g, '');
const hasLatin = (v: string) => /[A-Za-z]/.test(v);

// صيغ الإدخال: بريد صحيح، وهاتف متحرك إماراتي (05XXXXXXXX أو +9715XXXXXXXX)
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const phoneOk = (v: string) => /^(\+?971|00971|0)?5\d{8}$/.test(v.replace(/[\s-]/g, ''));

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
    else if (p.end < p.start) miss.push('تاريخ انتهاء المرحلة ' + (i + 1) + ' قبل تاريخ بدئها');
  });
  // صحة البريد والهاتف لكل عضو مُدخل بياناته
  const contactIssues = (m: ProjMember, who: string) => {
    if (m.email.trim() && !emailOk(m.email)) miss.push('البريد الإلكتروني غير صالح (' + who + ')');
    if (m.phone.trim() && !phoneOk(m.phone)) miss.push('رقم الهاتف المتحرك غير صالح (' + who + ')');
  };
  if (!f.team[0] || !memberComplete(f.team[0])) miss.push('بيانات رئيس الفريق كاملة');
  if (f.team[0]) contactIssues(f.team[0], 'رئيس الفريق');
  f.team.slice(1).forEach((m, i) => {
    if (memberTouched(m) && !memberComplete(m)) miss.push('استكمال بيانات العضو ' + (i + 1));
    if (memberTouched(m)) contactIssues(m, 'العضو ' + (i + 1));
  });
  // الحقول النصية العربية يجب ألا تحوي حروفاً لاتينية
  const latinIn: string[] = [];
  if (hasLatin(f.entityResp)) latinIn.push('الجهة المسؤولة');
  if (hasLatin(f.desc)) latinIn.push('وصف المشروع');
  if (f.outputs.some(hasLatin)) latinIn.push('المخرجات المرجوة');
  if (f.phases.some((p) => hasLatin(p.name))) latinIn.push('أسماء المراحل');
  if (f.team.some((m) => hasLatin(m.name) || hasLatin(m.title) || hasLatin(m.entity))) latinIn.push('أسماء فريق العمل ومسمياتهم وجهاتهم');
  if (latinIn.length) miss.push('الكتابة باللغة العربية مطلوبة في: ' + latinIn.join('، '));
  return miss;
}

const WF_CHIP: Record<string, { t: string; c: string; bg: string }> = {
  draft: { t: 'مسودة', c: '#54627B', bg: '#EEF2F9' },
  sent: { t: 'قيد اعتماد اللجنة الوطنية', c: '#B45309', bg: '#FFF3DE' },
  approved: { t: 'معتمد', c: '#0B8A4B', bg: '#EAF7F0' },
};
const chipOf = (f: ProjForm) => (f.ret && f.wf === 'draft' ? { t: 'للتعديل', c: '#B45309', bg: '#FFF3DE' } : WF_CHIP[f.wf]);
// فترة التنفيذ المعرّفة شهر وسنة فقط — تُعرض بالشهر العربي (تتقبل قيماً قديمة بأيام)
const AR_M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const fmtMY = (v: string) => { const m = v.match(/^(\d{4})-(\d{2})/); return m ? AR_M[+m[2] - 1] + ' ' + m[1] : v; };
const fmtPeriod = (d?: ProjDef) => (d && (d.start || d.end) ? [d.start, d.end].filter(Boolean).map(fmtMY).join(' ← ') : '—');

// ---------------------------------------------------------------------------
// نموذج المشروع — الأقسام الثلاثة كما في التصميم المعتمد
function ProjFormPanel({ form, setForm, def, onSave, onSubmit, onClose }: {
  form: ProjForm;
  setForm: (f: ProjForm) => void;
  def: ProjDef | undefined;
  onSave: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [missing, setMissing] = useState<string[]>([]);
  const set = (patch: Partial<ProjForm>) => setForm({ ...form, ...patch });

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
        {idx > 1 && (
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
        ] as const).map(([k, lb, ph]) => {
          // تلوين فوري للصيغ غير الصالحة (بريد/هاتف) أثناء الكتابة
          const bad =
            (k === 'email' && m.email.trim() !== '' && !emailOk(m.email)) ||
            (k === 'phone' && m.phone.trim() !== '' && !phoneOk(m.phone));
          return (
          <div key={k}>
            <label style={label}>{lb}{req}</label>
            <input
              value={m[k]}
              onChange={(e) => set({ team: form.team.map((x, i) => (i === idx ? { ...x, [k]: k === 'email' || k === 'phone' ? e.target.value : arOnly(e.target.value) } : x)) })}
              placeholder={ph}
              dir={k === 'email' || k === 'phone' ? 'ltr' : 'rtl'}
              style={{ ...inp, textAlign: k === 'email' || k === 'phone' ? 'left' : 'right', ...(bad ? { borderColor: '#C0303B', background: '#FFFBFB' } : {}) }}
            />
            {bad && (
              <div style={{ fontSize: 11, color: '#C0303B', fontWeight: 700, marginTop: 5 }}>
                {k === 'email' ? 'صيغة البريد غير صحيحة — مثال: name@entity.gov.ae' : 'رقم غير صالح — مثال: 0501234567'}
              </div>
            )}
          </div>
          );
        })}
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
            <input value={form.entityResp} onChange={(e) => set({ entityResp: arOnly(e.target.value) })} placeholder="أدخل اسم الجهة المسؤولة" style={{ ...inp}} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>وصف المشروع{req}</label>
            <textarea value={form.desc} onChange={(e) => set({ desc: arOnly(e.target.value) })} rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} />
          </div>
          <label style={label}>المخرجات المرجوة{req}</label>
          {form.outputs.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#E5EEFF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flex: 'none' }}>{i + 1}</span>
              <input value={o} onChange={(e) => set({ outputs: form.outputs.map((x, j) => (j === i ? arOnly(e.target.value) : x)) })} placeholder={'المخرج المرجو رقم ' + (i + 1)} style={{ ...inp}} />
              {form.outputs.length > 1 && (
                <button onClick={() => set({ outputs: form.outputs.filter((_, j) => j !== i) })} title="إزالة المخرج" style={{ background: 'transparent', border: 'none', color: '#C0303B', cursor: 'pointer', fontSize: 16, fontWeight: 800, flex: 'none' }}>✕</button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => set({ outputs: [...form.outputs, ''] })} style={btnDashed}>+ إضافة مخرج</button>
          </div>
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
                  <th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {form.phases.map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F0F3F9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#8A97AD', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <input value={p.name} onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, name: arOnly(e.target.value) } : x)) })} placeholder="اسم المرحلة" style={{ ...inp}} />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input type="date" value={p.start} onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} style={{ ...inp}} />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="date"
                        value={p.end}
                        onChange={(e) => set({ phases: form.phases.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })}
                        title={p.start && p.end && p.end < p.start ? 'تاريخ الانتهاء قبل تاريخ البدء' : undefined}
                        style={{ ...inp, ...(p.start && p.end && p.end < p.start ? { borderColor: '#C0303B', background: '#FFFBFB' } : {}) }}
                      />
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {form.phases.length > 1 && (
                        <button onClick={() => set({ phases: form.phases.filter((_, j) => j !== i) })} title="إزالة المرحلة" style={{ background: 'transparent', border: 'none', color: '#C0303B', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => set({ phases: [...form.phases, emptyPhase()] })} style={btnDashed}>+ إضافة مرحلة</button>
        </>
      ))}

      {section(3, 'فريق العمل', (
        <>
          {form.team.map((m, i) => memberCard(m, i))}
          <button onClick={() => set({ team: [...form.team, emptyMember()] })} style={btnDashed}>+ إضافة أعضاء</button>
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

      {(
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
// ---------------------------------------------------------------------------
// صفحة قائد المشاريع الاستراتيجية: اطلاع على مشاريع قيادته وحالة تعبئتها —
// النماذج تُعرض للقراءة فقط، والاعتماد يبقى للجنة الوطنية وحدها
export function ProjLeadSection({ leadName }: { leadName: string }) {
  const s = useStore();
  // الخادم يقصر التعريفات والنماذج على مشاريع قيادته — والتصفية هنا احتياط
  const defs = s.projDefs.filter((d) => !d.lead || d.lead === leadName);
  const forms = s.projForms;
  const [viewId, setViewId] = useState<string | null>(null);
  const formOf = (projId: string) => forms.find((f) => f.projId === projId);

  const kpi = (labelTxt: string, v: number) => (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ fontSize: 12.5, color: '#8A97AD', fontWeight: 700 }}>{labelTxt}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#13213C', marginTop: 4 }}>{v}</div>
    </div>
  );
  const unfilled = defs.filter((d) => !formOf(d.id)).length;
  const pending = defs.filter((d) => formOf(d.id)?.wf === 'sent').length;
  const approved = defs.filter((d) => formOf(d.id)?.wf === 'approved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>المشاريع الاستراتيجية</div>
        <div style={{ fontSize: 12.5, color: '#8A97AD', marginTop: 4 }}>{leadName}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 12 }}>
        {kpi('مشاريع تحت القيادة', defs.length)}
        {kpi('يتطلب التعبئة', unfilled)}
        {kpi('بانتظار اعتماد اللجنة', pending)}
        {kpi('معتمد', approved)}
      </div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              {['المشروع', 'العضو المسؤول', 'فترة التنفيذ', 'حالة النموذج', 'الإجراء'].map((h) => (
                <th key={h} style={{ textAlign: 'right', padding: '11px 15px', fontSize: 11.5, fontWeight: 700, color: '#8A97AD', borderBottom: '1px solid #EEF1F7', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defs.map((d) => {
              const f = formOf(d.id);
              const st = f ? chipOf(f) : { t: 'لم يُعبأ بعد', c: '#8A97AD', bg: '#F1F4FA' };
              return (
                <tr key={d.id}>
                  <td style={{ padding: '12px 15px', fontSize: 13, fontWeight: 800, color: '#13213C', borderBottom: '1px solid #F4F6FA' }}>{d.name}</td>
                  <td style={{ padding: '12px 15px', fontSize: 12.5, color: '#33415C', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                    {d.member || '—'}
                    {d.memberEmail && <div style={{ fontSize: 11, color: '#8A97AD', direction: 'ltr', textAlign: 'right' }}>{d.memberEmail}</div>}
                  </td>
                  <td style={{ padding: '12px 15px', fontSize: 12, color: '#54627B', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{fmtPeriod(d)}</td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: st.bg, color: st.c }}>{st.t}</span>
                  </td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>
                    {f ? (
                      <button onClick={() => setViewId(f.id)} style={{ ...btnGhost, padding: '7px 14px', fontSize: 12 }}>عرض</button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#8A97AD' }}>بانتظار تعبئة العضو</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!defs.length && (
              <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#8A97AD', fontSize: 13 }}>لا مشاريع مسندة لقيادتكم بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {(() => {
        const f = viewId ? forms.find((x) => x.id === viewId) : null;
        return f ? <ProjDetailDrawer f={f} d={defs.find((x) => x.id === f.projId)} onClose={() => setViewId(null)} /> : null;
      })()}
    </div>
  );
}

export function ProjMemberSection() {
  const s = useStore();
  // حساب دوره قائد مشاريع يرى صفحة القيادة بدل صفحة تعبئة الأعضاء
  if (s.sessionProjLead) return <ProjLeadSection leadName={s.sessionProjLead} />;
  return <ProjMemberFill />;
}

function ProjMemberFill() {
  const s = useStore();
  const defs = s.projDefs;
  const forms = s.projForms;
  const [editing, setEditing] = useState<ProjForm | null>(null);
  // العرض للقراءة في اللوحة الجانبية المنزلقة — التحرير في النموذج الكامل
  const [viewId, setViewId] = useState<string | null>(null);

  const defOf = (id: string) => defs.find((d) => d.id === id);

  const openForm = (f: ProjForm) => {
    setEditing(f);
    setTimeout(() => document.getElementById('proj-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
  };

  const kpi = (labelTxt: string, v: number) => (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ fontSize: 12.5, color: '#8A97AD', fontWeight: 700 }}>{labelTxt}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#13213C', marginTop: 4 }}>{v}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* عنوان الصفحة بنمط بقية صفحات المنصة */}
      <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>المشاريع الاستراتيجية</div>

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
          {kpi('إجمالي المشاريع', defs.length)}
          {/* يتطلب التعبئة = مشاريع بلا نموذج بعد + المسودات والمعادة للتعديل */}
          {kpi(
            'يتطلب التعبئة',
            defs.filter((d) => {
              const f = forms.find((x) => x.projId === d.id);
              return !f || f.wf === 'draft';
            }).length
          )}
          {kpi('قيد اعتماد اللجنة', forms.filter((f) => f.wf === 'sent').length)}
          {kpi('معتمدة', forms.filter((f) => f.wf === 'approved').length)}
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
                          <button onClick={() => openForm(blankForm(d.id))} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 12 }}>تعبئة النموذج</button>
                        ) : editable ? (
                          <>
                            <button onClick={() => openForm(f)} style={{ ...btnGhost, padding: '8px 15px', fontSize: 12 }}>تعديل</button>
                            <button onClick={() => s.deleteProjForm(f.id)} style={{ background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 10, padding: '8px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>حذف</button>
                          </>
                        ) : (
                          <button onClick={() => setViewId(f.id)} style={{ ...btnGhost, padding: '8px 15px', fontSize: 12 }}>عرض</button>
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
            onClose={() => setEditing(null)}
            onSave={() => { s.saveProjForm(editing, false); setEditing(null); }}
            onSubmit={() => { s.saveProjForm(editing, true); setEditing(null); }}
          />
        )}
      </div>

      {/* لوحة العرض الجانبية */}
      {(() => {
        const f = viewId ? forms.find((x) => x.id === viewId) : null;
        return f ? <ProjDetailDrawer f={f} d={defOf(f.projId)} onClose={() => setViewId(null)} /> : null;
      })()}
    </div>
  );
}

// عرض تفاصيل النموذج في لوحة جانبية منزلقة — بنمط لوحات التفاصيل في المنصة
function ProjDetailDrawer({ f, d, onClose }: { f: ProjForm; d?: ProjDef; onClose: () => void }) {
  const chip = chipOf(f);
  const secTitle: CSSProperties = { fontSize: 13.5, fontWeight: 800, color: '#13213C', marginBottom: 10 };
  const box: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: 18, marginBottom: 14 };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, direction: 'rtl' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,40,.5)', animation: 'fadeIn .2s' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 680, maxWidth: '97vw', background: '#F4F7FC', boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)', animation: 'slideInRight .3s', display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E7ECF4', padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>{d?.name || 'المشروع'}</div>
              <div style={{ fontSize: 12, color: '#54627B', marginTop: 6 }}>
                القائد: <b>{d?.lead || '—'}</b>{d?.member ? <> · العضو المسؤول: <b>{d.member}</b></> : null} · فترة التنفيذ: <b>{fmtPeriod(d)}</b>
              </div>
              <span style={{ display: 'inline-block', marginTop: 9, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: chip.bg, color: chip.c }}>{chip.t}</span>
            </div>
            <button onClick={onClose} aria-label="إغلاق" style={{ background: '#F4F7FC', border: '1px solid #E7ECF4', borderRadius: 10, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
              <Icon d="M18 6L6 18M6 6l12 12" size={15} color="#54627B" />
            </button>
          </div>
        </div>
        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {f.ret && f.wf === 'draft' && (
            <div style={{ background: '#FFF3DE', border: '1px solid #F5D9AE', color: '#B45309', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
              ملاحظات اللجنة الوطنية: {f.ret.note}
            </div>
          )}
          <div style={box}>
            <div style={secTitle}>بيانات المشروع</div>
            <div style={{ fontSize: 12.5, color: '#33415C', lineHeight: 1.9 }}>
              <div><b>الجهة المسؤولة:</b> {f.entityResp || '—'}</div>
              <div style={{ marginTop: 6 }}><b>وصف المشروع:</b> {f.desc || '—'}</div>
              <div style={{ marginTop: 8 }}>
                <b>المخرجات المرجوة:</b>
                <ul style={{ margin: '4px 0 0', paddingRight: 18 }}>{f.outputs.filter((o) => o.trim()).map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
            </div>
          </div>
          <div style={box}>
            <div style={secTitle}>المراحل التنفيذية الرئيسية</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'المرحلة', 'البدء', 'الانتهاء'].map((h) => (
                    <th key={h} style={{ textAlign: 'right', padding: '8px 10px', fontSize: 11.5, fontWeight: 800, color: '#8A97AD', borderBottom: '1px solid #EEF1F7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.phases.filter((p) => p.name.trim()).map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#8A97AD', borderBottom: '1px solid #F4F6FA' }}>{i + 1}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12.5, fontWeight: 700, color: '#13213C', borderBottom: '1px solid #F4F6FA' }}>{p.name}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#54627B', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{p.start || '—'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#54627B', borderBottom: '1px solid #F4F6FA', whiteSpace: 'nowrap' }}>{p.end || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={box}>
            <div style={secTitle}>فريق العمل</div>
            {f.team.filter(memberTouched).map((m, i) => (
              <div key={i} style={{ border: '1px solid #EEF1F7', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: '#EEF2F9', color: '#3A4A66', borderRadius: 999, padding: '3px 11px', fontSize: 11, fontWeight: 800 }}>{i === 0 ? 'رئيس الفريق' : 'عضو'}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#13213C' }}>{m.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#54627B', lineHeight: 1.9 }}>
                  {m.title} — {m.entity}
                  <br />
                  <span dir="ltr">{m.email}</span> · <span dir="ltr">{m.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  // العضو المسؤول: اختيار من الأعضاء المسجلين، أو بريد جديد يُنشأ له حساب
  // بدور أعضاء المشاريع الاستراتيجية تحت قائد المشروع — النسخة الحية فقط
  const LIVE = process.env.NEXT_PUBLIC_DATA_MODE === 'api';
  const [regMembers, setRegMembers] = useState<{ id: string; name: string; email: string; lead: string }[]>([]);
  const [memberMode, setMemberMode] = useState<'pick' | 'new'>('pick');
  const [memberSel, setMemberSel] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const loadMembers = () => {
    if (!LIVE) return;
    fetch('/api/projects/members', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.members)) setRegMembers(d.members); })
      .catch(() => {});
  };
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  // الاعتماد داخل الجدول نفسه: صف تفاصيل ممتد + نافذة ملاحظات الإعادة
  const [viewId, setViewId] = useState<string | null>(null);
  const [retId, setRetId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // النموذج يفتح تحت الجدول عند الطلب فقط — والزر ينزل إليه في كل نقرة
  const [formOpen, setFormOpen] = useState(false);
  const scrollToForm = () => setTimeout(() => document.getElementById('proj-def-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);

  const reset = () => { setName(''); setLead(''); setMember(''); setStart(''); setEnd(''); setEditId(null); setFormOpen(false); setMemberMode('pick'); setMemberSel(''); setNewEmail(''); setNewName(''); setNewPhone(''); };
  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const save = async () => {
    if (saving) return;
    if (!name.trim()) return s.toast('أدخل اسم المشروع');
    if (!lead) return s.toast('اختر قائد المشروع');
    if (!start || !end) return s.toast('حدد فترة التنفيذ (البدء والانتهاء)');

    // هوية العضو المسؤول: من المسجلين أو حساب جديد بالبريد — تُثبَّت على
    // التعريف ليُحصر ما يراه العضو في مشاريعه، ويُحدَّث قائده مع الإسناد
    let m: { name: string; memberId?: string; memberEmail?: string } | null = null;
    if (!LIVE) {
      if (!member.trim()) return s.toast('أدخل اسم العضو المسؤول من القائد');
      m = { name: member };
    } else if (memberMode === 'pick') {
      const sel = regMembers.find((x) => x.id === memberSel);
      if (!sel) return s.toast('اختر العضو المسؤول من القائمة أو أضفه ببريده');
      setSaving(true);
      const r = await fetch('/api/projects/members', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: sel.email, name: sel.name, lead }),
      }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
      setSaving(false);
      if (!r?.member) return s.toast('تعذّر إسناد العضو — حاول مجدداً');
      m = { name: r.member.name, memberId: r.member.id, memberEmail: r.member.email };
    } else {
      if (!newName.trim()) return s.toast('أدخل اسم العضو الجديد');
      if (!emailValid(newEmail)) return s.toast('أدخل بريداً إلكترونياً صالحاً للعضو الجديد');
      if (newPhone.trim() && !phoneOk(newPhone)) return s.toast('رقم الهاتف المتحرك غير صالح — مثال: 0501234567');
      setSaving(true);
      const r = await fetch('/api/projects/members', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim(), phone: newPhone.trim(), lead }),
      }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
      setSaving(false);
      if (!r?.member) return s.toast('تعذّر إنشاء حساب العضو — تحقق من البريد');
      m = { name: r.member.name, memberId: r.member.id, memberEmail: r.member.email };
      if (r.created) s.toast('أُنشئ حساب العضو ' + r.member.email + ' بدور أعضاء المشاريع الاستراتيجية');
    }

    const payload = { name, lead, member: m.name, memberId: m.memberId, memberEmail: m.memberEmail, start, end };
    if (editId) s.updateProjDef(editId, payload);
    else s.addProjDef(payload);
    reset();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>المشاريع الاستراتيجية</div>
        <button
          onClick={() => { setEditId(null); setName(''); setLead(''); setMember(''); setMemberMode('pick'); setMemberSel(''); setNewEmail(''); setNewName(''); setNewPhone(''); loadMembers(); setFormOpen(true); scrollToForm(); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 800, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 6px -2px rgba(37,99,235,.35)', fontFamily: 'inherit' }}
        >
          <Icon d="M12 5v14M5 12h14" size={17} strokeWidth={2.2} /> إضافة مشروع
        </button>
      </div>

      {formOpen && (
      <div id="proj-def-form" style={{ ...card, padding: 20, scrollMarginTop: 90, order: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>{editId ? 'تعديل مشروع' : 'إضافة مشروع استراتيجي'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 14 }}>
          <div>
            <label style={label}>اسم المشروع{req}</label>
            <input value={name} onChange={(e) => setName(arOnly(e.target.value))} placeholder="اسم المشروع" style={inp} />
          </div>
          <div>
            <label style={label}>قائد المشروع{req}</label>
            <select value={lead} onChange={(e) => setLead(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">اختر القائد…</option>
              {PROJECT_LEADS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>العضو المسؤول{req}</label>
            {!LIVE ? (
              <input value={member} onChange={(e) => setMember(arOnly(e.target.value))} placeholder="اسم العضو المسؤول من القائد" style={inp} />
            ) : memberMode === 'pick' ? (
              <>
                <select
                  value={memberSel}
                  onChange={(e) => { if (e.target.value === '__new__') { setMemberMode('new'); setMemberSel(''); } else setMemberSel(e.target.value); }}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="">اختر من الأعضاء المسجلين…</option>
                  {regMembers.map((mm) => <option key={mm.id} value={mm.id}>{mm.name} — {mm.email}</option>)}
                  <option value="__new__">+ عضو جديد بالبريد الإلكتروني</option>
                </select>
                <div style={{ fontSize: 11, color: '#8A97AD', marginTop: 5 }}>يُسند العضو المختار إلى قائد هذا المشروع</div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 10 }}>
                  <input value={newName} onChange={(e) => setNewName(arOnly(e.target.value))} placeholder="اسم العضو" style={inp} />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@entity.gov.ae" style={{ ...inp, direction: 'ltr', textAlign: 'right' }} />
                  <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="050 000 0000" style={{ ...inp, direction: 'ltr', textAlign: 'right' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#8A97AD' }}>يُنشأ له حساب بدور أعضاء المشاريع الاستراتيجية تحت قائد المشروع، ويدخل عبر UAE PASS بهذا البريد</span>
                  <button type="button" onClick={() => setMemberMode('pick')} style={{ border: 'none', background: 'transparent', color: '#1D4ED8', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: 0, whiteSpace: 'nowrap' }}>← الاختيار من المسجلين</button>
                </div>
              </>
            )}
          </div>
          <div>
            <label style={label}>البدء (الشهر والسنة){req}</label>
            <input type="month" value={start} onChange={(e) => setStart(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>الانتهاء (الشهر والسنة){req}</label>
            <input type="month" value={end} onChange={(e) => setEnd(e.target.value)} style={inp} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'جارٍ الحفظ…' : editId ? 'حفظ التعديلات' : 'إضافة المشروع'}</button>
          <button onClick={reset} style={btnGhost}>إلغاء</button>
        </div>
      </div>
      )}

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
                <tr key={d.id}>
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
                        <button onClick={() => setViewId(f.id)} style={{ ...btnGhost, ...smallBtn }}>عرض</button>
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
                          <button onClick={() => { setEditId(d.id); setName(d.name); setLead(d.lead); setMember(d.member || ''); setMemberMode('pick'); setMemberSel(d.memberId || ''); setNewEmail(d.memberEmail || ''); setNewName(d.member || ''); loadMembers(); setStart((d.start || '').slice(0, 7)); setEnd((d.end || '').slice(0, 7)); setFormOpen(true); scrollToForm(); }} style={{ ...btnGhost, ...smallBtn }}>تعديل</button>
                          <button onClick={() => setDelId(d.id)} style={{ background: '#FDECEE', color: '#C0303B', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', ...smallBtn }}>حذف</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!s.projDefs.length && (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#8A97AD', fontSize: 13 }}>لا مشاريع معرّفة بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* لوحة العرض الجانبية */}
      {(() => {
        const f = viewId ? s.projForms.find((x) => x.id === viewId) : null;
        return f ? <ProjDetailDrawer f={f} d={s.projDefs.find((x) => x.id === f.projId)} onClose={() => setViewId(null)} /> : null;
      })()}

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
