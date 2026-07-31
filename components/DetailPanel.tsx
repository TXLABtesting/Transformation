'use client';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';
import { RichTextEditor, RichTextView } from './RichText';
import { SC, EXEC_STATUS_OPTS } from '@/lib/domain';

const CHECK = 'M20 6 9 17l-5-5';
const CLOCK = 'M12 8v4l2.5 1.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z';
const DOWNLOAD = 'M12 3v12M7 10l5 5 5-5M5 21h14';
const WALLET = 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z';
const SPEECH = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 500,
  color: '#98A4B6',
  marginBottom: 8,
};
const valueStyle: React.CSSProperties = {
  fontSize: 14.5,
  fontWeight: 800,
  color: '#16233F',
};

const sectionCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
  borderRadius: 14,
  padding: '16px 18px',
};

// ===== grouped detail layout (section header + divided field card) =====
const IC_BUILDING = 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01';
const IC_TAG = 'M9 3H4a1 1 0 0 0-1 1v5l9 9 6-6-9-9zM7.5 7.5h.01';
const IC_GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const IC_PEOPLE = 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8';

function DetailSecHead({ title }: { title: string }) {
  return (
    <div style={{ direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginTop: 22, marginBottom: 12 }}>
      <span className="hd" style={{ fontSize: 15.5, fontWeight: 800, color: '#16233F' }}>{title}</span>
    </div>
  );
}

function DetailGrid({ cols, tint, children }: { cols: number; tint?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: 1, background: '#EAEEF5', border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)', borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function DetailCell({ label, iconD, tint, children }: { label: string; iconD?: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: tint ? '#F8FAFD' : '#fff', padding: '20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 92 }}>
      <div style={{ minWidth: 0, textAlign: 'right', flex: 1 }}>
        <div style={labelStyle}>{label}</div>
        <div style={{ ...valueStyle, lineHeight: 1.55 }}>{children}</div>
      </div>
      {iconD && (
        <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 10, background: '#EAF0FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={iconD} size={16} color="#2563EB" />
        </span>
      )}
    </div>
  );
}

function TransformPill({ v }: { v?: string }) {
  const s = (v || '').trim();
  const bad = s.includes('غير');
  const partial = s.includes('جزئي');
  const c = !s ? '#8A97AD' : bad ? '#C0392B' : partial ? '#B45309' : '#0B8A4B';
  const bg = !s ? '#EEF2F8' : bad ? '#FDECEA' : partial ? '#FFF7EB' : '#EAF7F0';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: c, borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 800 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flex: 'none' }} />
      {s || '—'}
    </span>
  );
}

// Colored pill for qualitative levels (الأولوية / التصنيف / كثافة الاستخدام /
// أولوية التحول / مستوى التعقيد): high→red, medium→amber, low→green.
function LevelPill({ v }: { v?: string }) {
  const s = (v || '').trim();
  const high = /عالٍ|عالي|عالية|مرتفع|كبير|حرج|عاجل|قصو/.test(s);
  const mid = /متوسط|معتدل|متوسّط/.test(s);
  const low = /منخفض|بسيط|قليل|ضعيف|محدود/.test(s);
  const c = !s ? '#8A97AD' : high ? '#C0392B' : mid ? '#B45309' : low ? '#0B8A4B' : '#1D4ED8';
  const bg = !s ? '#EEF2F8' : high ? '#FDECEA' : mid ? '#FFF7EB' : low ? '#EAF7F0' : '#EAF1FE';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: c, borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 800 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flex: 'none' }} />
      {s || '—'}
    </span>
  );
}

function AutoLevel({ pct, level }: { pct?: number; level?: string }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#13213C' }}>{p}%</span>
        {level && <span style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 400 }}>{level}</span>}
      </div>
      <div style={{ marginTop: 6, height: 6, background: '#EDF1F7', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: p + '%', background: '#2563EB', borderRadius: 999 }} />
      </div>
    </div>
  );
}

export function DetailPanel({ vm }: { vm: VM }) {
  const d = vm.detail!;
  // drawer tabs: البيانات / التنفيذ والإطلاق / السجل

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        direction: 'rtl',
      }}
    >
      {/* scrim */}
      <div
        onClick={d.onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8,18,40,.5)',
          animation: 'fadeIn .2s',
        }}
      />
      {/* panel */}
      <div
        data-r="panel"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 680,
          maxWidth: '97vw',
          background: '#F4F7FC',
          boxShadow: '-24px 0 70px -24px rgba(2,12,35,.5)',
          animation: 'slideInRight .3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ---------- HEADER ---------- */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E7ECF4',
            padding: '16px 22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: d.typeBg,
                  color: d.typeColor,
                  flex: 'none',
                }}
              >
                {d.typeLabel}
              </span>
              <span
                className="hd"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#13213C',
                  lineHeight: 1.4,
                }}
              >
                {d.title}
              </span>
            </div>
            <button
              onClick={d.onClose}
              style={{
                flex: 'none',
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
                background: '#fff',
                color: '#54627B',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ---------- BODY ---------- */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'contents' }}>
          {/* ===== INFO GRID ===== */}
          <div
            className="rgrid-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 10,
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>الحالة</div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: d.wfBg,
                  color: d.wfChip,
                }}
              >
                {d.wfLabel}
              </span>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
                borderRadius: 13,
                padding: '12px 13px',
              }}
            >
              <div style={labelStyle}>دفعة الإطلاق</div>
              <div style={valueStyle}>{(d.execBatchName || '').replace('إطلاق ', '') || '—'}</div>
            </div>
          </div>
          </div>

          <div style={{ display: 'contents' }}>
          {/* Funded banner */}
          {d.dFunded && (
            <div
              style={{
                background: '#EDF9F1',
                border: '1px solid #D5EEE0',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 'none', marginTop: 1 }}>
                <Icon d={WALLET} size={20} color="#0B8A4B" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#0B8A4B', fontWeight: 800, fontSize: 13 }}>
                  معتمد من اللجنة الوطنية
                </div>
                <div style={{ color: '#0B7C57', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  {d.dFundedText}
                </div>
              </div>
            </div>
          )}
          </div>

          <div style={{ display: 'contents' }}>
          {/* Returned banner */}
          {d.isReturned && (
            <div
              style={{
                background: '#FFF4F4',
                border: '1px solid #F6D6D9',
                borderRadius: 11,
                padding: '11px 13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#C0303B',
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Icon d={SPEECH} size={16} color="#C0303B" />
                {d.retBannerLabel}
              </div>
              {d.retNote && (
                <div style={{ color: '#7A4A4E', fontSize: 12, marginTop: 4 }}>{d.retNote}</div>
              )}
            </div>
          )}
          </div>

          <div style={{ display: 'contents' }}>
          {/* Main detail — grouped sections (no outer card) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* --- STRATEGY TASK (حصر قائمة المهام) --- */}
            {d.isStgTask && (
              <>
                <DetailSecHead title="بيانات المهمة" />
                <DetailGrid cols={2}>
                  <DetailCell label="المحور">{d.axis}</DetailCell>
                  <DetailCell label="الأنشطة"><RichTextView html={(d.subActivities || '').replace(/\n/g, '<br/>')} style={valueStyle} /></DetailCell>
                </DetailGrid>
                <DetailGrid cols={3}>
                  <DetailCell label="القطاع المعني">{d.sector}</DetailCell>
                  <DetailCell label="الإدارة المعنية">{d.dept}</DetailCell>
                  <DetailCell label="القسم المعني">{d.section}</DetailCell>
                </DetailGrid>
                <DetailSecHead title="الأتمتة" />
                <DetailGrid cols={3}>
                  <DetailCell label="مستوى الأتمتة">{d.automationLevel}</DetailCell>
                  <DetailCell label="نسبة الأتمتة">{d.automationPct != null ? d.automationPct + '%' : '—'}</DetailCell>
                  <DetailCell label="نظام الأتمتة">{d.automationSystem}</DetailCell>
                </DetailGrid>
                <DetailSecHead title="التقييم (من 1 إلى 5)" />
                <DetailGrid cols={3}>
                  <DetailCell label="مستوى الأهمية">{d.importance}</DetailCell>
                  <DetailCell label="كثافة الاستخدام">{d.usageIntensity}</DetailCell>
                  <DetailCell label="مستوى الجاهزية">{d.readinessLevel}</DetailCell>
                </DetailGrid>
                <DetailGrid cols={3}>
                  <DetailCell label="مستوى الأثر المتوقع من التحول">{d.impactScore}</DetailCell>
                  <DetailCell label="قابلية التحول">{d.transformScore}</DetailCell>
                  <DetailCell label="وضوح المخرجات وقابليتها للمراجعة">{d.outputClarity}</DetailCell>
                </DetailGrid>
                <DetailGrid cols={3}>
                  <DetailCell label="مستوى المخاطر"><LevelPill v={d.riskLevel} /></DetailCell>
                  <DetailCell label="أولوية الاختيار">
                    {d.stgCalc ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E5EEFF', color: '#1D4ED8', borderRadius: 999, padding: '4px 12px', fontSize: 12.5, fontWeight: 800 }}>
                        {d.stgCalc.cat} · {d.stgCalc.total}/30
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailCell>
                  <DetailCell label="أولوية التحول">{d.transformYes}</DetailCell>
                </DetailGrid>
              </>
            )}

            {/* --- OPERATIONS PROCESS (حصر قائمة العمليات) --- */}
            {d.isOpsTask && (
              <>
                <DetailSecHead title="بيانات العملية" />
                <DetailGrid cols={d.supportFn ? 3 : 2}>
                  <DetailCell label="التصنيف">{d.opType}</DetailCell>
                  {d.supportFn ? <DetailCell label="نوع عملية الدعم المؤسسي">{d.supportFn}</DetailCell> : null}
                  <DetailCell label="الأنشطة الفرعية"><RichTextView html={(d.subActivities || '').replace(/\n/g, '<br/>')} style={valueStyle} /></DetailCell>
                </DetailGrid>
                <DetailGrid cols={3}>
                  <DetailCell label="القطاع المعني">{d.sector}</DetailCell>
                  <DetailCell label="الإدارة المعنية">{d.dept}</DetailCell>
                  <DetailCell label="القسم المعني">{d.section}</DetailCell>
                </DetailGrid>
                <DetailSecHead title="الأتمتة" />
                <DetailGrid cols={3}>
                  <DetailCell label="هل النشاط/العملية مؤتمت؟">{d.isAutomated}</DetailCell>
                  <DetailCell label="نظام الأتمتة">{d.automationSystem}</DetailCell>
                  <DetailCell label="نسبة الأتمتة">{d.automationPct != null ? d.automationPct + '%' : '—'}</DetailCell>
                </DetailGrid>
                <DetailSecHead title="التقييم (من 1 إلى 5)" />
                <DetailGrid cols={3}>
                  <DetailCell label="كثافة النشاط/العملية">{d.usageIntensity}</DetailCell>
                  <DetailCell label="الجاهزية للتحول">{d.readinessLevel}</DetailCell>
                  <DetailCell label="مستوى الأثر المتوقع من التحول">{d.impactScore}</DetailCell>
                </DetailGrid>
                <DetailGrid cols={3}>
                  <DetailCell label="مستوى التعقيد">{d.complexity}</DetailCell>
                  <DetailCell label="القابلية للتحول">{d.transformScore}</DetailCell>
                  <DetailCell label="أولوية التحول">{d.transformYes}</DetailCell>
                </DetailGrid>
                {d.notesText ? (
                  <DetailGrid cols={1}>
                    <DetailCell label="الملاحظات"><RichTextView html={(d.notesText || '').replace(/\n/g, '<br/>')} style={valueStyle} /></DetailCell>
                  </DetailGrid>
                ) : null}
              </>
            )}

            {/* --- OUTCOMES for non-project types (entered in step 3) --- */}

            {/* --- SERVICE --- */}
            {d.isSvc && (
              <>
                <DetailSecHead title="بيانات الخدمة" />
                <DetailGrid cols={2}>
                  <DetailCell label="الخدمة الفرعية">{d.subService || '—'}</DetailCell>
                  <DetailCell label="القطاع المعني">{d.sector || '—'}</DetailCell>
                  <DetailCell label="الإدارة المعنية">{d.dept || '—'}</DetailCell>
                  <DetailCell label="القسم المعني">{d.section || '—'}</DetailCell>
                </DetailGrid>

                <DetailSecHead title="مصفوفة أولوية الاختيار" />
                <DetailGrid cols={3}>
                  <DetailCell label="كثافة الاستخدام"><LevelPill v={d.usageIntensity} /></DetailCell>
                  <DetailCell label="مستوى التعقيد"><LevelPill v={d.complexity} /></DetailCell>
                  <DetailCell label="مستوى الجاهزية"><LevelPill v={d.readinessLevel} /></DetailCell>
                </DetailGrid>
                <DetailGrid cols={2}>
                  <DetailCell label="أولوية الاختيار">
                    {d.svcSelPriority ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E5EEFF', color: '#1D4ED8', borderRadius: 999, padding: '4px 12px', fontSize: 12.5, fontWeight: 800 }}>
                        الأولوية {d.svcSelPriority}
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailCell>
                  <DetailCell label="أولوية التحول">{d.transformYes || '—'}</DetailCell>
                </DetailGrid>
              </>
            )}
          </div>
          </div>

          <div style={{ display: 'contents' }}>
          {/* ===== EXECUTION PLAN (as entered by the coordinator) ===== */}
          {d.execBatchName && (
            <div style={sectionCard}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#13213C', marginBottom: 10 }}>
                خطة التنفيذ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EAF0FE',
                    color: '#2563EB',
                    borderRadius: 999,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {d.execBatchName}
                </span>
                {d.execBatchPeriod && (
                  <span style={{ fontSize: 11.5, color: '#8A97AD', fontWeight: 700 }}>
                    {d.execBatchPeriod}
                  </span>
                )}
              </div>
            </div>
          )}
          </div>

          <div style={{ display: 'contents' }}>
          {/* ===== PLANNED LAUNCHES (read-only, pre-launch stages) ===== */}
          </div>

          <div style={{ display: 'contents' }}>
          {/* ===== RECOMMENDATION ===== */}
          {d.showReco && (
            <>
              <div
                style={{
                  background: '#F5F8FD',
                  border: '1px solid #E1E9F5',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#8A97AD',
                    marginBottom: 12,
                  }}
                >
                  توصية الذكاء الاصطناعي للتحول
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: d.scoreColor,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {d.scoreV}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: d.scoreColor }}>
                      {d.scoreLabel}
                    </div>
                    <div
                      style={{ fontSize: 12, color: '#54627B', lineHeight: 1.7, marginTop: 4 }}
                    >
                      {d.scoreExpl}
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
          </div>

          <div style={{ display: 'contents' }}>
          {/* ===== APPROVAL LOG ===== */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E7ECF4', boxShadow: '0 6px 20px -10px rgba(16,36,79,.12)',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#13213C',
                marginBottom: 14,
              }}
            >
              سجل الاعتمادات والإجراءات
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {d.logRows.map((lg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: lg.color,
                      marginTop: 4,
                      flex: 'none',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2D49' }}>
                      {lg.action}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9AA6BC', marginTop: 2 }}>{lg.sub}</div>
                    {lg.hasNote && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#54627B',
                          background: '#F7F9FD',
                          border: '1px solid #EBEFF6',
                          borderRadius: 10,
                          padding: '8px 10px',
                          marginTop: 6,
                          lineHeight: 1.6,
                        }}
                      >
                        {lg.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          <div style={{ display: 'contents' }}>
          </div>

          <div style={{ display: 'contents' }}>
          </div>

        </div>

        {/* ---------- FOOTER ACTION BAR ---------- */}
        {(d.canApproveGateView || d.canEdit) && (
          <div
            style={{
              background: '#fff',
              borderTop: '1px solid #E7ECF4',
              padding: '13px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {d.canApproveGateView ? (
              <>
                {/* same sequence as the cards: اعتماد ← رفض ← طلب تفاصيل، والتعديل أخيراً */}
                <button
                  onClick={d.onApprove}
                  style={{ flex: 1, background: '#0B8A4B', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  اعتماد
                </button>
                <button
                  onClick={d.onReject}
                  style={{ flex: 'none', background: '#fff', color: '#C0303B', border: '1px solid #F0C4C8', borderRadius: 12, padding: '13px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  رفض
                </button>
                <button
                  onClick={d.onReqInfo}
                  style={{ flex: 1, background: '#fff', color: '#33405A', border: '1px solid #E7ECF4', borderRadius: 12, padding: '13px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  طلب تفاصيل إضافية
                </button>
                {d.showMenuEdit && (
                  <button
                    title="تعديل البيانات"
                    aria-label="تعديل البيانات"
                    onClick={d.onEdit}
                    style={{ width: 48, height: 48, flex: 'none', borderRadius: 12, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={16} />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={d.onEdit}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 20px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
                }}
              >
                <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" size={16} color="#fff" />
                {d.editLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

