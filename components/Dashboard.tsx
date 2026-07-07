'use client';
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';
import { Tour, TOUR_EVENT, type TourStep } from './Tour';
import { LAUNCH_TYPES } from '@/lib/domain';

// first-login walkthrough: sections are matched by [data-tour] anchors and
// steps whose anchor is not rendered for the current role are skipped
const TOUR_STEPS: TourStep[] = [
  {
    sel: '[data-tour="profile"]',
    title: 'الملف الشخصي وفريق العمل',
    desc: 'من الصورة الرمزية تُفتح قائمة الملف الشخصي، ومنها الوصول إلى «فريق العمل» لتشكيل فريق جهتكم ودعوة منسّقي المسارات لكل مسار من مسارات التحول.',
  },
  {
    sel: '[data-tour="banner"]',
    title: 'نظرة عامة على المشروع',
    desc: 'يعرض هذا القسم المرحلة الحالية من المشروع وموعدها النهائي مع عدّ تنازلي، إلى جانب مراحل البرنامج الرئيسية.',
  },
  {
    sel: '[data-tour="kpis"]',
    title: 'مؤشرات الأداء',
    desc: 'بطاقات تلخّص أعداد المشاريع والعمليات والخدمات، ونسب الإنجاز والتحول والأتمتة، والميزانيات التقديرية — وتتحدّث تلقائياً كلما اكتملت البيانات.',
  },
  {
    sel: '[data-tour="stages"]',
    title: 'مراحل التنفيذ والإطلاق',
    desc: 'لكل مرحلة بطاقة تعرض تكلفة التنفيذ وتكلفة الإطلاق وما تتضمنه من مشاريع وعمليات وخدمات، مع خطط الإطلاق المرتبطة بها وإدارتها مباشرة من الصفحة.',
  },
  {
    sel: '[data-tour="filters"]',
    title: 'المرشحات والبحث',
    desc: 'من هنا يمكنكم تصفية القائمة حسب النوع والحالة، والبحث بالاسم أو الوصف للوصول السريع إلى أي مشروع أو مبادرة أو عملية أو خدمة.',
  },
  {
    sel: '[data-tour="add"]',
    title: 'الإضافة',
    desc: 'من هنا تتم إضافة مشروع أو مبادرة أو عملية أو خدمة جديدة إلى محفظة جهتكم.',
  },
  {
    sel: '[data-tour="basket"]',
    title: 'السلة',
    desc: 'تجمع المشاريع والعمليات والخدمات الجاهزة للاعتماد أو الترشيح في مكان واحد قبل إرسالها، وتظهر عليها إشارة عند وجود ما ينتظركم.',
  },
  {
    sel: '[data-tour="cards"]',
    title: 'بطاقات المشاريع والعمليات والخدمات',
    desc: 'كل بطاقة تمثّل مشروعاً أو مبادرة أو عملية أو خدمة مع حالتها ونسبة إنجازها. اضغطوا على أي بطاقة لاستعراض التفاصيل واستكمال البيانات.',
  },
];

// ---------------------------------------------------------------------------
// Small hover-aware wrappers (the prototype used `style-hover`).
// ---------------------------------------------------------------------------
function HoverDiv({
  base,
  hover,
  children,
  onClick,
  ...rest
}: {
  base: CSSProperties;
  hover?: CSSProperties;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  [k: string]: unknown;
}) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...(h ? hover : null) }}
      {...(rest as object)}
    >
      {children}
    </div>
  );
}

function HoverButton({
  base,
  hover,
  children,
  onClick,
  title,
}: {
  base: CSSProperties;
  hover?: CSSProperties;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...(h ? hover : null) }}
    >
      {children}
    </button>
  );
}

const stop = (e: React.MouseEvent) => e.stopPropagation();

// shared brand gradient: deep navy (right, RTL reading start) → vivid blue
const BLUE_GRAD = 'linear-gradient(270deg,#0B1B3A 0%,#16408F 100%)';

// small heading naming each line/section of a page
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="hd" style={{ fontSize: 13, fontWeight: 800, color: '#33415C', marginBottom: -4 }}>
      {children}
    </div>
  );
}

// ---- entity overview: cost + inputs donut cards, then per-stream cards ----
const EO_ARROW = 'M17 17 7 7M13 7H7v6';
const EO_WALLET = 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z';
const EO_GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';

function EoDonut({ frac, dark, light, top, center, sub }: { frac: number; dark: string; light: string; top?: string; center: string; sub: string }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ position: 'relative', flex: 'none', width: 150, height: 150 }}>
      <svg viewBox="0 0 110 110" width={150} height={150}>
        <circle cx="55" cy="55" r={R} fill="none" stroke="#EDF1F8" strokeWidth="13" />
        <circle cx="55" cy="55" r={R} fill="none" stroke={light} strokeWidth="13"
          strokeDasharray={`${(1 - frac) * C} ${C}`} strokeDashoffset={-(frac * C)} transform="rotate(-90 55 55)" />
        <circle cx="55" cy="55" r={R} fill="none" stroke={dark} strokeWidth="13"
          strokeDasharray={`${frac * C} ${C}`} transform="rotate(-90 55 55)" strokeLinecap="butt" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 22px' }}>
        {top && <span style={{ fontSize: 9.5, color: '#9AA6BC', fontWeight: 400, lineHeight: 1.3 }}>{top}</span>}
        <span style={{ fontSize: 22, fontWeight: 800, color: '#13213C', lineHeight: 1.15 }}>{center}</span>
        <span style={{ fontSize: 9.5, color: '#9AA6BC', fontWeight: 400, marginTop: 2, lineHeight: 1.3 }}>{sub}</span>
      </div>
    </div>
  );
}

// Multi-segment donut: each status is its own arc, coloured to match the
// legend so the chart and the list read as one system.
function EoDonutSeg({ segs, dim, top, center, sub }: { segs: { frac: number; color: string; key: string }[]; dim?: string | null; top?: string; center: string; sub: string }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const GAP = 2.2; // small white gap between segments (viewBox units)
  let acc = 0;
  return (
    <div style={{ position: 'relative', flex: 'none', width: 150, height: 150 }}>
      <svg viewBox="0 0 110 110" width={150} height={150}>
        <circle cx="55" cy="55" r={R} fill="none" stroke="#EDF1F8" strokeWidth="13" />
        {segs.map((sgm) => {
          const off = acc;
          acc += sgm.frac;
          const len = Math.max(0, sgm.frac * C - GAP);
          return (
            <circle
              key={sgm.key}
              cx="55"
              cy="55"
              r={R}
              fill="none"
              stroke={sgm.color}
              strokeWidth="13"
              strokeLinecap="butt"
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-(off * C)}
              transform="rotate(-90 55 55)"
              style={{ opacity: dim && dim !== sgm.key ? 0.28 : 1, transition: 'opacity .12s' }}
            />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 22px' }}>
        {top && <span style={{ fontSize: 9.5, color: '#9AA6BC', fontWeight: 400, lineHeight: 1.3 }}>{top}</span>}
        <span style={{ fontSize: 22, fontWeight: 800, color: '#13213C', lineHeight: 1.15 }}>{center}</span>
        <span style={{ fontSize: 9.5, color: '#9AA6BC', fontWeight: 400, marginTop: 2, lineHeight: 1.3 }}>{sub}</span>
      </div>
    </div>
  );
}

function EoCardHead({ title, iconD, onArrow }: { title: string; iconD: string; onArrow?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 36, height: 36, borderRadius: 11, background: '#EAF1FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon d={iconD} size={18} color="#2563EB" />
        </span>
        <span className="hd" style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>{title}</span>
        <InfoTip text={title} />
      </div>
      <button
        onClick={onArrow}
        aria-label="عرض التفاصيل"
        style={{ width: 34, height: 34, borderRadius: 10, background: '#EAF1FE', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
      >
        <Icon d={EO_ARROW} size={15} color="#2563EB" />
      </button>
    </div>
  );
}

function EntityOverview({ vm }: { vm: VM }) {
  const s = vm.store;
  const cc = vm.costCard;
  const ic = vm.inputsCard;
  const [hovIn, setHovIn] = useState<string | null>(null);
  const [hovCost, setHovCost] = useState<string | null>(null);
  const [stageTab, setStageTab] = useState<'all' | 'projinit' | 'operation' | 'service'>('all');
  const [hovBar, setHovBar] = useState<string | null>(null);
  const isCoord = vm.role === 'coord';
  const sec2Cards = isCoord ? vm.typeOverviewCards : vm.streamOverviewCards;
  const sec2Title = isCoord ? 'التوزيع حسب نوع المدخل' : 'نظرة عامة حسب المسارات';
  const sec2Sub = isCoord ? 'تفاصيل كل نوع: المدخلات، المراحل، والتكاليف' : 'توزيع المدخلات والتكاليف على المسارات الخمسة';
  const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 };
  const money = (label: string) => {
    const p = label.split(' ');
    return { num: p[0], unit: p.slice(1).join(' ') };
  };
  const costTot = money(cc.totalLabel);
  const clampFrac = (n: number) => Math.min(0.95, Math.max(0.05, n));

  // inputs legend items (hoverable)
  const inItems = [
    { key: 'capable', label: 'قابل للتحويل', v: ic.capable, dot: '#2563EB', square: true, bold: true },
    { key: 'underDev', label: 'قيد التطوير', v: ic.underDev, dot: '#3B82F6', square: false, bold: false, sub: true },
    { key: 'developed', label: 'تم التطوير', v: ic.developed, dot: '#60A5FA', square: false, bold: false, sub: true },
    { key: 'launched', label: 'تم الإطلاق', v: ic.launched, dot: '#93C5FD', square: false, bold: false, sub: true },
    { key: 'notCapable', label: 'غير قابل للتحويل', v: ic.notCapable, dot: '#C7D9F5', square: true, bold: true, divider: true },
  ];
  const inHov = inItems.find((x) => x.key === hovIn);
  const inDonut = inHov
    ? { center: String(inHov.v), sub: inHov.label }
    : { center: String(ic.total), sub: 'إجمالي المدخلات' };
  // multi-colour segments — each status coloured to match its legend marker
  const inSegs = (() => {
    const t = ic.total || 1;
    const captured = Math.max(0, ic.capable - ic.underDev - ic.developed - ic.launched);
    return [
      { key: 'capable', frac: captured / t, color: '#2563EB' },
      { key: 'underDev', frac: ic.underDev / t, color: '#3B82F6' },
      { key: 'developed', frac: ic.developed / t, color: '#60A5FA' },
      { key: 'launched', frac: ic.launched / t, color: '#93C5FD' },
      { key: 'notCapable', frac: ic.notCapable / t, color: '#C7D9F5' },
    ].filter((x) => x.frac > 0.0001);
  })();

  // cost legend items (hoverable)
  const costItems = [
    { key: 'exec', label: 'تكلفة التنفيذ الإجمالية', short: 'تكلفة التنفيذ', val: cc.execLabel, pct: cc.execPct, frac: cc.execFrac, c: '#2563EB' },
    { key: 'launch', label: 'تكلفة الإطلاق الإجمالية', short: 'تكلفة الإطلاق', val: cc.launchLabel, pct: cc.launchPct, frac: 1 - cc.execFrac, c: '#BFD3F5' },
  ];
  const costHov = costItems.find((x) => x.key === hovCost);
  const costM = costHov ? money(costHov.val) : costTot;
  const costDonut = costHov
    ? { frac: clampFrac(costHov.frac), light: '#EDF1F8', top: costHov.short, center: costM.num, sub: costM.unit }
    : { frac: cc.execFrac, light: '#BFD3F5', top: 'الإجمالي', center: costTot.num, sub: costTot.unit };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ===== Section 1: التكلفة الإجمالية + إجمالي المدخلات ===== */}
      <div data-r="dash-top" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* --- إجمالي المدخلات (right) --- */}
        <div style={cardStyle}>
          <EoCardHead title="إجمالي المدخلات" iconD={EO_GRID} onArrow={() => s.setNavSection('all')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <EoDonutSeg segs={inSegs} dim={hovIn} center={inDonut.center} sub={inDonut.sub} />
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {inItems.map((r) => (
                <Fragment key={r.key}>
                  {r.divider && <div style={{ height: 1, background: '#EEF1F6', margin: '5px 0' }} />}
                  <div
                    onMouseEnter={() => setHovIn(r.key)}
                    onMouseLeave={() => setHovIn(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '6px 10px',
                      marginRight: r.sub ? 12 : 0,
                      borderRadius: 9,
                      background: hovIn === r.key ? '#EEF3FC' : 'transparent',
                      cursor: 'default',
                      transition: 'background .12s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: r.square ? 3 : '50%', background: r.dot, flex: 'none' }} />
                      <span className={r.bold ? 'hd' : undefined} style={{ fontSize: r.bold ? 13.5 : 12.5, fontWeight: r.bold ? 800 : 400, color: r.bold ? '#13213C' : '#6B7A93' }}>{r.label}</span>
                    </span>
                    <span style={{ fontSize: r.bold ? 15 : 13, fontWeight: 800, color: '#13213C' }}>{r.v}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* --- التكلفة الإجمالية (left) --- */}
        <div style={cardStyle}>
          <EoCardHead title="التكلفة الإجمالية" iconD={EO_WALLET} onArrow={() => s.setNavSection('launchplans')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <EoDonut frac={costDonut.frac} dark="#2563EB" light={costDonut.light} top={costDonut.top} center={costDonut.center} sub={costDonut.sub} />
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {costItems.map((r) => (
                <div
                  key={r.key}
                  onMouseEnter={() => setHovCost(r.key)}
                  onMouseLeave={() => setHovCost(null)}
                  style={{
                    background: hovCost === r.key ? '#EEF3FC' : '#F7F9FD',
                    border: '1px solid ' + (hovCost === r.key ? '#D8E3F5' : '#EEF1F6'),
                    borderRadius: 12,
                    padding: '11px 13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    cursor: 'default',
                    transition: 'background .12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#6B7A93', fontWeight: 400 }}>{r.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C', marginTop: 2 }}>{r.val}</div>
                    </div>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: r.c, flex: 'none' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', flex: 'none' }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Section 2: overview cards (by stream for entity · by type for coord) ===== */}
      <div>
        <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>{sec2Title}</div>
        <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>{sec2Sub}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginTop: -8 }}>
        {sec2Cards.map((st) => (
          <div key={st.id} style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, minHeight: 44 }}>
              <div className="hd" style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: '#13213C', lineHeight: 1.5, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{st.name}</div>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: '#EAF1FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon d={st.icon} size={18} color="#2563EB" />
              </span>
            </div>
            <div style={{ height: 1, background: '#EEF1F6' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400 }}>إجمالي المدخلات</span>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#13213C', lineHeight: 1 }}>{st.total}</span>
            </div>
            <div style={{ background: '#F7F9FD', border: '1px solid #EEF1F6', borderRadius: 12, padding: '12px 13px' }}>
              <div style={{ fontSize: 10.5, color: '#9AA6BC', fontWeight: 400, marginBottom: 8, textAlign: 'right' }}>إجمالي المدخلات حسب المرحلة</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const maxN = Math.max(...st.stages.map((x) => x.n), 1);
                  return st.stages.map((sg) => {
                    const pct = Math.max(6, Math.round((sg.n / maxN) * 100));
                    return (
                      <div key={sg.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#54627B', fontWeight: 400, flex: 'none', minWidth: 82, textAlign: 'right' }}>{sg.label}</span>
                        <div style={{ flex: 1, height: 9, background: '#E9EEF7', borderRadius: 999, position: 'relative', overflow: 'hidden', minWidth: 40 }}>
                          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: pct + '%', background: '#3B6FE8', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', flex: 'none', minWidth: 12, textAlign: 'left' }}>{sg.n}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div style={{ height: 1, background: '#EEF1F6', marginTop: 'auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6B7A93', fontWeight: 400 }}>تكلفة التنفيذ الإجمالية</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>{st.execLabel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6B7A93', fontWeight: 400 }}>تكلفة الإطلاق الإجمالية</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>{st.launchLabel}</span>
              </div>
              <div style={{ height: 1, background: '#EEF1F6', margin: '2px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="hd" style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>التكلفة الإجمالية</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB' }}>{st.totalLabel}</span>
              </div>
            </div>
            <button
              onClick={st.onOpen}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EAF1FE', color: '#1D4ED8', border: 'none', borderRadius: 11, padding: '10px 0', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              عرض المزيد
              <Icon d="M15 18l-6-6 6-6" size={12} color="#1D4ED8" />
            </button>
          </div>
        ))}
      </div>

      {/* ===== Section 3: التوزيع حسب المرحلة (coordinator only) ===== */}
      {isCoord && (() => {
        const sd = vm.stageDist[stageTab];
        const tabs = [
          { id: 'all', label: 'الكل' },
          { id: 'projinit', label: 'مشروع / مبادرة' },
          { id: 'operation', label: 'عملية' },
          { id: 'service', label: 'خدمة' },
        ] as const;
        const maxN = Math.max(...sd.stages.map((x) => x.n), 1);
        return (
          <>
            <div>
              <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>التوزيع حسب المرحلة</div>
              <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>توزيع المدخلات على المراحل — مرّر فوق الأعمدة للتفاصيل</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '18px 20px', marginTop: -8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 11, background: '#EAF1FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon d="M3 3v18h18M8 17V9M13 17V5M18 17v-7" size={17} color="#2563EB" />
                  </span>
                  <span className="hd" style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>التوزيع حسب المرحلة</span>
                </div>
                <div style={{ display: 'inline-flex', background: '#F1F5FB', borderRadius: 12, padding: 4, gap: 2, flexWrap: 'wrap' }}>
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setStageTab(t.id)}
                      style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: stageTab === t.id ? 700 : 400, background: stageTab === t.id ? '#fff' : 'transparent', color: stageTab === t.id ? '#1D4ED8' : '#6B7A93', boxShadow: stageTab === t.id ? '0 2px 6px -2px rgba(11,27,58,.25)' : 'none', transition: 'background .12s' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#13213C', lineHeight: 1 }}>{sd.total}</span>
                <span style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400 }}>إجمالي المدخلات</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 18, height: 200 }}>
                {sd.stages.map((sg) => {
                  const hpct = Math.max(6, Math.round((sg.n / maxN) * 100));
                  const on = hovBar === sg.label;
                  return (
                    <div
                      key={sg.label}
                      onMouseEnter={() => setHovBar(sg.label)}
                      onMouseLeave={() => setHovBar(null)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height: '100%', cursor: 'default' }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 800, color: on ? '#1D4ED8' : '#13213C', transition: 'color .12s' }}>{sg.n}</span>
                      <div style={{ position: 'relative', flex: 1, width: '100%', background: '#EEF3FB', borderRadius: 14, overflow: 'hidden', minHeight: 0 }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: hpct + '%', background: on ? '#1D4ED8' : '#3B6FE8', borderRadius: 14, transition: 'background .12s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#54627B', fontWeight: 400 }}>{sg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// small ⓘ affordance: hover / tap reveals a plain-language explanation
function InfoTip({ text, dark, flip }: { text: string; dark?: boolean; flip?: boolean }) {
  // flip: the popup grows to the LEFT by default (RTL); near the screen's
  // left edge it must grow to the right instead or it gets clipped
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', flex: 'none', verticalAlign: 'middle' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="معلومات"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `1px solid ${dark ? 'rgba(255,255,255,.45)' : '#C7D2E4'}`,
          background: 'transparent',
          color: dark ? 'rgba(255,255,255,.85)' : '#8A97AD',
          fontSize: 10,
          fontWeight: 800,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        i
      </button>
      {open && (
        <span
          style={{
            position: 'absolute',
            top: 22,
            ...(flip ? { left: -8 } : { right: -8 }),
            width: 240,
            background: '#0F1F3D',
            color: '#fff',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 11.5,
            fontWeight: 400,
            lineHeight: 1.8,
            zIndex: 60,
            boxShadow: '0 16px 40px -14px rgba(2,12,35,.55)',
            textAlign: 'right',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// Clean SVG donut: distribution of one type across the streams (blue family)
const CHART_COLORS = ['#2563EB', '#0F2C66', '#27C2F0', '#7EA6F4', '#B9CDF5'];

function PieCard({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const R = 34;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '15px 17px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7A93', lineHeight: 1.5 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <svg viewBox="0 0 90 90" width={104} height={104} style={{ flex: 'none' }}>
          <circle cx="45" cy="45" r={R} fill="none" stroke="#EDF1F8" strokeWidth="13" />
          {total > 0 &&
            data
              .filter((d) => d.value > 0)
              .map((d, i) => {
                const frac = d.value / total;
                const seg = (
                  <circle
                    key={d.label}
                    cx="45"
                    cy="45"
                    r={R}
                    fill="none"
                    stroke={CHART_COLORS[data.indexOf(d) % CHART_COLORS.length]}
                    strokeWidth="13"
                    strokeDasharray={`${frac * C} ${C}`}
                    strokeDashoffset={-acc * C}
                    transform="rotate(-90 45 45)"
                    strokeLinecap="butt"
                  />
                );
                acc += frac;
                return seg;
              })}
          <text
            x="45"
            y="50"
            textAnchor="middle"
            style={{ fontSize: 20, fontWeight: 800, fill: '#13213C', fontFamily: 'inherit' }}
          >
            {total}
          </text>
        </svg>
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 3,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                  flex: 'none',
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#54627B',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#13213C', flex: 'none' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Ranked horizontal bars: entities ordered by number of submissions
function RankBars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  // dozens of entities may participate — show the top five and expand on demand
  const TOP = 5;
  const [showAll, setShowAll] = useState(false);
  const max = rows.reduce((a, r) => Math.max(a, r.value), 0) || 1;
  const shown = showAll ? rows : rows.slice(0, TOP);
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '15px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7A93', lineHeight: 1.5 }}>{title}</div>
        {rows.length > TOP && (
          <button
            onClick={() => setShowAll((v) => !v)}
            style={{
              border: '1px solid #E7ECF4',
              background: '#fff',
              color: '#54627B',
              borderRadius: 9,
              padding: '5px 11px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flex: 'none',
            }}
          >
            {showAll ? 'عرض الأعلى فقط' : 'عرض الكل (' + rows.length + ')'}
          </button>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          marginTop: 12,
          ...(showAll ? { maxHeight: 300, overflowY: 'auto', paddingLeft: 4 } : {}),
        }}
      >
        {shown.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: i === 0 ? '#2563EB' : '#0F2C66',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#33415C',
                width: 200,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
            >
              {r.label}
            </span>
            <div style={{ flex: 1, height: 16, background: '#EDF1F8', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.round((r.value / max) * 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: i === 0 ? 'linear-gradient(270deg,#2563EB,#5B8DEF)' : '#0F2C66',
                }}
              />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', flex: 'none', minWidth: 22, textAlign: 'left' }}>
              {r.value}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400 }}>لا توجد بيانات بعد.</div>
        )}
      </div>
    </div>
  );
}

// One full-width line of statistics: cells separated by vertical dividers,
// small label on top and a large formatted number underneath
function StatBand({
  dark,
  items,
}: {
  dark?: boolean;
  items: {
    label: string;
    value: string;
    suffix?: string;
    chip?: string;
    info?: string;
    dist?: { label: string; value: number }[];
    mini?: { label: string; v: number }[];
    onOpen?: () => void;
  }[];
}) {
  return (
    <div
      data-r="statband"
      style={{
        display: 'flex',
        borderRadius: 16,
        ...(dark
          ? { background: BLUE_GRAD, color: '#fff' }
          : { background: '#fff', border: '1px solid #E7ECF4' }),
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          onClick={it.onOpen}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '15px 20px',
            borderLeft: i < items.length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,.16)' : '#EBEFF6'}` : 'none',
            cursor: it.onOpen ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: dark ? 'rgba(255,255,255,.8)' : '#6B7A93',
              lineHeight: 1.5,
              minHeight: 38,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <span style={{ minWidth: 0 }}>{it.label}</span>
            {it.info && <InfoTip text={it.info} dark={dark} />}
            {it.onOpen && (
              <span
                title="عرض البطاقات التفصيلية"
                style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', flex: 'none' }}
              >
                <Icon d="M15 18l-6-6 6-6" size={14} color={dark ? 'rgba(255,255,255,.7)' : '#9AA6BC'} />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
            <span
              style={{
                fontSize: 31,
                fontWeight: 800,
                color: dark ? '#fff' : '#13213C',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
              }}
            >
              {it.value}
              {it.suffix && <span style={{ fontSize: 17, fontWeight: 800, marginRight: 2 }}>{it.suffix}</span>}
            </span>
            {it.chip && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: dark ? 'rgba(255,255,255,.14)' : '#F0F4FB',
                  color: dark ? '#fff' : '#54627B',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {it.chip}
              </span>
            )}
          </div>
          {/* التوزيع حسب المسار — always visible, labelled */}
          {it.dist && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,.2)' : '#EBEFF6'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 400, color: dark ? 'rgba(255,255,255,.7)' : '#8A97AD' }}>
                التوزيع حسب المسار
              </div>
              {it.dist.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: dark ? '#fff' : '#13213C',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.label}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: dark ? '#fff' : '#13213C', flex: 'none' }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {it.mini && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,.2)' : '#EBEFF6'}`,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 400, color: dark ? 'rgba(255,255,255,.7)' : '#8A97AD', marginBottom: 7 }}>
                التوزيع حسب الحالة
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2,1fr)',
                  gap: 6,
                }}
              >
              {it.mini.map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: dark ? 'rgba(255,255,255,.08)' : '#F7F9FD',
                    border: `1px solid ${dark ? 'rgba(255,255,255,.14)' : '#EBEFF6'}`,
                    borderRadius: 10,
                    padding: '7px 10px',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: dark ? '#fff' : '#13213C', lineHeight: 1.5 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: dark ? '#fff' : '#13213C', marginTop: 1 }}>{m.v}</div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// «تنزيل التقرير» dropdown next to the view switcher: Excel / PowerPoint
function ExportMenu({ onExcel, onPpt }: { onExcel: () => void; onPpt: () => void }) {
  const [open, setOpen] = useState(false);
  const items = [
    {
      label: 'Excel',
      iconD: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 13l6 5M15 13l-6 5',
      iconBg: '#E3F6EC',
      iconColor: '#0B8A4B',
      onClick: onExcel,
    },
    {
      label: 'PowerPoint',
      iconD: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 13h4a2 2 0 0 1 0 4H9v-4zm0 0v5',
      iconBg: '#FCEEE6',
      iconColor: '#C2410C',
      onClick: onPpt,
    },
  ];
  return (
    <div style={{ position: 'relative', flex: 'none' }}>
      <HoverButton
        onClick={() => setOpen((o) => !o)}
        base={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 13px',
          border: '1px solid #E7ECF4',
          background: '#fff',
          borderRadius: 10,
          color: '#42506B',
          fontWeight: 800,
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        hover={{ borderColor: '#C7D6EE' }}
      >
        <Icon d="M12 3v12M7 10l5 5 5-5M5 21h14" size={15} />
        تنزيل التقرير
        <Icon d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={13} color="#8A97AD" />
      </HoverButton>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              minWidth: 170,
              background: '#fff',
              border: '1px solid #E7ECF4',
              borderRadius: 12,
              boxShadow: '0 20px 50px -18px rgba(2,12,35,.4)',
              zIndex: 31,
              overflow: 'hidden',
            }}
          >
            {items.map((it) => (
              <HoverDiv
                key={it.label}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                base={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 13px',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#42506B',
                }}
                hover={{ background: '#F7F9FD' }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: it.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon d={it.iconD} size={14} color={it.iconColor} />
                </span>
                {it.label}
              </HoverDiv>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Dashboard({ vm }: { vm: VM }) {
  const s = vm.store;
  // which launch row (in the launch manager popup) is expanded to show its items
  const [openLaunch, setOpenLaunch] = useState<string | null>(null);
  // مرحلة manage popups: assign items / manage launches for a given batch
  const [itemsMgrFor, setItemsMgrFor] = useState<string | null>(null);
  const [launchMgrFor, setLaunchMgrFor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  return (
    <div
      data-r="root"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#F7F9FD,#EEF2F9)',
        direction: 'rtl',
        // prevent an absolutely-positioned tooltip / wide analytics row from
        // introducing a horizontal scroll that clips content in RTL
        overflowX: 'hidden',
        // the fixed navigation rail owns the right edge of the screen
        paddingRight: 248,
      }}
    >
      {/* ===================== HEADER ===================== */}
      <div
        data-r="hdr"
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Role switcher: demo builds only (production role comes from the
              UAE PASS / IdP mapping wired by IT). */}
          {vm.showRoleSwitcher && (
            <div
              data-r="hdrpills"
              style={{
                display: 'flex',
                background: '#F4F7FC',
                border: '1px solid #E7ECF4',
                borderRadius: 12,
                padding: 3,
                gap: 2,
              }}
            >
              {vm.rolePills.map((p) => (
                <button
                  key={p.key}
                  onClick={p.onClick}
                  style={{
                    borderRadius: 9,
                    padding: '8px 13px',
                    fontWeight: 700,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    ...(p.active
                      ? { background: '#fff', color: '#1D4ED8', boxShadow: '0 1px 4px rgba(15,31,61,.10)', border: '1px solid #D8E3F5' }
                      : { background: 'transparent', color: '#54627B', border: '1px solid transparent' }),
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Phase countdown (moved out of the banner) */}
          {vm.showProgramBanner && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 44,
                padding: '0 13px',
                borderRadius: 12,
                border: '1px solid #E7ECF4',
                background: '#fff',
                color: '#54627B',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 400, color: '#6B7A93', whiteSpace: 'nowrap' }}>مرحلة {vm.banner.firstMsName}</span>
              {[
                { v: String(vm.banner.cd.days), l: 'يوم' },
                { v: vm.banner.cd.hh, l: 'ساعة' },
                { v: vm.banner.cd.mm, l: 'دقيقة' },
                { v: vm.banner.cd.ss, l: 'ثانية' },
              ].map((seg, si) => (
                <span key={seg.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {si > 0 && <span style={{ width: 1, height: 20, background: '#EBEFF6' }} />}
                  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                    <span dir="ltr" style={{ fontWeight: 800, color: '#13213C', fontSize: 13 }}>{seg.v}</span>
                    <span style={{ fontSize: 9, color: '#9AA6BC', fontWeight: 400 }}>{seg.l}</span>
                  </span>
                </span>
              ))}
              <InfoTip flip text={'الوقت المتبقي على الموعد النهائي لهذه المرحلة — يُرجى استكمال حصر وإدخال جميع المشاريع والمبادرات والعمليات والخدمات قبل انتهائه (' + vm.banner.curPhaseDeadlineFmt + ').'} />
            </div>
          )}

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={s.toggleNotifs}
              style={{
                position: 'relative',
                width: 38,
                height: 38,
                borderRadius: 11,
                border: '1px solid #E7ECF4',
                background: '#fff',
                color: '#54627B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
              {vm.hasUnread && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9,
                    background: '#E5484D',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  {vm.unreadLabel}
                </span>
              )}
            </button>

            {vm.notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 46,
                  left: 0,
                  width: 360,
                  background: '#fff',
                  border: '1px solid #E7ECF4',
                  borderRadius: 16,
                  boxShadow: '0 24px 60px -20px rgba(2,12,35,.45)',
                  zIndex: 40,
                  overflow: 'hidden',
                  animation: 'fadeUp .2s ease both',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F0F3F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#13213C' }}>الإشعارات</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9AA6BC' }}>
                    {vm.unreadLabel} غير مقروء
                  </span>
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {vm.notifs.map((n) => (
                    <HoverDiv
                      key={n.id}
                      onClick={n.onOpen}
                      base={{
                        display: 'flex',
                        gap: 11,
                        padding: '13px 16px',
                        borderBottom: '1px solid #F4F6FA',
                        cursor: 'pointer',
                      }}
                      hover={{ background: '#F7F9FD' }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          flex: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: n.iconBg,
                        }}
                      >
                        <Icon d={n.icon} size={17} color={n.iconColor} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', lineHeight: 1.45 }}>
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#9AA6BC',
                            fontWeight: 400,
                            marginTop: 2,
                            lineHeight: 1.5,
                          }}
                        >
                          {n.sub}
                        </div>
                        {n.act && (
                          <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
                            <button
                              onClick={(e) => {
                                stop(e);
                                n.onApprove();
                              }}
                              style={{
                                background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 13px',
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              اعتماد
                            </button>
                            <button
                              onClick={(e) => {
                                stop(e);
                                n.onReject();
                              }}
                              style={{
                                background: '#fff',
                                border: '1px solid #E7ECF4',
                                color: '#C0303B',
                                borderRadius: 8,
                                padding: '6px 11px',
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              رفض
                            </button>
                            <button
                              onClick={(e) => {
                                stop(e);
                                n.onReqInfo();
                              }}
                              style={{
                                background: '#fff',
                                border: '1px solid #E7ECF4',
                                color: '#54627B',
                                borderRadius: 8,
                                padding: '6px 11px',
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              طلب معلومات
                            </button>
                          </div>
                        )}
                      </div>
                      {n.unread && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#2563EB',
                            flex: 'none',
                            marginTop: 5,
                          }}
                        />
                      )}
                    </HoverDiv>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar / profile */}
          <div data-tour="profile" style={{ position: 'relative' }}>
            <div
              onClick={s.toggleProfile}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              {vm.profileInitials}
            </div>
            {vm.profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 46,
                  left: 0,
                  width: 230,
                  background: '#fff',
                  border: '1px solid #E7ECF4',
                  borderRadius: 14,
                  boxShadow: '0 24px 60px -20px rgba(2,12,35,.45)',
                  zIndex: 40,
                  overflow: 'hidden',
                  animation: 'fadeUp .2s ease both',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F0F3F8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: 'linear-gradient(135deg,#2E74EE,#27C2F0)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12.5,
                      flex: 'none',
                    }}
                  >
                    {vm.profileInitials}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C' }}>{vm.profileName}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9AA6BC',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {vm.profilePos}
                    </div>
                  </div>
                </div>
                <HoverDiv
                  onClick={s.openTeam}
                  base={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 16px',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#42506B',
                  }}
                  hover={{ background: '#F7F9FD' }}
                >
                  <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" size={16} />{' '}
                  فريق العمل
                </HoverDiv>
                <HoverDiv
                  onClick={s.logout}
                  base={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 16px',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#D23B45',
                    borderTop: '1px solid #F0F3F8',
                  }}
                  hover={{ background: '#FCEEEF' }}
                >
                  <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} /> تسجيل الخروج
                </HoverDiv>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* ===================== WORK AREA ===================== */}
      <div
        data-r="work"
        style={{ display: 'flex', gap: 16, padding: '16px 24px 44px', alignItems: 'flex-start' }}
      >
        {/* Sidebar navigation — full-height panel on the right edge */}
        <aside
          data-r="rail"
          style={{
            width: 248,
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
          {/* brand: both logos side by side */}
          <div
            data-r="brand"
            style={{
              padding: '14px 14px 12px',
              borderBottom: '1px solid #F0F3F8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="assets/uae-crest.png" alt="UAE" style={{ height: 46, flex: 'none' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="assets/logo.png" alt="logo" style={{ height: 46, minWidth: 0, objectFit: 'contain' }} />
          </div>
          {/* navigation */}
          <div data-r="navlist" style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {vm.navItems.map((n) => (
            <button
              key={n.key}
              onClick={n.onClick}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: n.sub ? '9px 13px' : '11px 13px',
                marginRight: n.sub ? 22 : 0,
                borderRadius: 11,
                border: 'none',
                borderRight: n.sub ? '2px solid #EBEFF6' : 'none',
                borderTopRightRadius: n.sub ? 0 : 11,
                borderBottomRightRadius: n.sub ? 0 : 11,
                background: n.active ? '#EAF1FE' : 'transparent',
                color: n.active ? '#1D4ED8' : '#42506B',
                fontWeight: n.active ? 800 : 400,
                fontSize: n.sub ? 12.5 : 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'right',
              }}
            >
              {n.active && (
                <span
                  style={{
                    position: 'absolute',
                    right: -12,
                    top: 9,
                    bottom: 9,
                    width: 3.5,
                    borderRadius: 999,
                    background: '#2563EB',
                  }}
                />
              )}
              <Icon d={n.icon} size={n.sub ? 14 : 16} color={n.active ? '#2563EB' : '#8A97AD'} />
              {n.label}
            </button>
          ))}
          </div>
          {/* basket entry (moved from the top bar into the side menu) */}
          {vm.showBasket && (
            <div data-tour="basket" style={{ padding: '4px 12px 0' }}>
              <button
                onClick={s.openBasket}
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 13px',
                  borderRadius: 11,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#42506B',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'right',
                }}
              >
                <Icon d="M5 8h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z M9 8V6a3 3 0 0 1 6 0v2" size={16} color="#2563EB" />
                السلة
                {vm.hasBasketBadge && (
                  <span
                    style={{
                      marginInlineStart: 'auto',
                      minWidth: 20,
                      height: 20,
                      padding: '0 5px',
                      borderRadius: 10,
                      background: '#E5484D',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {vm.basketBadge}
                  </span>
                )}
              </button>
            </div>
          )}
          {/* bottom: onboarding guide */}
          <div data-r="railhelp" style={{ borderTop: '1px solid #F0F3F8', padding: 12 }}>
            <div style={{ background: '#EAF1FE', border: '1px solid #DCE7FA', borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div className="hd" style={{ fontSize: 14, fontWeight: 800, color: '#13213C' }}>دليل الاستخدام</div>
                <span
                  style={{
                    flex: 'none',
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px -5px rgba(29,78,216,.4)',
                  }}
                >
                  <Icon d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" size={18} color="#2563EB" />
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7A93', fontWeight: 400, lineHeight: 1.7, marginTop: 8, textAlign: 'right' }}>
                تعرّف على آلية تسجيل المدخلات ومتابعتها عبر مراحل المشروع.
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(TOUR_EVENT))}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: BLUE_GRAD,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '11px 0',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                فتح الدليل
              </button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {vm.navSection === 'overview' && (
          <>
      {/* ===================== BANNER + STEPPER (entity/coord only) ===================== */}
      {vm.showProgramBanner && (
      <div style={{ margin: '2px 0 -4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="hd" style={{ fontSize: 22, fontWeight: 800, color: '#13213C' }}>
            {vm.banner.pageTitle}
          </div>
          <div style={{ fontSize: 12.5, color: '#6B7A93', fontWeight: 400, marginTop: 6, maxWidth: 620, lineHeight: 1.7 }}>
            {vm.banner.subtitle}
          </div>
        </div>
        {vm.showAddBtn && (
          <button
            onClick={s.openCreate}
            style={{
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
              color: '#fff',
              border: 'none',
              borderRadius: 11,
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: '0 10px 22px -10px rgba(11,27,58,.8)',
              fontFamily: 'inherit',
            }}
          >
            <Icon d="M12 5v14M5 12h14" size={17} strokeWidth={2.2} /> إضافة جديدة
          </button>
        )}
      </div>
      )}

          {/* Entity overview — redesigned first section (cost + inputs donuts)
              and second section (per-stream cards) */}
          {(vm.role === 'entity' || vm.role === 'coord') && <EntityOverview vm={vm} />}

          {/* KPI bands (coord / path): counts band only */}
          {vm.notAiRole && vm.role !== 'entity' && vm.role !== 'coord' && (
            <div data-tour="kpis" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionLabel>الأعداد الإجمالية</SectionLabel>
              <div data-r="kpirow">
                <StatBand
                  items={[
                    {
                      label: 'إجمالي المدخلات',
                      value: String(vm.kpis.total),
                      info: 'إجمالي ' + vm.typesPhrase + ' المسجّلة ضمن نطاق اطلاعك. اضغطوا على البطاقة لاستعراض البطاقات التفصيلية.',
                      dist: vm.showStreamDist ? vm.kpiDist.total : undefined,
                      mini: vm.kpiBreak.total,
                      onOpen: () => s.setNavSection('all'),
                    },
                    {
                      label: 'المشاريع / المبادرات',
                      value: String(vm.kpis.projInit),
                      info: 'عدد المشاريع والمبادرات المسجّلة ضمن نطاق اطلاعك في مسارات التحول. اضغطوا على البطاقة لاستعراض البطاقات التفصيلية.',
                      dist: vm.showStreamDist ? vm.kpiDist.projInit : undefined,
                      mini: vm.kpiBreak.projInit,
                      onOpen: () => s.setNavSection('projects'),
                    },
                    ...(vm.showOpsKpi
                      ? [
                          {
                            label: 'العمليات',
                            value: String(vm.kpis.operations),
                            info: 'عدد العمليات التخصصية وعمليات الدعم المؤسسي المسجّلة للتحول. اضغطوا على البطاقة لاستعراض البطاقات التفصيلية.',
                            dist: vm.showStreamDist ? vm.kpiDist.operations : undefined,
                            mini: vm.kpiBreak.operations,
                            onOpen: () => s.setNavSection('operations'),
                          },
                        ]
                      : []),
                    ...(vm.showSvcKpi
                      ? [
                          {
                            label: 'الخدمات',
                            value: String(vm.kpis.services),
                            info: 'عدد الخدمات المسجّلة للتحول في مسار الخدمات. اضغطوا على البطاقة لاستعراض البطاقات التفصيلية.',
                            dist: vm.showStreamDist ? vm.kpiDist.services : undefined,
                            mini: vm.kpiBreak.services,
                            onOpen: () => s.setNavSection('services'),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>
          )}

          {/* Committee analytics (ai) — national overview */}
          {vm.isAiRole && (
            <>
              {/* page heading */}
              <div style={{ margin: '2px 0 -4px' }}>
                <div className="hd" style={{ fontSize: 22, fontWeight: 800, color: '#13213C' }}>لوحة متابعة مشروع الذكاء الاصطناعي المساعد</div>
                <div style={{ fontSize: 12.5, color: '#6B7A93', fontWeight: 400, marginTop: 6, maxWidth: 700, lineHeight: 1.7 }}>منصة وطنية لمتابعة مدخلات الجهات الحكومية، وتصنيفها حسب المسارات، وحالة الترشيح والاعتماد.</div>
              </div>

              {/* Section 1: المؤشرات الوطنية العامة */}
              <div>
                <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>المؤشرات الوطنية العامة</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>ملخص شامل لحالة مشاركة الجهات والمدخلات المسجلة ضمن المشروع.</div>
              </div>
              <div data-r="kpi" data-tour="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13, marginTop: -8 }}>
                <CommitteeKpi value={vm.aiStats.entCount} label="الجهات المشاركة" info="عدد الجهات الاتحادية التي قدّمت مشاريع أو عمليات أو خدمات." />
                <CommitteeKpi value={vm.aiStats.total} label="إجمالي المدخلات المسجلة" info="كل ما قدّمته الجهات عبر مسارات المشروع ووصل إلى اللجنة الوطنية — من مشاريع ومبادرات وعمليات وخدمات." />
                <CommitteeKpi value={vm.aiStats.nominated} label="المدخلات المرشحة من رؤساء المسارات" dot="#E68A1E" info="ما رشّحه رؤساء المسارات لاعتماد اللجنة الوطنية." />
                <CommitteeKpi value={vm.aiStats.funded} label="المدخلات المعتمدة" dot="#12B76A" info="ما اعتمدته اللجنة الوطنية ضمن المشروع." />
              </div>

              {/* Section 2: متابعة المدخلات حسب المسارات */}
              <div>
                <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>متابعة المدخلات حسب المسارات</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>عرض تفصيلي لحجم مشاركة الجهات وتصنيف المدخلات المرتبطة بكل مسار.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginTop: -8 }}>
                {vm.committeeStreamCards.map((st) => (
                  <div key={st.id} style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, minHeight: 44 }}>
                      <div className="hd" style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: '#13213C', lineHeight: 1.5, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{st.name}</div>
                      <span style={{ width: 38, height: 38, borderRadius: 11, background: '#EAF1FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        <Icon d={st.icon} size={18} color="#2563EB" />
                      </span>
                    </div>
                    <div style={{ height: 1, background: '#EEF1F6' }} />
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400 }}>الجهات المشاركة</span>
                      <span style={{ fontSize: 30, fontWeight: 800, color: '#13213C', lineHeight: 1 }}>{st.entCount}</span>
                    </div>
                    <div style={{ background: '#F7F9FD', border: '1px solid #EEF1F6', borderRadius: 12, padding: '12px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
                        <span style={{ fontSize: 10.5, color: '#9AA6BC', fontWeight: 400 }}>تصنيف المدخلات</span>
                        <span style={{ fontSize: 11, color: '#9AA6BC', fontWeight: 400 }}>الإجمالي <span style={{ fontWeight: 800, color: '#13213C' }}>{st.total}</span></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(() => {
                          const maxN = Math.max(...st.byType.map((x) => x.n), 1);
                          return st.byType.map((tp) => {
                            const pct = Math.max(6, Math.round((tp.n / maxN) * 100));
                            return (
                              <div key={tp.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 12, color: '#54627B', fontWeight: 400, flex: 'none', minWidth: 94, textAlign: 'right' }}>{tp.label}</span>
                                <div style={{ flex: 1, height: 9, background: '#E9EEF7', borderRadius: 999, position: 'relative', overflow: 'hidden', minWidth: 34 }}>
                                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: pct + '%', background: '#3B6FE8', borderRadius: 999 }} />
                                </div>
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', flex: 'none', minWidth: 12, textAlign: 'left' }}>{tp.n}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={st.onOpen}
                      style={{ marginTop: 'auto', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EAF1FE', color: '#1D4ED8', border: 'none', borderRadius: 11, padding: '10px 0', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      عرض المزيد
                      <Icon d="M15 18l-6-6 6-6" size={12} color="#1D4ED8" />
                    </button>
                  </div>
                ))}
              </div>

            </>
          )}


          </>
          )}

          {/* ===== PORTFOLIO PAGES: stream summary cards + recap + list ===== */}
          {vm.sectionTitle && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>{vm.sectionTitle}</div>
                  {vm.batchChip && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#EEF3FC',
                        border: '1px solid #D8E3F5',
                        borderRadius: 999,
                        padding: '5px 7px 5px 12px',
                        fontSize: 12,
                        color: '#16408F',
                        fontWeight: 400,
                      }}
                    >
                      ضمن {vm.batchChip.label}
                      <button
                        onClick={vm.batchChip.onClear}
                        aria-label="إزالة تصفية المرحلة"
                        style={{
                          background: '#fff',
                          border: '1px solid #D8E3F5',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <Icon d="M18 6L6 18M6 6l12 12" size={10} color="#16408F" />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {/* stream summary cards — الكل first, click filters the page */}
              {vm.portfolioStreams.length > 2 && (
                <>
                <SectionLabel>مسارات التحول للذكاء الاصطناعي المساعد</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                  {vm.portfolioStreams.map((st) => (
                    <HoverDiv
                      key={st.id || 'all'}
                      onClick={st.onClick}
                      base={{
                        background: st.active ? '#EAF1FE' : '#fff',
                        border: '1px solid ' + (st.active ? '#B9CFF7' : '#E7ECF4'),
                        borderRadius: 14,
                        padding: '12px 14px',
                        cursor: 'pointer',
                      }}
                      hover={st.active ? {} : { borderColor: '#C7D6EE' }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: st.active ? '#1D4ED8' : '#6B7A93',
                          lineHeight: 1.5,
                          minHeight: 32,
                        }}
                      >
                        {st.name}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: st.active ? '#1D4ED8' : '#13213C', marginTop: 4 }}>
                        {st.total}
                      </div>
                    </HoverDiv>
                  ))}
                </div>
                </>
              )}

              {/* recap strip for the current selection */}
              <SectionLabel>ملخص حالة التنفيذ</SectionLabel>
              <StatBand
                items={[
                  { label: 'إجمالي المدخلات', value: String(vm.recap.total), info: 'إجمالي المدخلات المسجّلة ضمن هذا الاختيار.' },
                  { label: 'غير قابل للتحول', value: String(vm.recap.notCapable), info: 'بنود لا تنطبق عليها خطة إطلاق أو حالة تنفيذ.' },
                  { label: 'قيد التطوير', value: String(vm.recap.underDev), info: 'معتمدة ويجري تطويرها حالياً.' },
                  { label: 'تم التطوير', value: String(vm.recap.developed), info: 'اكتمل تطويرها وهي جاهزة للإطلاق.' },
                  { label: 'تم الإطلاق', value: String(vm.recap.launched), info: 'أُطلقت رسمياً.' },
                ]}
              />

              {/* filters + search */}
              <SectionLabel>القائمة التفصيلية</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <select value={vm.statusFilterValue} onChange={(e) => s.setStatusFilter(e.target.value)} style={selectStyle}>
                  {vm.statusOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {vm.showFundFilter && (
                  <select value={vm.fundFilterValue} onChange={(e) => s.setFundFilter(e.target.value)} style={{ ...selectStyle, width: 200 }}>
                    {vm.fundOptions.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {vm.showEntFilter && (
                  <select value={vm.entFilterValue} onChange={(e) => s.setEntFilter(e.target.value)} style={selectStyle}>
                    {vm.entOptions.map((e2) => (
                      <option key={e2.v} value={e2.v}>
                        {e2.label}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ position: 'relative' }}>
                  <input
                    value={vm.searchValue}
                    onChange={(e) => s.setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الوصف…"
                    style={{
                      height: 40,
                      width: 220,
                      border: '1px solid #E7ECF4',
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
                <div style={{ flex: 1 }} />
                {/* cards / table view switcher */}
                <div
                  style={{
                    display: 'flex',
                    background: '#F4F7FC',
                    border: '1px solid #E7ECF4',
                    borderRadius: 11,
                    padding: 3,
                    gap: 2,
                  }}
                >
                  {(
                    [
                      { k: 'cards' as const, icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', title: 'عرض البطاقات' },
                      { k: 'list' as const, icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', title: 'عرض الجدول' },
                    ]
                  ).map((v) => (
                    <button
                      key={v.k}
                      title={v.title}
                      onClick={() => setViewMode(v.k)}
                      style={{
                        width: 34,
                        height: 32,
                        border: viewMode === v.k ? '1px solid #D8E3F5' : '1px solid transparent',
                        borderRadius: 8,
                        background: viewMode === v.k ? '#fff' : 'transparent',
                        boxShadow: viewMode === v.k ? '0 1px 4px rgba(15,31,61,.10)' : 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon d={v.icon} size={15} color={viewMode === v.k ? '#1D4ED8' : '#8A97AD'} />
                    </button>
                  ))}
                </div>
                <ExportMenu onExcel={s.exportExcel} onPpt={s.exportPpt} />
                {vm.showAddBtn && (
                  <button
                    onClick={s.openCreate}
                    style={{
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
                      boxShadow: '0 10px 22px -10px rgba(37,99,235,.7)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Icon d="M12 5v14M5 12h14" size={17} strokeWidth={2.2} /> إضافة جديدة
                  </button>
                )}
              </div>

              {/* cards / table */}
              {vm.sectionCards.length === 0 ? (
                <div
                  style={{
                    border: '1.5px dashed #D5DEEC',
                    background: '#FAFCFF',
                    borderRadius: 16,
                    padding: '38px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#33415C' }}>لا توجد نتائج للعرض</div>
                  <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 6, lineHeight: 1.7 }}>
                    {vm.emptyDesc}
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <ListView cards={vm.sectionCards} />
              ) : (
                <div data-r="cards" data-tour="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                  {vm.sectionCards.map((c) => (
                    <CardItem key={c.id} c={c} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== ENTITIES (committee) ===== */}
          {vm.navSection === 'entities' && (
            <>
              <div>
                <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>الجهات</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>
                  الجهات المشاركة مرتّبة حسب حجم المقدَّم — اختر جهة لاستعراض محفظتها
                </div>
              </div>
              {vm.entityCards.length === 0 ? (
                <div style={{ border: '1.5px dashed #D5DEEC', background: '#FAFCFF', borderRadius: 16, padding: '38px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#33415C' }}>لا توجد جهات مشاركة بعد</div>
                </div>
              ) : (
                <div data-r="entcards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 14 }}>
                  {vm.entityCards.map((e2) => (
                    <HoverDiv
                      key={e2.name}
                      onClick={e2.onOpen}
                      base={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '18px 20px', cursor: 'pointer' }}
                      hover={{ borderColor: '#C7D6EE', boxShadow: '0 18px 40px -22px rgba(15,31,61,.35)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="hd" style={{ fontSize: 15, fontWeight: 800, color: '#13213C', lineHeight: 1.5 }}>{e2.name}</div>
                          <div style={{ fontSize: 11.5, color: '#6B7A93', fontWeight: 400, marginTop: 4 }}>
                            الميزانية التقديرية: <b style={{ color: '#13213C' }}>{e2.budgetLabel}</b>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 'none' }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#13213C', lineHeight: 1.1 }}>{e2.total}</div>
                          <div style={{ fontSize: 10, color: '#9AA6BC', fontWeight: 400 }}>إجمالي المدخلات</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
                        {[
                          { label: 'قيد التطوير', v: e2.underDev },
                          { label: 'تم التطوير', v: e2.developed },
                          { label: 'تم الإطلاق', v: e2.launched },
                          { label: 'معتمد للتمويل', v: e2.funded },
                        ].map((x) => (
                          <div key={x.label} style={{ background: '#F7F9FD', border: '1px solid #EBEFF6', borderRadius: 12, padding: '9px 11px' }}>
                            <div style={{ fontSize: 10, color: '#6B7A93', fontWeight: 400, lineHeight: 1.5 }}>{x.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C', marginTop: 2 }}>{x.v}</div>
                          </div>
                        ))}
                      </div>
                    </HoverDiv>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== LAUNCH PLANS: four big مرحلة cards ===== */}
          {vm.navSection === 'launchplans' && (
            <>
              <div>
                <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>مراحل التنفيذ والإطلاق</div>
                <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>
                  المراحل الأربع — تكلفة التنفيذ والإطلاق التقديرية، والإطلاقات وما يندرج تحت كل منها
                </div>
              </div>
              <div
                data-tour="stages"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(430px,1fr))', gap: 14 }}
              >
                {vm.batchSummary.map((b) => (
                  <div
                    key={b.name}
                    style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: '20px 22px' }}
                  >
                    {/* header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div className="hd" style={{ fontSize: 16, fontWeight: 800, color: '#13213C' }}>{b.displayName}</div>
                        <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>{b.period}</div>
                      </div>
                      <InfoTip text="تكلفة التنفيذ تُجمع من ميزانيات ما هو معيَّن لهذه المرحلة، وتكلفة الإطلاق من ميزانيات إطلاقاتها. اضغطوا على أي إطلاق لاستعراض ما يندرج تحته." />
                    </div>
                    {/* محتوى المرحلة: composition + delivery status in one block */}
                    {b.count === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                        <div style={{ flex: 1, fontSize: 11.5, color: '#6B7A93', fontWeight: 400 }}>
                          لا توجد تعيينات لهذه المرحلة بعد.
                        </div>
                        {vm.showAddBtn && (
                          <button
                            onClick={() => setItemsMgrFor(b.name)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#fff',
                              border: '1px solid #E3E9F3',
                              borderRadius: 999,
                              padding: '5px 12px',
                              fontSize: 11,
                              color: '#16408F',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            + إضافة
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: '#FAFCFF',
                          border: '1px solid #EBEFF6',
                          borderRadius: 14,
                          padding: '12px 14px',
                          marginTop: 12,
                        }}
                      >
                        {/* header: title + one action (coord manages, others view) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="hd" style={{ flex: 1, fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>
                            خطة التنفيذ
                          </div>
                          {vm.showAddBtn ? (
                            <button
                              onClick={() => setItemsMgrFor(b.name)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: '#fff',
                                border: '1px solid #E3E9F3',
                                borderRadius: 999,
                                padding: '5px 12px',
                                fontSize: 11,
                                color: '#16408F',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={11} color="#16408F" />
                              إدارة
                            </button>
                          ) : (
                            <button
                              onClick={b.onOpenAll}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: '#fff',
                                border: '1px solid #E3E9F3',
                                borderRadius: 999,
                                padding: '5px 12px',
                                fontSize: 11,
                                color: '#16408F',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              عرض البطاقات
                              <Icon d="M15 18l-6-6 6-6" size={11} color="#16408F" />
                            </button>
                          )}
                        </div>
                        {/* quiet composition line — each type opens its filtered page */}
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {b.composition.map((c, ci) => (
                            <span key={c.section} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {ci > 0 && <span style={{ color: '#C2CCDC', fontSize: 11 }}>·</span>}
                              <button
                                onClick={c.onOpen}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '2px 3px',
                                  fontSize: 11.5,
                                  color: '#54627B',
                                  fontWeight: 400,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  textDecoration: 'underline',
                                  textDecorationColor: '#C7D6EE',
                                  textUnderlineOffset: 3,
                                }}
                              >
                                <b style={{ fontWeight: 800, color: '#13213C' }}>{c.n}</b> {c.label}
                              </button>
                            </span>
                          ))}
                        </div>
                        {/* delivery mapping of the same items */}
                        <div data-r="stagedeliv" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
                          {[
                            { label: 'قيد التطوير', v: b.underDev },
                            { label: 'تم التطوير', v: b.developed },
                            { label: 'تم الإطلاق', v: b.launched },
                          ].map((x) => (
                            <div
                              key={x.label}
                              style={{ background: '#fff', border: '1px solid #EBEFF6', borderRadius: 12, padding: '9px 12px' }}
                            >
                              <div style={{ fontSize: 10.5, color: '#6B7A93', fontWeight: 400 }}>{x.label}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#13213C', marginTop: 2 }}>{x.v}</div>
                            </div>
                          ))}
                        </div>
                        {b.awaiting > 0 && (
                          <div style={{ fontSize: 10.5, color: '#9AA6BC', fontWeight: 400, marginTop: 7 }}>
                            {b.awaiting} بانتظار الاعتماد قبل بدء التطوير
                          </div>
                        )}
                      </div>
                    )}
                    {/* launches: coordinator manages in place, others read */}
                    {vm.showAddBtn ? (
                      <div style={{ background: '#FAFCFF', border: '1px solid #EBEFF6', borderRadius: 14, padding: '12px 14px', marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <div className="hd" style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>خطة الإطلاق</div>
                          <button
                            onClick={() => setLaunchMgrFor(b.name)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#EAF0FE',
                              color: '#2563EB',
                              border: '1px solid #D9E4FD',
                              borderRadius: 999,
                              padding: '5px 12px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {(vm.launchPlanMgr.find((g) => g.batch === b.name)?.plans || []).length ? 'إدارة الإطلاقات' : '+ إضافة إطلاق'}
                          </button>
                        </div>
                        {(vm.launchPlanMgr.find((g) => g.batch === b.name)?.plans || []).length === 0 ? (
                          <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400 }}>لا توجد إطلاقات لهذه المرحلة بعد.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(vm.launchPlanMgr.find((g) => g.batch === b.name)?.plans || []).map((p, pi) => {
                              const selCount = p.items.filter((x) => x.checked).length;
                              const ord =
                                ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'][pi] || String(pi + 1);
                              return (
                                <div
                                  key={p.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    border: '1px solid #EBEFF6',
                                    borderRadius: 12,
                                    padding: '10px 13px',
                                    background: '#fff',
                                  }}
                                >
                                  <span className="hd" style={{ flex: 'none', fontSize: 12.5, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>
                                    الإطلاق {ord}
                                  </span>
                                  <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 400, color: '#6B7A93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.title.trim()}
                                  </span>
                                  {p.date && (
                                    <span dir="ltr" style={{ flex: 'none', fontSize: 10.5, color: '#9AA6BC', fontWeight: 400 }}>{p.date}</span>
                                  )}
                                  {(() => {
                                    const launchedN = p.items.filter((x) => x.checked && x.launched).length;
                                    if (selCount > 0 && launchedN === selCount)
                                      return (
                                        <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#E3F6EC', color: '#0B8A4B' }}>
                                          تم الإطلاق
                                        </span>
                                      );
                                    return (
                                      <span style={{ flex: 'none', fontSize: 10.5, color: '#6B7A93', fontWeight: 400 }}>
                                        {launchedN > 0 ? launchedN + ' من ' + selCount + ' أُطلق' : selCount + ' محدد'}
                                      </span>
                                    );
                                  })()}
                                  <button
                                    title="تعديل الإطلاق"
                                    onClick={() => {
                                      setLaunchMgrFor(b.name);
                                      setOpenLaunch(b.name + '|' + p.id);
                                    }}
                                    style={{
                                      flex: 'none',
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      border: '1px solid #E3E9F3',
                                      background: '#fff',
                                      color: '#54627B',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={12} color="#54627B" />
                                  </button>
                                  <button
                                    title="حذف الإطلاق"
                                    onClick={() => s.removeLaunchPlan(p.id)}
                                    style={{
                                      flex: 'none',
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      border: 'none',
                                      background: '#FCEEEF',
                                      color: '#C0303B',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon d="M18 6L6 18M6 6l12 12" size={12} color="#C0303B" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                                        ) : (
                      b.launches.length > 0 && (
                      <div style={{ background: '#FAFCFF', border: '1px solid #EBEFF6', borderRadius: 14, padding: '12px 14px', marginTop: 12 }}>
                        <div className="hd" style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', marginBottom: 8 }}>خطة الإطلاق</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {b.launches.map((l) => {
                            const lOpen = openLaunch === b.name + '|' + l.id;
                            return (
                              <div key={l.id} style={{ border: '1px solid #EBEFF6', borderRadius: 12, overflow: 'hidden' }}>
                                <HoverDiv
                                  onClick={() => setOpenLaunch(lOpen ? null : b.name + '|' + l.id)}
                                  base={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', cursor: 'pointer', background: '#FAFCFF' }}
                                  hover={{ background: '#F2F6FD' }}
                                >
                                  <Icon d={lOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={14} color="#8A97AD" />
                                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: '#13213C' }}>{l.title}</span>
                                  <span style={{ flex: 'none', fontSize: 11, color: '#6B7A93', fontWeight: 400 }}>
                                    تنفيذ: <b style={{ color: '#13213C' }}>{l.execLabel}</b>
                                    {l.launchLabel ? <> · إطلاق: <b style={{ color: '#13213C' }}>{l.launchLabel}</b></> : null}
                                  </span>
                                </HoverDiv>
                                {lOpen && (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {l.items.map((it) => (
                                      <HoverDiv
                                        key={it.id}
                                        onClick={it.onOpen}
                                        base={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderTop: '1px solid #F0F3F8', cursor: 'pointer', background: '#fff' }}
                                        hover={{ background: '#F7F9FD' }}
                                      >
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#E5EEFF', color: '#2563EB', flex: 'none' }}>
                                          {it.typeLabel}
                                        </span>
                                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 400, color: '#33415C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {it.title}
                                        </span>
                                        {it.launched && (
                                          <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#E3F6EC', color: '#0B8A4B' }}>
                                            تم الإطلاق
                                          </span>
                                        )}
                                        <span style={{ flex: 'none', fontSize: 11, color: '#6B7A93', fontWeight: 400 }}>{it.budgetLabel}</span>
                                      </HoverDiv>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      )
                    )}
                    {/* cost tiles */}
                    <div data-r="form2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                      <div style={{ background: '#F7F9FD', border: '1px solid #EBEFF6', borderRadius: 12, padding: '11px 13px' }}>
                        <div style={{ fontSize: 11, color: '#6B7A93', fontWeight: 400 }}>ميزانية التنفيذ التقديرية</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C', marginTop: 4 }}>{b.costLabel}</div>
                      </div>
                      <div style={{ background: '#F7F9FD', border: '1px solid #EBEFF6', borderRadius: 12, padding: '11px 13px' }}>
                        <div style={{ fontSize: 11, color: '#6B7A93', fontWeight: 400 }}>ميزانية الإطلاق التقديرية</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C', marginTop: 4 }}>{b.launchCostLabel}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== stage items manager popup ===== */}
              {itemsMgrFor && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div
                    onClick={() => setItemsMgrFor(null)}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(8,17,35,.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'fadeIn .2s' }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 620,
                      maxHeight: '70vh',
                      background: '#fff',
                      borderRadius: 20,
                      boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
                      animation: 'fadeUp .3s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #F0F3F8' }}>
                      <div style={{ flex: 1 }}>
                        <div className="hd" style={{ fontSize: 16.5, fontWeight: 800, color: '#13213C' }}>خطة التنفيذ — {itemsMgrFor.replace(/^إطلاق /, '')}</div>
                        <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400, marginTop: 3, lineHeight: 1.7 }}>
                          حدِّدوا ما يندرج ضمن هذه المرحلة — نقل بند من مرحلة أخرى يتطلب تأكيداً ويصل إشعار به لجميع المعنيين.
                        </div>
                      </div>
                      <button
                        onClick={() => setItemsMgrFor(null)}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 16 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: '12px 22px 18px', overflowY: 'auto' }}>
                      {vm.stageAssignItems.length === 0 && (
                        <div style={{ padding: '18px 0', fontSize: 12, color: '#9AA6BC', fontWeight: 400, textAlign: 'center' }}>
                          لا توجد مشاريع أو عمليات أو خدمات قابلة للتحول بعد.
                        </div>
                      )}
                      {vm.stageAssignItems.map((x, xi) => (
                        <div
                          key={x.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 4px', borderTop: xi ? '1px solid #F4F6FA' : 'none' }}
                        >
                          <input
                            type="checkbox"
                            checked={x.batch === itemsMgrFor}
                            onChange={() => s.setItemBatch(x.id, x.batch === itemsMgrFor ? null : itemsMgrFor)}
                            style={{ width: 15, height: 15, accentColor: '#2563EB', cursor: 'pointer', flex: 'none' }}
                          />
                          <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#F1F4F9', color: '#54627B', flex: 'none' }}>
                            {x.typeLabel}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 400, color: '#33415C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {x.title}
                          </span>
                          {x.batch && x.batch !== itemsMgrFor && (
                            <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#FFF3DE', color: '#B45309' }}>
                              في {x.batch.replace(/^إطلاق /, '')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== launch manager popup ===== */}
              {launchMgrFor && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div
                    onClick={() => setLaunchMgrFor(null)}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(8,17,35,.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'fadeIn .2s' }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 760,
                      maxHeight: '74vh',
                      background: '#fff',
                      borderRadius: 20,
                      boxShadow: '0 30px 70px -24px rgba(2,12,35,.5)',
                      animation: 'fadeUp .3s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F0F3F8' }}>
                      <div style={{ flex: 1 }}>
                        <div className="hd" style={{ fontSize: 16.5, fontWeight: 800, color: '#13213C' }}>خطة الإطلاق — {launchMgrFor.replace(/^إطلاق /, '')}</div>
                        <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 400, marginTop: 3 }}>
                          أضيفوا الإطلاقات وحدِّدوا ما يشمله كل إطلاق — تنعكس التغييرات مباشرة على بطاقة المرحلة.
                        </div>
                      </div>
                      <button
                        onClick={() => s.addLaunchPlan(launchMgrFor)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#EAF0FE',
                          color: '#2563EB',
                          border: '1px solid #D9E4FD',
                          borderRadius: 10,
                          padding: '8px 13px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          flex: 'none',
                        }}
                      >
                        + إضافة إطلاق
                      </button>
                      <button
                        onClick={() => setLaunchMgrFor(null)}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #E7ECF4', background: '#fff', color: '#54627B', cursor: 'pointer', fontSize: 16, flex: 'none' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ padding: '14px 22px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(vm.launchPlanMgr.find((g) => g.batch === launchMgrFor)?.plans || []).length === 0 && (
                        <div style={{ padding: '18px 0', fontSize: 12, color: '#9AA6BC', fontWeight: 400, textAlign: 'center' }}>
                          لا توجد إطلاقات بعد — ابدؤوا بإضافة إطلاق.
                        </div>
                      )}
                      {(vm.launchPlanMgr.find((g) => g.batch === launchMgrFor)?.plans || []).map((p, pi) => {
                        const key = launchMgrFor + '|' + p.id;
                        const pOpen = openLaunch === key;
                        const selCount = p.items.filter((x) => x.checked).length;
                        const ord =
                          ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'][pi] || String(pi + 1);
                        return (
                          <div key={p.id} style={{ border: '1px solid #EBEFF6', borderRadius: 12, overflow: 'hidden' }}>
                            <HoverDiv
                              onClick={() => setOpenLaunch(pOpen ? null : key)}
                              base={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', cursor: 'pointer', background: '#FAFCFF' }}
                              hover={{ background: '#F2F6FD' }}
                            >
                              <Icon d={pOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={14} color="#8A97AD" />
                              <span className="hd" style={{ flex: 'none', fontSize: 13, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>
                                الإطلاق {ord}
                              </span>
                              <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 400, color: '#6B7A93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.title.trim()}
                              </span>
                              <span style={{ flex: 'none', fontSize: 11, color: '#6B7A93', fontWeight: 400 }}>{selCount} محدد</span>
                              <button
                                onClick={(e) => {
                                  stop(e);
                                  s.removeLaunchPlan(p.id);
                                }}
                                title="حذف الإطلاق"
                                style={{
                                  flex: 'none',
                                  width: 26,
                                  height: 26,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: '#FCEEEF',
                                  color: '#C0303B',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontFamily: 'inherit',
                                }}
                              >
                                ✕
                              </button>
                            </HoverDiv>
                            {pOpen && (
                              <div style={{ padding: '14px 13px', borderTop: '1px solid #F0F3F8', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* 1) name / type / date */}
                                <div data-r="form3" style={{ display: 'grid', gridTemplateColumns: '1fr 170px 150px', gap: 8 }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>اسم الإطلاق</label>
                                    <input
                                      value={p.title}
                                      onChange={(e) => s.updLaunchPlan(p.id, 'title', e.target.value)}
                                      placeholder="مثال: إطلاق خدمات المرحلة الأولى"
                                      style={mgrInput}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>نوع الإطلاق</label>
                                    <select value={p.ltype} onChange={(e) => s.updLaunchPlan(p.id, 'ltype', e.target.value)} style={mgrInput}>
                                      {LAUNCH_TYPES.map((t) => (
                                        <option key={t}>{t}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>التاريخ</label>
                                    <input type="date" value={p.date} onChange={(e) => s.updLaunchPlan(p.id, 'date', e.target.value)} style={mgrInput} />
                                  </div>
                                </div>
                                {/* 2) what the launch includes */}
                                <div>
                                  <div className="hd" style={{ fontSize: 12.5, fontWeight: 800, color: '#13213C', marginBottom: 7 }}>
                                    ماذا سيشمل الإطلاق؟
                                  </div>
                                  <div style={{ border: '1px solid #EBEFF6', borderRadius: 10, maxHeight: 220, overflowY: 'auto' }}>
                                    {p.items.length === 0 && (
                                      <div style={{ padding: '12px 13px', fontSize: 11.5, color: '#9AA6BC', fontWeight: 400 }}>لا توجد إضافات بعد.</div>
                                    )}
                                    {p.items.map((x, xi) => (
                                      <div
                                        key={x.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', borderTop: xi ? '1px solid #F0F3F8' : 'none' }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={x.checked}
                                          onChange={() => s.togglePlanItem(p.id, x.id)}
                                          style={{ width: 15, height: 15, accentColor: '#2563EB', cursor: 'pointer', flex: 'none' }}
                                        />
                                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#F1F4F9', color: '#54627B', flex: 'none' }}>
                                          {x.typeLabel}
                                        </span>
                                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 400, color: '#33415C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {x.title}
                                        </span>
                                        {x.otherBatch && (
                                          <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: '#FFF3DE', color: '#B45309' }}>
                                            في مرحلة أخرى
                                          </span>
                                        )}
                                        {x.launched && (
                                          <span style={{ flex: 'none', fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#E3F6EC', color: '#0B8A4B' }}>
                                            تم الإطلاق
                                          </span>
                                        )}
                                        <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 400, color: '#9AA6BC' }}>
                                          {x.hasBudget ? x.budget : 'لم يتم تحديد الميزانية'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* 3) budgets: exec = dynamic total of the checked items */}
                                <div data-r="form2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>الميزانية التقديرية للتنفيذ</label>
                                    <input
                                      value={p.budget}
                                      readOnly
                                      placeholder="تُحتسب تلقائياً من ميزانيات ما هو محدَّد"
                                      title="مجموع ميزانيات ما هو محدَّد أعلاه — يتحدّث تلقائياً"
                                      style={{ ...mgrInput, backgroundColor: '#F4F7FC', cursor: 'default' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>الميزانية التقديرية للإطلاق</label>
                                    <input
                                      value={p.launchBudget || ''}
                                      onChange={(e) => s.updLaunchPlan(p.id, 'launchBudget', e.target.value)}
                                      placeholder="تكلفة الإطلاق / الفعالية"
                                      style={mgrInput}
                                    />
                                  </div>
                                </div>
                                {/* 4) launch-level scope */}
                                <div>
                                  <label style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#6B7A93', marginBottom: 4 }}>نطاق العمل (على مستوى الإطلاق)</label>
                                  <textarea
                                    value={p.scope || ''}
                                    onChange={(e) => s.updLaunchPlan(p.id, 'scope', e.target.value)}
                                    placeholder="وصف موجز لما سيتم تحويله ضمن هذا الإطلاق…"
                                    rows={3}
                                    style={{ ...mgrInput, height: 'auto', padding: '9px 11px', resize: 'vertical', lineHeight: 1.7 }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* First-login onboarding walkthrough */}
      <Tour steps={TOUR_STEPS} />
    </div>
  );
}

// ---------------------------------------------------------------------------
const mgrInput: CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid #DCE3EE',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: '0 11px',
  fontSize: 12.5,
  fontWeight: 400,
  color: '#13213C',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const selectStyle: CSSProperties = {
  height: 40,
  width: 170,
  minWidth: 170,
  border: '1px solid #E7ECF4',
  backgroundColor: '#fff',
  borderRadius: 11,
  padding: '0 13px',
  fontWeight: 400,
  fontSize: 13,
  color: '#42506B',
  outline: 'none',
  cursor: 'pointer',
};

function KpiCard({
  value,
  label,
  iconD,
  grid,
  suffix,
  sub,
  rows,
}: {
  value: number;
  label: string;
  iconD?: string;
  grid?: boolean;
  suffix?: string;
  sub?: string;
  rows?: { label: string; value: number }[];
}) {
  const iconChip = (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: '#EAF0FE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      {grid ? (
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ) : (
        <Icon d={iconD!} size={16} color="#2563EB" />
      )}
    </span>
  );
  const valueBlock = (
    <div style={{ fontSize: 21, fontWeight: 800, color: '#13213C', lineHeight: 1.25 }}>
      {value}
      {suffix && <span style={{ fontSize: 13, color: '#9AA6BC' }}>{suffix}</span>}
      {sub && <span style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 700, marginRight: 6 }}>({sub})</span>}
    </div>
  );

  // with a distribution: icon stacked above the total on the start side,
  // plain label + number rows filling the rest (no bars)
  if (rows && rows.length > 0) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #E7ECF4',
          borderRadius: 14,
          padding: '13px 15px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7, minWidth: 0 }}>
          {iconChip}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: '#6B7A93', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
            {valueBlock}
          </div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: '#F0F3F8', flex: 'none' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7A93',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#13213C', flex: 'none' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E7ECF4',
        borderRadius: 14,
        padding: '13px 15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 7,
      }}
    >
      {iconChip}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: '#6B7A93', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
        {valueBlock}
      </div>
    </div>
  );
}

// Hero tile: total first, with a single-hue stacked composition bar.
// Identity is carried by lightness steps of ONE blue + direct labels.
const BLUE_STEPS = ['#2563EB', '#7DA4F2', '#C2D5FA'];

// Percentage tile — label + value only, no decoration.

// national-overview KPI card: info ⓘ on the left, label + status dot on the
// right, big centred figure below
function CommitteeKpi({ value, label, dot, info }: { value: number; label: string; dot?: string; info?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: '15px 18px', minHeight: 120, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, color: '#6B7A93', fontWeight: 400, lineHeight: 1.5 }}>{label}</span>
          {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }} />}
        </span>
        {info && <InfoTip text={info} />}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: '#13213C', lineHeight: 1 }}>{value}</span>
      </div>
    </div>
  );
}

function StatCard({ value, label, dot, info, suffix }: { value: number; label: string; dot?: string; info?: string; suffix?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '13px 15px' }}>
      <div
        style={{
          fontSize: 11.5,
          color: '#6B7A93',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          lineHeight: 1.5,
        }}
      >
        {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none' }} />}
        <span style={{ minWidth: 0 }}>{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: '#13213C', marginTop: 3, lineHeight: 1.25 }}>
        {value}
        {suffix && <span style={{ fontSize: 13, color: '#9AA6BC' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function BudgetFigure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{ fontSize: 20, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap', lineHeight: 1.25 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

type CardVM = VM['cards'][number];

// ---------------------------------------------------------------------------
// List view — the same items as a clean, scannable table
function ListView({ cards }: { cards: CardVM[] }) {
  const th: CSSProperties = {
    textAlign: 'right',
    padding: '10px 14px',
    fontSize: 11.5,
    fontWeight: 700,
    color: '#8A97AD',
    borderBottom: '1px solid #EEF1F7',
    whiteSpace: 'nowrap',
  };
  const td: CSSProperties = {
    padding: '12px 14px',
    fontSize: 12.5,
    color: '#33415C',
    borderBottom: '1px solid #F4F6FA',
    verticalAlign: 'middle',
  };
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E7ECF4',
        borderRadius: 16,
        overflowX: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1020 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 30 }} />
            <th style={th}>العنوان</th>
            <th style={th}>النوع</th>
            <th style={th}>المسار</th>
            <th style={th}>الحالة</th>
            <th style={th}>خطة الإطلاق</th>
            <th style={th}>آخر تحديث</th>
            <th style={{ ...th, textAlign: 'center' }}>الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr
              key={c.id}
              onClick={c.onOpen}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F7F9FD')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
            >
              <td style={td}>
                {(c.showSelectCheck || c.showAssignCheck) && (
                  <span
                    onClick={(e) => {
                      stop(e);
                      if (c.showSelectCheck) c.onToggleFundSel();
                      else c.onToggleAssignSel();
                    }}
                    style={{
                      display: 'inline-flex',
                      width: 17,
                      height: 17,
                      borderRadius: 5,
                      border: `2px solid ${c.showSelectCheck ? (c.fundChecked ? '#2563EB' : '#C7D1E2') : c.assignChecked ? '#2563EB' : '#C7D1E2'}`,
                      background: (c.showSelectCheck ? c.fundChecked : c.assignChecked) ? '#2563EB' : '#fff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {(c.showSelectCheck ? c.fundChecked : c.assignChecked) && (
                      <Icon d="M20 6 9 17l-5-5" size={11} color="#fff" strokeWidth={3} />
                    )}
                  </span>
                )}
              </td>
              <td style={{ ...td, fontWeight: 800, color: '#13213C', maxWidth: 260 }}>{c.title}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>{c.typeLabel}</td>
              <td style={td}>{c.pathName}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: c.wfBg,
                    color: c.wfChip,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.wfChip }} />
                  {c.wfLabel}
                </span>
              </td>
              <td style={{ ...td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.launchLabel || '—'}
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap', color: '#8A97AD', fontSize: 11.5 }}>
                {c.statusStamp || '—'}
              </td>
              <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {c.canApprove ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={(e) => {
                        stop(e);
                        c.onApprove();
                      }}
                      style={{
                        background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 9,
                        padding: '7px 14px',
                        fontWeight: 800,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      اعتماد
                    </button>
                    <button
                      onClick={(e) => {
                        stop(e);
                        c.onReqInfo();
                      }}
                      style={{
                        background: '#fff',
                        color: '#33405A',
                        border: '1px solid #E7ECF4',
                        borderRadius: 9,
                        padding: '7px 12px',
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      طلب معلومات إضافية
                    </button>
                    <button
                      title="رفض"
                      aria-label="رفض"
                      onClick={(e) => {
                        stop(e);
                        c.onReject();
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        background: '#FCEEEF',
                        color: '#C0303B',
                        border: '1px solid #F5D8DB',
                        borderRadius: 9,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon d="M18 6L6 18M6 6l12 12" size={12} color="#C0303B" strokeWidth={2.4} />
                    </button>
                  </span>
                ) : c.showPathCta ? (
                  <button
                    onClick={(e) => {
                      stop(e);
                      c.onPathCta();
                    }}
                    style={{
                      background: '#EAF0FE',
                      color: '#2563EB',
                      border: 'none',
                      borderRadius: 9,
                      padding: '7px 14px',
                      fontWeight: 800,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {c.pathCtaLabel}
                  </button>
                ) : (
                  <span style={{ color: '#C3CDDE', fontSize: 12 }}>عرض ←</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardItem({ c }: { c: CardVM }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={c.onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        border: '1px solid #E7ECF4',
        borderRadius: 16,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
        cursor: 'pointer',
        transition: 'box-shadow .15s,transform .15s',
        ...(hover
          ? { boxShadow: '0 16px 34px -20px rgba(15,31,61,.45)', transform: 'translateY(-2px)' }
          : null),
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 999,
            background: c.typeBg,
            color: c.typeColor,
            whiteSpace: 'nowrap',
            flex: 'none',
          }}
        >
          {c.typeLabel}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {c.isFundedCommittee && (
            <HoverButton
              title="اضغط لإلغاء التمويل"
              onClick={(e) => {
                stop(e);
                c.onCancelFund();
              }}
              base={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#E3F6EC',
                color: '#0B8A4B',
                border: 'none',
                cursor: 'pointer',
              }}
              hover={{ background: '#D2F0DE' }}
            >
              <Icon d="M20 6 9 17l-5-5" size={12} strokeWidth={2.6} />
              معتمد للتمويل
            </HoverButton>
          )}
          {c.isFundedOther && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#E3F6EC',
                color: '#0B8A4B',
              }}
            >
              <Icon d="M20 6 9 17l-5-5" size={12} strokeWidth={2.6} />
              معتمد للتمويل
            </span>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 999,
              background: c.wfBg,
              color: c.wfChip,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.wfChip }} />
            {c.wfLabel}
          </span>
          {/* status timestamp — inline next to the status chip */}
          {c.statusStamp && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                color: '#9AA6BC',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon
                d="M12 8v4l2.5 1.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
                size={11}
                color="#9AA6BC"
              />
              {c.statusStamp}
            </span>
          )}
        </div>
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        {c.showSelectCheck && (
          <span
            onClick={(e) => {
              stop(e);
              c.onToggleFundSel();
            }}
            style={{
              width: 20,
              height: 20,
              marginTop: 1,
              borderRadius: 6,
              border: `2px solid ${c.fundChecked ? '#2563EB' : '#C7D1E2'}`,
              background: c.fundChecked ? '#2563EB' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            {c.fundChecked && <Icon d="M20 6 9 17l-5-5" size={13} color="#fff" strokeWidth={3} />}
          </span>
        )}
        {c.showAssignCheck && (
          <span
            onClick={(e) => {
              stop(e);
              c.onToggleAssignSel();
            }}
            style={{
              width: 20,
              height: 20,
              marginTop: 1,
              borderRadius: 6,
              border: `2px solid ${c.assignChecked ? '#2563EB' : '#C7D1E2'}`,
              background: c.assignChecked ? '#2563EB' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            {c.assignChecked && <Icon d="M20 6 9 17l-5-5" size={13} color="#fff" strokeWidth={3} />}
          </span>
        )}
        <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C', lineHeight: 1.4 }}>{c.title}</div>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 12,
          color: '#7A879E',
          lineHeight: 1.6,
          fontWeight: 400,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {c.desc}
      </div>

      {/* Linked launch + stage-move flags (sync visible everywhere) */}
      {((c.launchNames && c.launchNames.length > 0) || c.stageMoved) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {c.launchNames && c.launchNames.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 999,
                background: '#F0F4FB',
                color: '#3B5AA5',
                maxWidth: '100%',
              }}
            >
              <Icon d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" size={11} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.launchNames.join('، ')}
              </span>
            </span>
          )}
          {c.stageMoved && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 999,
                background: '#FFF3DE',
                color: '#B45309',
              }}
            >
              نُقل بين المراحل
            </span>
          )}
        </div>
      )}

      {/* Returned banner */}
      {c.isReturned && (
        <div style={{ background: '#FFF4F4', border: '1px solid #F6D6D9', borderRadius: 11, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#C0303B', marginBottom: 3 }}>
            {c.retBannerLabel}
          </div>
          <div style={{ fontSize: 11.5, color: '#7A4A4E', fontWeight: 600, lineHeight: 1.6 }}>{c.retNote}</div>
        </div>
      )}

      {/* Score / entity block */}
      {c.showEntity && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F7F9FD',
            border: '1px solid #EBEFF6',
            borderRadius: 11,
            padding: '9px 11px',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 900,
              color: '#fff',
              background: c.scoreColor,
            }}
          >
            {c.scoreV}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: c.scoreColor }}>{c.scoreLabel}</div>
          </div>
        </div>
      )}

      {/* Footer meta — pinned to the bottom so cards in a row align */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #F0F3F8',
          paddingTop: 11,
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            color: '#54627B',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.pathColor }} /> {c.footLabel}
        </span>
      </div>

      {/* Entity pending actions */}
      {c.canApprove && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            gap: 7,
            borderTop: '1px solid #F0F3F8',
            paddingTop: 11,
          }}
        >
          {/* all three decisions visible — no action is implied as the default */}
          <button
            onClick={(e) => {
              stop(e);
              c.onApprove();
            }}
            style={{
              flex: 1,
              background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '8px 6px',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            اعتماد
          </button>
          <button
            onClick={(e) => {
              stop(e);
              c.onReqInfo();
            }}
            style={{
              flex: 1,
              background: '#fff',
              color: '#33405A',
              border: '1px solid #E7ECF4',
              borderRadius: 9,
              padding: '8px 6px',
              fontWeight: 700,
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            طلب معلومات إضافية
          </button>
          <button
            title="رفض"
            aria-label="رفض"
            onClick={(e) => {
              stop(e);
              c.onReject();
            }}
            style={{
              width: 38,
              flex: 'none',
              background: '#FCEEEF',
              color: '#C0303B',
              border: '1px solid #F5D8DB',
              borderRadius: 9,
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon d="M18 6L6 18M6 6l12 12" size={14} color="#C0303B" strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* Coord fill CTA — delete stays available while not yet approved (ent1) */}
      {(c.showPathCta || c.canDelete) && (
        <div style={{ borderTop: '1px solid #F0F3F8', paddingTop: 11, display: 'flex', gap: 8 }}>
          {c.showPathCta && (
          <button
            onClick={(e) => {
              stop(e);
              c.onPathCta();
            }}
            style={{
              flex: 1,
              background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '10px 0',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: '0 8px 18px -9px rgba(37,99,235,.65)',
            }}
          >
            {c.pathCtaLabel}
          </button>
          )}
          {c.canDelete && (
            <button
              title={c.showPathCta ? 'حذف المسودة' : 'سحب وحذف (لم يُعتمد بعد)'}
              onClick={(e) => {
                stop(e);
                c.onDelete();
              }}
              style={{
                ...(c.showPathCta ? { width: 40, flex: 'none' } : { flex: 1, padding: '10px 0' }),
                background: '#FCEEEF',
                color: '#C0303B',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                fontWeight: 800,
                fontSize: 12.5,
                fontFamily: 'inherit',
              }}
            >
              <Icon d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" size={15} color="#C0303B" />
              {!c.showPathCta && 'سحب وحذف'}
            </button>
          )}
        </div>
      )}

      {/* Nominated state */}
      {c.isNominated && (
        <div style={{ borderTop: '1px solid #F0F3F8', paddingTop: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              color: '#2563EB',
              background: '#E5EEFF',
              borderRadius: 999,
              padding: '5px 11px',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
            {c.nomLabel}
          </span>
          {c.canFundNom && (
            <div style={{ display: 'flex', gap: 7 }}>
              <button
                onClick={(e) => {
                  stop(e);
                  c.onFundNom();
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg,#12B26F,#0B8A4B)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  padding: '9px 8px',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                اعتماد التمويل
              </button>
              <button
                onClick={(e) => {
                  stop(e);
                  c.onDeclineNom();
                }}
                style={{
                  background: '#fff',
                  border: '1px solid #F1D4D7',
                  color: '#DC2B38',
                  borderRadius: 9,
                  padding: '9px 15px',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                رفض التمويل
              </button>
            </div>
          )}
          {c.canWithdrawNom && (
            <button
              onClick={(e) => {
                stop(e);
                c.onWithdrawNom();
              }}
              style={{
                alignSelf: 'flex-start',
                background: '#fff',
                border: '1px solid #E7ECF4',
                color: '#54627B',
                borderRadius: 9,
                padding: '7px 14px',
                fontWeight: 800,
                fontSize: 11.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              سحب الترشيح
            </button>
          )}
        </div>
      )}
    </div>
  );
}
