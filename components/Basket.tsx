'use client';
import type { VM } from '@/lib/viewModel';
import { Icon } from './Icon';

const BASKET_ICON = 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0';
const CHECK_ICON = 'M20 6 9 17l-5-5';

export function FundBar({ vm }: { vm: VM }) {
  if (!vm.fundBarShow) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 22,
        zIndex: 56,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#0F1F3D',
          color: '#fff',
          borderRadius: 16,
          padding: '12px 14px 12px 22px',
          boxShadow: '0 22px 55px -14px rgba(4,12,30,.6)',
          animation: 'fadeUp .2s',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800 }}>{vm.fundSelCount} عنصر محدّد</span>
        <button
          onClick={() => vm.store.clearFundSel()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.28)',
            color: '#fff',
            borderRadius: 11,
            padding: '10px 20px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          تخطي
        </button>
        <button
          onClick={() => vm.store.commitSelection()}
          style={{
            background: '#fff',
            color: '#0F1F3D',
            border: 'none',
            borderRadius: 11,
            padding: '10px 22px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {vm.fundBarActionLabel}
        </button>
      </div>
    </div>
  );
}

export function AssignBar({ vm }: { vm: VM }) {
  if (!vm.assignBar.show) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 22,
        zIndex: 56,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#0F1F3D',
          color: '#fff',
          borderRadius: 16,
          padding: '12px 14px 12px 22px',
          boxShadow: '0 22px 55px -14px rgba(4,12,30,.6)',
          animation: 'fadeUp .2s',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800 }}>{vm.assignBar.count} عنصر محدّد</span>
        <button
          onClick={() => vm.store.clearAssignSel()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.28)',
            color: '#fff',
            borderRadius: 11,
            padding: '10px 20px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          تخطي
        </button>
        <button
          onClick={() => vm.store.openAssign()}
          style={{
            background: '#fff',
            color: '#0F1F3D',
            border: 'none',
            borderRadius: 11,
            padding: '10px 22px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          تعيين خطة التنفيذ والإطلاق
        </button>
      </div>
    </div>
  );
}

export function BasketDrawer({ vm }: { vm: VM }) {
  if (!vm.basketOpen) return null;
  const b = vm.basket;
  const tabBase = {
    border: 'none',
    borderRadius: 10,
    padding: '9px 0',
    flex: 1,
    textAlign: 'center' as const,
    fontWeight: 800,
    cursor: 'pointer',
  };
  const activeTab = {
    background: '#0F1F3D',
    color: '#fff',
  };
  const inactiveTab = {
    background: '#F4F7FC',
    color: '#54627B',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-start',
      }}
    >
      <div
        onClick={() => vm.store.closeBasket()}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,16,38,.42)' }}
      />
      <div
        style={{
          position: 'relative',
          width: 440,
          maxWidth: '92vw',
          height: '100%',
          background: '#F7F9FD',
          boxShadow: '24px 0 60px -20px rgba(2,12,35,.5)',
          animation: 'slideIn .24s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E7ECF4',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                flex: 'none',
                borderRadius: 11,
                background: '#DCF3F5',
                color: '#0E7C86',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon d={BASKET_ICON} size={20} color="#0E7C86" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#13213C' }}>{b.title}</div>
              <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600, lineHeight: 1.5, marginTop: 2 }}>
                {b.subtitle}
              </div>
            </div>
            <button
              onClick={() => vm.store.closeBasket()}
              style={{
                width: 34,
                height: 34,
                flex: 'none',
                borderRadius: 10,
                border: '1px solid #E7ECF4',
                background: '#fff',
                color: '#54627B',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button
              onClick={() => vm.store.setBasketTab('sel')}
              style={{
                ...tabBase,
                fontSize: 12.5,
                ...(b.tab === 'sel' ? activeTab : inactiveTab),
              }}
            >
              {b.selTabLabel} · {b.selCount}
            </button>
            <button
              onClick={() => vm.store.setBasketTab('app')}
              style={{
                ...tabBase,
                fontSize: 12.5,
                ...(b.tab === 'app' ? activeTab : inactiveTab),
              }}
            >
              {b.appTabLabel} · {b.appCount}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {b.tab === 'sel' ? (
            b.selItems.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {b.selItems.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E7ECF4',
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div onClick={it.onOpen} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: '#EEF3FA',
                            color: '#42506B',
                          }}
                        >
                          {it.typeLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C', lineHeight: 1.4, marginTop: 10 }}>
                        {it.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600, marginTop: 4 }}>
                        {it.entity} · {it.pathName}
                      </div>
                    </div>
                    {b.isCommittee ? (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={it.onApprove}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(180deg,#0EA371,#0B8A4B)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 11,
                            padding: '10px 12px',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 10px 22px -10px rgba(11,138,75,.6)',
                          }}
                        >
                          اعتماد التمويل
                        </button>
                        <button
                          onClick={it.onDecline}
                          style={{
                            background: '#fff',
                            color: '#C0303B',
                            border: '1px solid #E7ECF4',
                            borderRadius: 11,
                            padding: '10px 16px',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          رفض
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '5px 11px',
                            borderRadius: 999,
                            color: '#B45309',
                            background: '#FFF3DE',
                          }}
                        >
                          بانتظار اللجنة الوطنية
                        </span>
                        <button
                          onClick={it.onWithdraw}
                          style={{
                            marginInlineStart: 'auto',
                            background: '#fff',
                            color: '#C0303B',
                            border: '1px solid #E7ECF4',
                            borderRadius: 11,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          سحب الترشيح
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '60px 20px',
                  color: '#9AA6BC',
                }}
              >
                <Icon d={BASKET_ICON} size={40} color="#C3CDDD" />
                <div style={{ fontSize: 13, fontWeight: 700 }}>لا توجد عناصر مرشّحة بعد</div>
              </div>
            )
          ) : b.appItems.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {b.appItems.map((it) => (
                <div
                  key={it.id}
                  onClick={it.onOpen}
                  style={{
                    background: '#fff',
                    border: '1px solid #D5EEE0',
                    borderRadius: 14,
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: '#EEF3FA',
                        color: '#42506B',
                      }}
                    >
                      {it.typeLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: '#E3F6EC',
                        color: '#0B8A4B',
                      }}
                    >
                      مموّل من اللجنة
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#13213C', lineHeight: 1.4, marginTop: 10 }}>
                    {it.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9AA6BC', fontWeight: 600, marginTop: 4 }}>
                    {it.entity} · {it.pathName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#54627B',
                      fontWeight: 700,
                      marginTop: 9,
                      background: '#F5F8FD',
                      border: '1px solid #EBEFF6',
                      borderRadius: 9,
                      padding: '8px 10px',
                      lineHeight: 1.55,
                    }}
                  >
                    {it.fundedText}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '60px 20px',
                color: '#9AA6BC',
              }}
            >
              <Icon d={CHECK_ICON} size={40} color="#C3CDDD" />
              <div style={{ fontSize: 13, fontWeight: 700 }}>لا توجد عناصر معتمدة بعد</div>
            </div>
          )}
        </div>

        {/* Sticky total footer */}
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #E7ECF4',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#54627B', fontSize: 12.5, fontWeight: 700 }}>
            إجمالي تكلفة التمويل المعتمد
          </span>
          <span style={{ color: '#0B8A4B', fontSize: 15, fontWeight: 800 }}>
            {vm.basket.fundedTotalLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
