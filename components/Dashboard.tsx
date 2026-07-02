'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';

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

export function Dashboard({ vm }: { vm: VM }) {
  const s = vm.store;

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
          {/* Role switcher */}
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

          {/* Basket */}
          {vm.showBasket && (
            <div style={{ position: 'relative' }}>
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
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 9,
                      background: '#0E7C86',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {vm.basketBadge}
                  </span>
                )}
              </HoverButton>
            </div>
          )}

          {/* Avatar / profile */}
          <div style={{ position: 'relative' }}>
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
        style={{
          margin: '16px 24px 0',
          background: 'linear-gradient(110deg,#0B2A66,#0E2C66 50%,#123f93)',
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
              <div style={{ fontSize: 18, fontWeight: 800 }}>{vm.banner.title}</div>
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
            const done = st.isDone;
            const active = st.state === 'active';
            const lineBg = done || active ? '#fff' : 'rgba(255,255,255,.2)';
            const circleBg = done ? '#27C2F0' : active ? '#fff' : 'rgba(255,255,255,.14)';
            const circleColor = done ? '#fff' : active ? '#123f93' : '#9FC4F2';
            const circleBorder = 'none';
            const colGlow = active ? '0 0 0 4px rgba(39,194,240,.25)' : 'none';
            const labelColor = active ? '#fff' : '#9FC4F2';
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
                    {st.stepCount} عنصر
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
        {/* Path rail */}
        {vm.showRail && (
          <div data-r="rail" style={{ width: 290, flex: 'none', position: 'sticky', top: 80 }}>
            <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 18, padding: 13 }}>
              <div
                onClick={() => s.setActivePath('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 13px',
                  borderRadius: 13,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg,#2E74EE,#1F5FE0)',
                  boxShadow: '0 10px 22px -12px rgba(37,99,235,.7)',
                  marginBottom: 9,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 13.5,
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: 'rgba(255,255,255,.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
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
                  </span>{' '}
                  جميع المسارات
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#fff',
                    background: 'rgba(255,255,255,.2)',
                    borderRadius: 8,
                    padding: '3px 9px',
                  }}
                >
                  {vm.totalCount}
                </span>
              </div>
              {vm.pathRail.map((row) => (
                <div
                  key={row.id}
                  onClick={row.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '9px 10px',
                    borderRadius: 11,
                    cursor: 'pointer',
                    marginBottom: 3,
                    ...(row.active ? { background: '#EAF0FE' } : null),
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        flex: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${row.color}1A`,
                      }}
                    >
                      <Icon d={row.icon} size={17} color={row.color} />
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#33405A',
                        lineHeight: 1.35,
                        whiteSpace: 'normal',
                      }}
                    >
                      {row.name}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#9AA6BC',
                      flex: 'none',
                      minWidth: 18,
                      textAlign: 'center',
                      background: '#F1F4F9',
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}
                  >
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#13213C' }}>{vm.activePathName}</div>
              <div style={{ fontSize: 12, color: '#9AA6BC', fontWeight: 600, marginTop: 3 }}>
                {vm.streamSummary}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <HoverButton
                  onClick={s.exportExcel}
                  base={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 40,
                    padding: '0 15px',
                    border: '1px solid #E7ECF4',
                    background: '#fff',
                    borderRadius: 11,
                    color: '#42506B',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15,31,61,.04)',
                    transition: 'border-color .15s,box-shadow .15s',
                  }}
                  hover={{ borderColor: '#BFE6CE', boxShadow: '0 6px 16px -10px rgba(11,138,75,.5)' }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: '#E3F6EC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <Icon
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 13l6 5M15 13l-6 5"
                      size={14}
                      color="#0B8A4B"
                    />
                  </span>{' '}
                  Excel
                </HoverButton>
                <HoverButton
                  onClick={s.exportPpt}
                  base={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 40,
                    padding: '0 15px',
                    border: '1px solid #E7ECF4',
                    background: '#fff',
                    borderRadius: 11,
                    color: '#42506B',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15,31,61,.04)',
                    transition: 'border-color .15s,box-shadow .15s',
                  }}
                  hover={{ borderColor: '#F3D2C0', boxShadow: '0 6px 16px -10px rgba(194,65,12,.5)' }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: '#FCEEE6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <Icon
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 13h4a2 2 0 0 1 0 4H9v-4zm0 0v5"
                      size={14}
                      color="#C2410C"
                    />
                  </span>{' '}
                  PowerPoint
                </HoverButton>
              </div>
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
                      background: '#fff',
                      color: '#33415C',
                      border: '1px solid #DCE3EE',
                      borderRadius: 11,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" size={16} color="#54627B" />
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
                    <Icon d="M12 5v14M5 12h14" size={17} strokeWidth={2.2} /> إضافة جديد
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI strip (non-ai) */}
          {vm.notAiRole && (
            <div
              data-r="kpi"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                gap: 13,
              }}
            >
              {(vm.role === 'entity' || vm.role === 'coord') && (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #E7ECF4',
                    borderRadius: 16,
                    padding: '15px 17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 25, fontWeight: 800, color: '#13213C' }}>
                      {vm.kpis.completion}
                      <span style={{ fontSize: 15, color: '#9AA6BC' }}>%</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginTop: 5 }}>
                      نسبة الإنجاز
                    </div>
                  </div>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: '#E5EEFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <Icon d="M3 3v18h18M7 15l4-4 3 3 5-6" size={19} color="#2563EB" />
                  </span>
                </div>
              )}
              <KpiCard
                value={vm.kpis.projInit}
                label="المشاريع / المبادرات"
                iconD="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7"
              />
              {vm.showOpsKpi && (
                <KpiCard value={vm.kpis.operations} label="العمليات" iconD="M3 6h18M3 12h18M3 18h18" />
              )}
              {vm.showSvcKpi && <KpiCard value={vm.kpis.services} label="الخدمات" grid />}
              {(vm.role === 'entity' || vm.role === 'coord') && (
                <>
                  <KpiCard
                    value={vm.kpis.avgTargetPct}
                    suffix="%"
                    label="متوسط نسبة الأجينتة المستهدفة"
                    iconD="M12 2v20M2 12h20"
                  />
                  <KpiCard
                    value={vm.kpis.avgAutomationPct}
                    suffix="%"
                    label="متوسط نسبة الأتمتة الحالية"
                    iconD="M4 4h16v16H4zM9 9h6v6H9z"
                  />
                  <KpiCard
                    value={vm.kpis.completedCount}
                    sub={vm.kpis.completedPct + '%'}
                    label="عناصر مكتملة"
                    iconD="M20 6 9 17l-5-5"
                  />
                </>
              )}
            </div>
          )}

          {/* Entity totals breakdown (type × stream) */}
          {vm.role === 'entity' && vm.breakdownTotals.total > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 16,
                padding: '17px 19px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C', marginBottom: 12 }}>
                توزيع العناصر حسب المسار والنوع
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr>
                    {['المسار', 'المشاريع / المبادرات', 'العمليات', 'الخدمات', 'الإجمالي'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? 'right' : 'center',
                          padding: '7px 10px',
                          color: '#8A97AD',
                          fontWeight: 700,
                          borderBottom: '1px solid #EEF1F7',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vm.breakdown
                    .filter((r) => r.total > 0)
                    .map((r) => (
                      <tr key={r.name}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#33415C', borderBottom: '1px solid #F4F6FA' }}>
                          {r.name}
                        </td>
                        {[r.projInit, r.operations, r.services, r.total].map((v, i) => (
                          <td
                            key={i}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                              color: i === 3 ? '#13213C' : '#54627B',
                              fontWeight: i === 3 ? 800 : 600,
                              borderBottom: '1px solid #F4F6FA',
                            }}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  <tr>
                    <td style={{ padding: '9px 10px', fontWeight: 800, color: '#13213C' }}>الإجمالي</td>
                    {[
                      vm.breakdownTotals.projInit,
                      vm.breakdownTotals.operations,
                      vm.breakdownTotals.services,
                      vm.breakdownTotals.total,
                    ].map((v, i) => (
                      <td
                        key={i}
                        style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#13213C' }}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Committee analytics (ai) */}
          {vm.isAiRole && (
            <>
              <div
                data-r="kpi"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 13, marginBottom: 4 }}
              >
                <StatCard value={vm.aiStats.entCount} label="الجهات المشاركة" color="#13213C" />
                <StatCard value={vm.aiStats.total} label="إجمالي العناصر" color="#13213C" />
                <StatCard value={vm.aiStats.pending} label="بانتظار الاعتماد" color="#B45309" />
                <StatCard value={vm.aiStats.funded} label="معتمدة للتمويل" color="#0B8A4B" />
                <HoverDiv
                  base={{
                    position: 'relative',
                    background: '#fff',
                    border: '1px solid #E7ECF4',
                    borderRadius: 16,
                    padding: '15px 17px',
                  }}
                  hover={{ zIndex: 5 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 25, fontWeight: 800, color: '#2563EB' }}>
                      {vm.aiStats.avgPct}
                      <span style={{ fontSize: 13, color: '#9AA6BC' }}>%</span>
                    </div>
                    <span
                      data-tip=""
                      style={{
                        position: 'relative',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#EAF0FE',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 900,
                        cursor: 'help',
                      }}
                    >
                      <svg
                        width={12}
                        height={12}
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
                      <span
                        data-tipbox=""
                        style={{
                          position: 'absolute',
                          top: 24,
                          right: -2,
                          left: 'auto',
                          transform: 'none',
                          width: 250,
                          maxWidth: '70vw',
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
                          zIndex: 20,
                        }}
                      >
                        متوسط درجات التحول لكل العناصر معبّراً عنه كنسبة مئوية. تُحسب درجة كل عنصر (من 5) من: الأثر
                        ٢٥٪ · القابلية ٢٠٪ · الجاهزية ١٥٪ · كثافة الاستخدام ١٥٪ · الأولوية ١٠٪ · فرصة الأتمتة ١٠٪ ·
                        سهولة التعقيد ٥٪ ثم تُحوّل النتيجة إلى نسبة مئوية.
                      </span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginTop: 5 }}>
                    متوسط درجة التحول
                  </div>
                </HoverDiv>
              </div>
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
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 4 }}
              >
                <RecoCard value={vm.aiStats.now} label="موصى به 100%" color="#0B8A4B" />
                <RecoCard value={vm.aiStats.wait} label="قائمة الانتظار" color="#B45309" />
                <RecoCard value={vm.aiStats.low} label="غير موصى به" color="#DC2B38" />
              </div>
            </>
          )}

          {/* List section title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C', whiteSpace: 'nowrap' }}>
              قائمة العناصر المقدَّمة
            </div>
            <div style={{ flex: 1, height: 1, background: '#E1E7F1' }} />
          </div>

          {/* Cards grid */}
          <div data-r="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {vm.cards.map((c) => (
              <CardItem key={c.id} c={c} />
            ))}
          </div>
        </div>
      </div>
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
}: {
  value: number;
  label: string;
  iconD?: string;
  grid?: boolean;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E7ECF4',
        borderRadius: 16,
        padding: '15px 17px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: 25, fontWeight: 800, color: '#13213C' }}>
          {value}
          {suffix && <span style={{ fontSize: 15, color: '#9AA6BC' }}>{suffix}</span>}
          {sub && (
            <span style={{ fontSize: 12.5, color: '#9AA6BC', fontWeight: 700, marginRight: 6 }}>({sub})</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginTop: 5 }}>{label}</div>
      </div>
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: '#E5EEFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {grid ? (
          <svg
            width={19}
            height={19}
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
          <Icon d={iconD!} size={19} color="#2563EB" />
        )}
      </span>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: '15px 17px' }}>
      <div style={{ fontSize: 25, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8A97AD', fontWeight: 600, marginTop: 5 }}>{label}</div>
    </div>
  );
}

function RecoCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8A97AD', marginTop: 5 }}>{label}</div>
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
              border: `2px solid ${c.assignChecked ? '#0E7C86' : '#C7D1E2'}`,
              background: c.assignChecked ? '#0E7C86' : '#fff',
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

      {/* Execution batch + launch plan meta */}
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
          <Icon
            d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            size={12}
            color="#8A97AD"
          />
          التنفيذ: {c.batchLabel}
        </span>
        {c.launchLabel && (
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
        )}
      </div>

      {/* Footer meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #F0F3F8',
          paddingTop: 11,
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

      {/* Coord fill CTA */}
      {c.showPathCta && (
        <div style={{ borderTop: '1px solid #F0F3F8', paddingTop: 11 }}>
          <button
            onClick={(e) => {
              stop(e);
              c.onPathCta();
            }}
            style={{
              width: '100%',
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
              color: '#0E7C86',
              background: '#DCF3F5',
              borderRadius: 999,
              padding: '5px 11px',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0E7C86' }} />
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
