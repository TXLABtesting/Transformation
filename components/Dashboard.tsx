'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';
import { Tour, TOUR_EVENT, type TourStep } from './Tour';

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
    title: 'بطاقات مراحل الإطلاق',
    desc: 'لكل مرحلة إطلاق بطاقة تعرض إجمالي التكلفة التقديرية. اضغطوا على أيقونة التفاصيل لاستعراض خطط الإطلاق وما يرتبط بكل خطة.',
  },
  {
    sel: '[data-tour="actions"]',
    title: 'الإجراءات والمرشحات',
    desc: 'من هنا تتم إضافة مشروع أو عملية أو خدمة جديدة، وإدارة خطط الإطلاق، وتصفية القائمة حسب النوع والحالة، وتصدير البيانات إلى Excel وPowerPoint.',
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

// small ⓘ affordance: hover / tap reveals a plain-language explanation
function InfoTip({ text, dark }: { text: string; dark?: boolean }) {
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
            right: -8,
            width: 240,
            background: '#0F1F3D',
            color: '#fff',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 11.5,
            fontWeight: 600,
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
  const max = rows.reduce((a, r) => Math.max(a, r.value), 0) || 1;
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '15px 17px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7A93', lineHeight: 1.5 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
        {rows.map((r, i) => (
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
          <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600 }}>لا توجد بيانات بعد.</div>
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
  }[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div
      style={{
        display: 'flex',
        borderRadius: 16,
        overflow: 'hidden',
        ...(dark
          ? { background: BLUE_GRAD, color: '#fff' }
          : { background: '#fff', border: '1px solid #E7ECF4' }),
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          onClick={it.dist ? () => setOpenIdx(openIdx === i ? null : i) : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '15px 20px',
            borderLeft: i < items.length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,.16)' : '#EBEFF6'}` : 'none',
            cursor: it.dist ? 'pointer' : 'default',
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
            {it.dist && (
              <span style={{ marginRight: 'auto', display: 'flex', flex: 'none' }}>
                <Icon
                  d={openIdx === i ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                  size={15}
                  color={dark ? 'rgba(255,255,255,.7)' : '#8A97AD'}
                />
              </span>
            )}
          </div>
          {it.dist && openIdx === i && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px dashed ${dark ? 'rgba(255,255,255,.25)' : '#E1E7F1'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {it.dist.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: dark ? 'rgba(255,255,255,.8)' : '#54627B',
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
        </div>
      ))}
    </div>
  );
}

// «تصدير» dropdown next to the view switcher: one button, Excel / PowerPoint
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
        تصدير
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
  // which launch row (in the مرحلة summary) is expanded to show its items
  const [openLaunch, setOpenLaunch] = useState<string | null>(null);
  // which مرحلة card is expanded to show its details
  const [openBatch, setOpenBatch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#F7F9FD,#EEF2F9)',
        direction: 'rtl',
        // prevent an absolutely-positioned tooltip / wide analytics row from
        // introducing a horizontal scroll that clips content in RTL
        overflowX: 'hidden',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="assets/uae-crest.png" alt="UAE" style={{ height: 72 }} />
          <div style={{ width: 1, height: 54, background: '#E7ECF4' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="assets/logo.png" alt="logo" style={{ height: 60 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Role switcher: demo builds only (production role comes from the
              UAE PASS / IdP mapping wired by IT). */}
          {vm.showRoleSwitcher && (
            <div
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
                    border: 'none',
                    borderRadius: 9,
                    padding: '8px 13px',
                    fontWeight: 700,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    ...(p.active
                      ? { background: '#0F1F3D', color: '#fff' }
                      : { background: 'transparent', color: '#54627B' }),
                  }}
                >
                  {p.label}
                </button>
              ))}
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
                            fontWeight: 600,
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

          {/* Replay the onboarding tour */}
          <HoverButton
            title="جولة تعريفية"
            onClick={() => window.dispatchEvent(new CustomEvent(TOUR_EVENT))}
            base={{
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
              fontWeight: 800,
              fontSize: 15,
              fontFamily: 'inherit',
            }}
            hover={{ borderColor: '#C7D6EE' }}
          >
            ؟
          </HoverButton>

          {/* Basket */}
          {vm.showBasket && (
            <div data-tour="basket" style={{ position: 'relative' }}>
              <HoverButton
                onClick={s.openBasket}
                base={{
                  position: 'relative',
                  height: 38,
                  padding: '0 13px',
                  borderRadius: 11,
                  border: '1px solid #E7ECF4',
                  background: '#fff',
                  color: '#42506B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 800,
                  fontSize: 12,
                }}
                hover={{ borderColor: '#C7D6EE' }}
              >
                <Icon
                  d="M5 8h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z M9 8V6a3 3 0 0 1 6 0v2"
                  size={17}
                />
                السلة
                {vm.hasBasketBadge && (
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
                    {vm.basketBadge}
                  </span>
                )}
              </HoverButton>
            </div>
          )}

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
                        fontWeight: 600,
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

      {/* ===================== BANNER + STEPPER (entity/coord only) ===================== */}
      {vm.showProgramBanner && (
      <div
        data-tour="banner"
        style={{
          margin: '16px 24px 0',
          background: BLUE_GRAD,
          borderRadius: 18,
          padding: '18px 22px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.6,
            pointerEvents: 'none',
            backgroundImage:
              'radial-gradient(circle at 97% 0%,rgba(39,194,240,.30),transparent 38%),radial-gradient(circle at 3% 100%,rgba(37,99,235,.25),transparent 40%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div className="hd" style={{ fontSize: 18, fontWeight: 800 }}>{vm.banner.title}</div>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#AFC6E8',
                  fontWeight: 500,
                  marginTop: 4,
                  maxWidth: 520,
                  lineHeight: 1.6,
                }}
              >
                {vm.banner.subtitle}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 15,
              padding: '13px 18px',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: '#9FC4F2', fontWeight: 700 }}>
                المرحلة الأولى · {vm.banner.firstMsName}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                {vm.banner.curPhaseDeadlineFmt}
              </div>
            </div>
            <div style={{ width: 1, height: 46, background: 'rgba(255,255,255,.14)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              {(
                [
                  { v: vm.banner.cd.days, label: 'يوم', min: 38 },
                  { v: vm.banner.cd.hh, label: 'ساعة', min: 32 },
                  { v: vm.banner.cd.mm, label: 'دقيقة', min: 32 },
                  { v: vm.banner.cd.ss, label: 'ثانية', min: 32 },
                ] as { v: string; label: string; min: number }[]
              ).map((u, i) => (
                <div key={u.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  {i > 0 && (
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#5E7BA8', lineHeight: 1.1 }}>:</div>
                  )}
                  <div style={{ textAlign: 'center', minWidth: u.min }}>
                    <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: '#fff' }}>{u.v}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#9FC4F2', marginTop: 4 }}>{u.label}</div>
                  </div>
                </div>
              ))}
            </div>
            {vm.isAiRole && (
              <HoverButton
                onClick={s.openDeadlines}
                base={{
                  position: 'relative',
                  zIndex: 3,
                  marginRight: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'rgba(255,255,255,.12)',
                  border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff',
                  borderRadius: 11,
                  padding: '9px 13px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                hover={{ background: 'rgba(255,255,255,.2)' }}
              >
                <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={15} />
                ضبط المهل
              </HoverButton>
            )}
          </div>
        </div>

        {/* Program stepper */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          {vm.programSteps.map((st) => {
            // the three phases are parallel tracks, not sequential steps —
            // everything renders uniformly in white
            const lineBg = '#fff';
            const circleBg = '#fff';
            const circleColor = '#123f93';
            const circleBorder = 'none';
            const colGlow = 'none';
            const labelColor = '#fff';
            const done = false;
            return (
              <div
                key={st.num}
                onClick={st.onStepFilter}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 9,
                  minWidth: 108,
                  flex: 1,
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ flex: 1, height: 3, borderRadius: 3, background: lineBg }} />
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      background: circleBg,
                      color: circleColor,
                      border: circleBorder,
                      boxShadow: colGlow,
                    }}
                  >
                    {done ? (
                      <Icon d="M20 6 9 17l-5-5" size={15} strokeWidth={3} />
                    ) : (
                      st.num
                    )}
                  </span>
                  <span style={{ flex: 1, height: 3, borderRadius: 3, background: lineBg }} />
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: labelColor,
                    textAlign: 'center',
                    lineHeight: 1.35,
                    padding: '0 4px',
                    minHeight: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {st.label}
                </div>
                <div style={{ marginTop: 2, textAlign: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: labelColor, whiteSpace: 'nowrap' }}>
                    {st.stepCount} من {vm.typesPhrase}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,.1)',
                      border: '1px solid rgba(255,255,255,.16)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#9FC4F2',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {st.resp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ===================== WORK AREA ===================== */}
      <div
        data-r="work"
        style={{ display: 'flex', gap: 16, padding: '16px 24px 44px', alignItems: 'flex-start' }}
      >
        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subheader */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="hd" style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>{vm.activePathName}</div>
              <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3 }}>
                {vm.streamSummary}
              </div>
            </div>
            <div data-r="actions" data-tour="actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={vm.filterValue}
                onChange={(e) => s.setFilter(e.target.value)}
                style={selectStyle}
              >
                {vm.tabs.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.optLabel}
                  </option>
                ))}
              </select>
              <select
                value={vm.statusFilterValue}
                onChange={(e) => s.setStatusFilter(e.target.value)}
                style={selectStyle}
              >
                {vm.statusOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
              {vm.showFundFilter && (
                <select
                  value={vm.fundFilterValue}
                  onChange={(e) => s.setFundFilter(e.target.value)}
                  style={{ ...selectStyle, width: 200 }}
                >
                  {vm.fundOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.label}
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
                    width: 210,
                    border: '1px solid #E7ECF4',
                    background: '#fff',
                    borderRadius: 11,
                    padding: '0 36px 0 13px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#13213C',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    pointerEvents: 'none',
                  }}
                >
                  <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={15} color="#9AA6BC" />
                </span>
              </div>
              {vm.isAiRole && (
                <select
                  value={vm.pathFilterValue}
                  onChange={(e) => s.setActivePath(e.target.value)}
                  style={selectStyle}
                >
                  {vm.pathOptions.map((p) => (
                    <option key={p.v} value={p.v}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
              {vm.showEntFilter && (
                <select
                  value={vm.entFilterValue}
                  onChange={(e) => s.setEntFilter(e.target.value)}
                  style={selectStyle}
                >
                  {vm.entOptions.map((e2) => (
                    <option key={e2.v} value={e2.v}>
                      {e2.label}
                    </option>
                  ))}
                </select>
              )}
              {vm.showAddBtn && (
                <>
                  <button
                    onClick={() => s.openLaunchPlans()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      height: 40,
                      padding: '0 16px',
                      background: '#EAF0FE',
                      color: '#2563EB',
                      border: '1px solid #D9E4FD',
                      borderRadius: 11,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" size={16} color="#2563EB" />
                    إدارة خطط الإطلاق
                  </button>
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
                    }}
                  >
                    <Icon d="M12 5v14M5 12h14" size={17} strokeWidth={2.2} /> إضافة جديدة
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI bands (non-ai): each family of statistics gets its own full
              line — counts (dark band), percentages, then budgets */}
          {vm.notAiRole && (
            <>
              <div data-r="kpirow" data-tour="kpis">
                <StatBand
                  items={[
                    {
                      label: 'المشاريع / المبادرات',
                      value: String(vm.kpis.projInit),
                      info: 'عدد المشاريع والمبادرات المسجّلة ضمن نطاق اطلاعك في مسارات التحول. اضغطوا على البطاقة لاستعراض التوزيع على المسارات.',
                      dist: vm.showStreamDist ? vm.kpiDist.projInit : undefined,
                    },
                    ...(vm.showOpsKpi
                      ? [
                          {
                            label: 'العمليات',
                            value: String(vm.kpis.operations),
                            info: 'عدد العمليات التخصصية وعمليات الدعم المؤسسي المسجّلة للتحول. اضغطوا على البطاقة لاستعراض التوزيع على المسارات.',
                            dist: vm.showStreamDist ? vm.kpiDist.operations : undefined,
                          },
                        ]
                      : []),
                    ...(vm.showSvcKpi
                      ? [
                          {
                            label: 'الخدمات',
                            value: String(vm.kpis.services),
                            info: 'عدد الخدمات المسجّلة للتحول في مسار الخدمات.',
                            dist: vm.showStreamDist ? vm.kpiDist.services : undefined,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
              <StatBand
                items={[
                  { label: 'نسبة الإنجاز', value: String(vm.kpis.completion), suffix: '%', info: 'متوسط تقدّم جميع المشاريع والعمليات والخدمات عبر مراحل الدورة، من المسودة حتى الإنجاز.' },
                  {
                    label: 'متوسط نسبة التحول للذكاء الاصطناعي المساعد',
                    value: String(vm.kpis.avgTargetPct),
                    suffix: '%',
                    info: 'متوسط النسب المستهدفة للتحول باستخدام الذكاء الاصطناعي كما أُدخلت في النتائج المتوقعة.',
                  },
                  { label: 'متوسط نسبة الأتمتة الحالية', value: String(vm.kpis.avgAutomationPct), suffix: '%', info: 'متوسط مستوى الأتمتة الحالي قبل التحول كما أُدخل في البيانات.' },
                  {
                    label: 'المكتمل من ' + vm.typesPhrase,
                    value: String(vm.kpis.completedPct),
                    suffix: '%',
                    chip: String(vm.kpis.completedCount),
                    info: 'نسبة وعدد ما اكتمل إنجازه وإغلاقه بالكامل.',
                  },
                ]}
              />
              {vm.role === 'entity' && vm.pathFilterValue === 'all' && (vm.showExecBudget || vm.showLaunchBudget) && (
                <StatBand
                  items={[
                    ...(vm.showExecBudget
                      ? [{ label: 'ميزانية التنفيذ التقديرية', value: vm.execBudgetTotalLabel, info: 'مجموع الميزانيات التقديرية لتنفيذ المشاريع والعمليات والخدمات في نطاقك.' }]
                      : []),
                    ...(vm.showLaunchBudget
                      ? [{ label: 'ميزانية الإطلاق التقديرية (للاطلاع)', value: vm.launchBudgetTotalLabel, info: 'مجموع ميزانيات الإطلاق لخطط الإطلاق المرتبطة — للاطلاع فقط ولا يدخل في التمويل.' }]
                      : []),
                  ]}
                />
              )}
            </>
          )}

          {/* Committee analytics (ai) */}
          {vm.isAiRole && (
            <>
              <div
                data-r="kpi"
                data-tour="kpis"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 13, marginBottom: 4 }}
              >
                <StatCard value={vm.aiStats.total} label="إجمالي المشاريع والمبادرات والعمليات والخدمات" info="كل ما قدّمته الجهات عبر مسارات التحول ووصل إلى اللجنة الوطنية." />
                <StatCard value={vm.aiStats.entCount} label="الجهات المشاركة" info="عدد الجهات الاتحادية التي قدّمت مشاريع أو عمليات أو خدمات." />
                <StatCard value={vm.aiStats.pending} label="بانتظار الاعتماد" dot="#B45309" info="ما ينتظر مراجعة واعتماد اللجنة الوطنية." />
                <StatCard value={vm.aiStats.funded} label="معتمدة للتمويل" dot="#0B8A4B" info="ما اعتمدته اللجنة الوطنية وستتكفّل بتكلفة تحويله." />
                <div
                  data-tip=""
                  style={{
                    position: 'relative',
                    background: '#fff',
                    border: '1px solid #E7ECF4',
                    borderRadius: 14,
                    padding: '13px 15px',
                    cursor: 'help',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#6B7A93',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    متوسط درجة التحول
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        background: '#EAF0FE',
                        color: '#2563EB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      <svg
                        width={10}
                        height={10}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 16v-4M12 8h.01" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </span>
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: '#13213C', marginTop: 3, lineHeight: 1.25 }}>
                    {vm.aiStats.avgPct}
                    <span style={{ fontSize: 13, color: '#9AA6BC' }}>%</span>
                  </div>
                  {/* tooltip anchored to the card's inner-left edge so it always
                      opens toward the page center and never clips the viewport */}
                  <span
                    data-tipbox=""
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 8,
                      right: 'auto',
                      transform: 'none',
                      width: 250,
                      maxWidth: '76vw',
                      background: '#0F1F3D',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1.7,
                      padding: '11px 13px',
                      borderRadius: 10,
                      boxShadow: '0 16px 40px -14px rgba(2,12,35,.5)',
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'opacity .15s',
                      pointerEvents: 'none',
                      textAlign: 'right',
                      zIndex: 30,
                    }}
                  >
                    متوسط درجات التحول لكل المشاريع والمبادرات والعمليات والخدمات معبّراً عنه كنسبة مئوية. تُحسب الدرجة (من 5) من: الأثر
                    ٢٥٪ · القابلية ٢٠٪ · الجاهزية ١٥٪ · كثافة الاستخدام ١٥٪ · الأولوية ١٠٪ · فرصة الأتمتة ١٠٪ ·
                    سهولة التعقيد ٥٪ ثم تُحوّل النتيجة إلى نسبة مئوية.
                  </span>
                </div>
              </div>
              {/* Distribution charts (all-streams view) or plain type totals */}
              {vm.pathFilterValue === 'all' ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
                      gap: 13,
                      marginTop: 13,
                    }}
                  >
                    <PieCard title="توزيع المشاريع / المبادرات على المسارات" data={vm.kpiDist.projInit} />
                    <PieCard title="توزيع العمليات على المسارات" data={vm.kpiDist.operations} />
                    <PieCard title="توزيع الخدمات على المسارات" data={vm.kpiDist.services} />
                  </div>
                  <div style={{ marginTop: 13 }}>
                    <RankBars title="ترتيب الجهات حسب عدد المشاريع والعمليات والخدمات المقدَّمة" rows={vm.entityRank} />
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                    gap: 13,
                    marginTop: 13,
                  }}
                >
                  <KpiCard
                    value={vm.kpis.projInit}
                    label="المشاريع / المبادرات"
                    iconD="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7"
                  />
                  <KpiCard value={vm.kpis.operations} label="العمليات" iconD="M3 6h18M3 12h18M3 18h18" />
                  <KpiCard value={vm.kpis.services} label="الخدمات" grid />
                </div>
              )}

              {/* Budget overview: approved · spent · remaining + utilization bar */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E7ECF4',
                  borderRadius: 16,
                  padding: '20px 24px',
                  marginTop: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                  <BudgetFigure value={vm.aiStats.approvedBudgetLabel} label="الميزانية المعتمدة" />
                  <div style={{ width: 1, height: 36, background: '#EBEFF6' }} />
                  <BudgetFigure value={vm.aiStats.spentBudgetLabel} label="المصروفة حتى الآن" />
                  <div style={{ width: 1, height: 36, background: '#EBEFF6' }} />
                  <BudgetFigure value={vm.aiStats.remainingBudgetLabel} label="المتبقي" />
                  <span
                    style={{
                      marginRight: 'auto',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#54627B',
                      background: '#F1F4F9',
                      borderRadius: 999,
                      padding: '6px 13px',
                    }}
                  >
                    نسبة الاستخدام {vm.aiStats.budgetPct}%
                  </span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ height: 6, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${vm.aiStats.budgetPct}%`,
                        height: '100%',
                        background: '#2563EB',
                        borderRadius: 999,
                        transition: 'width .4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#13213C', margin: '10px 0 2px' }}>
                تصنيف توصيات التحول الذكي
              </div>
              <div
                data-r="reco"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 4 }}
              >
                <RecoCard value={vm.aiStats.now} label="موصى به 100%" dot="#0B8A4B" />
                <RecoCard value={vm.aiStats.wait} label="قائمة الانتظار" dot="#B45309" />
                <RecoCard value={vm.aiStats.low} label="غير موصى به" dot="#DC2B38" />
              </div>
            </>
          )}

          {/* Per-batch (مرحلة) summary: clean total + expand icon for details */}
          {vm.batchSummary.some((b) => b.count > 0 || (vm.showLaunchCosts && b.launches.length > 0)) && (
            <div
              data-tour="stages"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                gap: 12,
              }}
            >
              {vm.batchSummary.map((b) => {
                const isOpen = openBatch === b.name;
                const hasDetails = b.count > 0 || (vm.showLaunchCosts && b.launches.length > 0);
                return (
                <div
                  key={b.name}
                  style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '13px 15px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#33415C', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{b.name}</span>
                        <InfoTip text="إجمالي التكلفة التقديرية لتنفيذ ما هو معيَّن لهذه المرحلة. أيقونة السهم تعرض خطط الإطلاق وتفاصيلها." />
                      </div>
                      {b.period && (
                        <div style={{ fontSize: 10.5, color: '#9AA6BC', fontWeight: 600, marginTop: 2 }}>{b.period}</div>
                      )}
                    </div>
                    {hasDetails && (
                      <button
                        title="عرض التفاصيل"
                        onClick={() => setOpenBatch(isOpen ? null : b.name)}
                        style={{
                          width: 26,
                          height: 26,
                          flex: 'none',
                          borderRadius: 8,
                          border: '1px solid #E7ECF4',
                          background: isOpen ? '#EAF0FE' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={14} color="#2563EB" />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C', marginTop: 9 }}>{b.costLabel}</div>

                  {/* details: counts + launches (click a launch for its items) */}
                  {isOpen && (
                    <div style={{ marginTop: 9, borderTop: '1px solid #F0F3F8', paddingTop: 8 }}>
                      <div style={{ fontSize: 10.5, color: '#8A97AD', fontWeight: 600, marginBottom: 4 }}>
                        {b.count} من {vm.typesPhrase}{b.opsCount ? ' · ' + b.opsCount + ' عملية' : ''}
                      </div>
                      {vm.showLaunchCosts &&
                        b.launches.map((l) => {
                          const lOpen = openLaunch === l.id;
                          return (
                            <div key={l.id}>
                              <div
                                onClick={() => l.items.length && setOpenLaunch(lOpen ? null : l.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  padding: '2.5px 0',
                                  cursor: l.items.length ? 'pointer' : 'default',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 10.5,
                                    color: '#8A97AD',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    minWidth: 0,
                                  }}
                                >
                                  {l.items.length > 0 && (
                                    <Icon d={lOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} size={11} color="#B9C3D4" />
                                  )}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {l.title}
                                  </span>
                                </span>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#33415C', flex: 'none' }}>
                                  {l.execLabel}
                                  {l.launchLabel && (
                                    <span style={{ color: '#9AA6BC', fontWeight: 600 }}> · إطلاق {l.launchLabel}</span>
                                  )}
                                </span>
                              </div>
                              {lOpen && (
                                <div
                                  style={{
                                    margin: '2px 0 6px',
                                    background: '#F7F9FD',
                                    border: '1px solid #EEF1F7',
                                    borderRadius: 9,
                                    padding: '4px 8px',
                                  }}
                                >
                                  {l.items.map((x) => (
                                    <div
                                      key={x.id}
                                      onClick={(e) => {
                                        stop(e);
                                        x.onOpen();
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                        padding: '3px 0',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                        <span
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            color: '#54627B',
                                            background: '#EEF1F7',
                                            borderRadius: 999,
                                            padding: '1px 6px',
                                            flex: 'none',
                                          }}
                                        >
                                          {x.typeLabel}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#33415C',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {x.title}
                                        </span>
                                      </span>
                                      <span style={{ fontSize: 9.5, fontWeight: 600, color: '#8A97AD', flex: 'none' }}>
                                        {x.budgetLabel}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}

          {/* List section title + view switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <div className="hd" style={{ fontSize: 15, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>
              {'قائمة ' + vm.typesPhrase + ' المقدَّمة'}
            </div>
            <div style={{ flex: 1, height: 1, background: '#E1E7F1' }} />
            <ExportMenu onExcel={s.exportExcel} onPpt={s.exportPpt} />
            <div
              style={{
                display: 'flex',
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 10,
                padding: 3,
                gap: 2,
                flex: 'none',
              }}
            >
              {(
                [
                  { k: 'cards' as const, d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', t: 'بطاقات' },
                  { k: 'list' as const, d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', t: 'قائمة' },
                ]
              ).map((o) => (
                <button
                  key={o.k}
                  title={o.t}
                  onClick={() => setViewMode(o.k)}
                  style={{
                    width: 32,
                    height: 28,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: viewMode === o.k ? '#0F1F3D' : 'transparent',
                  }}
                >
                  <Icon d={o.d} size={15} color={viewMode === o.k ? '#fff' : '#8A97AD'} />
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {vm.cards.length === 0 ? (
            <div
              data-tour="cards"
              style={{
                border: '1.5px dashed #D5DEEC',
                background: '#FAFCFF',
                borderRadius: 16,
                padding: '38px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#33415C' }}>{'لا توجد ' + vm.typesPhrase + ' للعرض'}</div>
              <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 6, lineHeight: 1.7 }}>
                {vm.emptyDesc}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div data-tour="cards">
              <ListView cards={vm.cards} />
            </div>
          ) : (
            <div data-r="cards" data-tour="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {vm.cards.map((c) => (
                <CardItem key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* First-login onboarding walkthrough */}
      <Tour steps={TOUR_STEPS} />
    </div>
  );
}

// ---------------------------------------------------------------------------
const selectStyle: CSSProperties = {
  height: 40,
  width: 170,
  minWidth: 170,
  border: '1px solid #E7ECF4',
  background: '#fff',
  borderRadius: 11,
  padding: '0 13px',
  fontWeight: 700,
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

function StatCard({ value, label, dot, info }: { value: number; label: string; dot?: string; info?: string }) {
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
      <div style={{ fontSize: 21, fontWeight: 800, color: '#13213C', marginTop: 3, lineHeight: 1.25 }}>{value}</div>
    </div>
  );
}

function RecoCard({ value, label, dot }: { value: number; label: string; dot: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: '13px 15px' }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: '#6B7A93',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none' }} />
        {label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: '#13213C', marginTop: 3, lineHeight: 1.25 }}>{value}</div>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
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
                      padding: '7px 16px',
                      fontWeight: 800,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    اعتماد
                  </button>
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
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
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
          fontWeight: 500,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {c.desc}
      </div>

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
            <div style={{ fontSize: 10, color: '#9AA6BC', fontWeight: 600, lineHeight: 1.4 }}>{c.scoreExpl}</div>
          </div>
        </div>
      )}

      {/* launch plan meta (batch already lives in the status chip) */}
      {c.launchLabel && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: -2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#54627B',
            }}
          >
            <Icon d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" size={12} color="#8A97AD" />
            الإطلاق: {c.launchLabel}
          </span>
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
              padding: '8px 0',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            اعتماد
          </button>
          <button
            onClick={(e) => {
              stop(e);
              c.onMenu();
            }}
            style={{
              width: 40,
              flex: 'none',
              background: '#fff',
              color: '#54627B',
              border: '1px solid #E7ECF4',
              borderRadius: 9,
              padding: '8px 0',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ⋯
          </button>
          {c.menuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 46,
                left: 0,
                width: 180,
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 11,
                boxShadow: '0 16px 40px -14px rgba(2,12,35,.4)',
                overflow: 'hidden',
                zIndex: 5,
              }}
            >
              <HoverDiv
                onClick={(e) => {
                  stop(e);
                  c.onReqInfo();
                }}
                base={{ padding: '11px 13px', fontSize: 12.5, fontWeight: 700, color: '#33405A', cursor: 'pointer' }}
                hover={{ background: '#F5F8FD' }}
              >
                طلب معلومات إضافية
              </HoverDiv>
              <HoverDiv
                onClick={(e) => {
                  stop(e);
                  c.onReject();
                }}
                base={{
                  padding: '11px 13px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#C0303B',
                  cursor: 'pointer',
                  borderTop: '1px solid #F0F3F8',
                }}
                hover={{ background: '#FBF3F4' }}
              >
                رفض
              </HoverDiv>
            </div>
          )}
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
        <div
          style={{
            borderTop: '1px solid #F0F3F8',
            paddingTop: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
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
          {c.canWithdrawNom && (
            <button
              onClick={(e) => {
                stop(e);
                c.onWithdrawNom();
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
              سحب
            </button>
          )}
          {c.canDeclineNom && (
            <button
              onClick={(e) => {
                stop(e);
                c.onDeclineNom();
              }}
              style={{
                background: '#fff',
                border: '1px solid #F1D4D7',
                color: '#C0303B',
                borderRadius: 8,
                padding: '6px 11px',
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              رفض الترشيح
            </button>
          )}
        </div>
      )}
    </div>
  );
}
