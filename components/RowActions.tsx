'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from './Icon';

// ============================================================================
// إجراءات الصف — مكوّن موحّد
// ----------------------------------------------------------------------------
// كل جداول المنصة تستخدمه حتى تتطابق أحجام الأزرار ومحاذاتها في كل صف:
// - ثلاثة أزرار فأقل: تظهر كلها في سطر واحد (بلا التفاف).
// - أكثر من ثلاثة: يبقى الإجراء الأساسي ظاهراً، وتنتقل البقية إلى قائمة «⋮».
// القائمة تُرسم بموضع ثابت (fixed) حتى لا يقصّها الجدول ذو التمرير الأفقي،
// مع تعويض تكبير الصفحة (zoom على body) لأنه يضاعف إحداثيات العنصر الثابت.
// ============================================================================

export type RowActionKind = 'primary' | 'brand' | 'neutral' | 'amber' | 'danger';

export type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
  kind?: RowActionKind;
  title?: string;
  /** مسار أيقونة SVG اختياري يظهر قبل النص */
  icon?: string;
};

const H = 30;
const MENU_W = 208;

const TONE: Record<RowActionKind, { bg: string; color: string; border: string }> = {
  primary: { bg: 'linear-gradient(180deg,#0EA371,#0B8A4B)', color: '#fff', border: 'transparent' },
  brand: { bg: '#EAF0FE', color: '#2563EB', border: 'transparent' },
  neutral: { bg: '#fff', color: '#33405A', border: '#E7ECF4' },
  amber: { bg: '#FFF3DE', color: '#B45309', border: '#F1DCBA' },
  danger: { bg: '#FDF6F6', color: '#C0303B', border: '#F3D4D7' },
};

const btnStyle = (kind: RowActionKind): CSSProperties => {
  const t = TONE[kind];
  return {
    height: H,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 14px',
    background: t.bg,
    color: t.color,
    border: t.border === 'transparent' ? 'none' : '1px solid ' + t.border,
    borderRadius: 9,
    fontSize: 11.5,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
};

/** تكبير الصفحة الفعّال (body zoom) — يُضاعف إحداثيات العناصر الثابتة */
const zoomOf = (): number => {
  if (typeof window === 'undefined') return 1;
  const z = parseFloat(String(getComputedStyle(document.body).zoom || '1'));
  return Number.isFinite(z) && z > 0 ? z : 1;
};

export function RowActions({
  actions,
  maxInline = 3,
  align = 'flex-start',
}: {
  actions: (RowAction | false | null | undefined)[];
  /** أقصى عدد أزرار تظهر بلا قائمة (الافتراضي ثلاثة) */
  maxInline?: number;
  align?: 'flex-start' | 'center' | 'flex-end';
}) {
  const list = actions.filter(Boolean) as RowAction[];
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const trigRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const place = useCallback(() => {
    const el = trigRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const z = zoomOf();
    const h = menuRef.current?.offsetHeight || 44 * Math.max(1, list.length - 1) + 12;
    // أسفل الزر ما لم تضق المساحة، وبمحاذاة حافته اليمنى (واجهة من اليمين لليسار)
    const below = r.bottom / z + 6;
    const above = r.top / z - h - 6;
    const fitsBelow = r.bottom + (h + 12) * z <= window.innerHeight;
    // بمحاذاة حافة الزر اليمنى، فإن ضاقت المساحة يساراً فمن حافته اليسرى
    const rightAligned = r.right / z - MENU_W;
    const next = {
      top: Math.max(8, fitsBelow ? below : above),
      left: rightAligned >= 8 ? rightAligned : Math.max(8, r.left / z),
    };
    setPos((p) => (p && p.top === next.top && p.left === next.left ? p : next));
  }, [list.length]);

  useLayoutEffect(() => {
    if (!open) return;
    // تمريرة أولى بارتفاع تقديري، ثم تصحيحها بعد رسم القائمة بارتفاعها الحقيقي
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || trigRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!list.length) return null;
  const inline = list.length <= maxInline ? list : list.slice(0, 1);
  const rest = list.length <= maxInline ? [] : list.slice(1);

  const run = (a: RowAction) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    a.onClick();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: align, gap: 6, whiteSpace: 'nowrap' }}
    >
      {inline.map((a) => (
        <button key={a.key} onClick={run(a)} title={a.title || a.label} style={btnStyle(a.kind || 'neutral')}>
          {a.icon && <Icon d={a.icon} size={13} color={TONE[a.kind || 'neutral'].color} strokeWidth={2.2} />}
          {a.label}
        </button>
      ))}
      {rest.length > 0 && (
        <>
          <button
            ref={trigRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="إجراءات أخرى"
            title="إجراءات أخرى"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            style={{
              width: H,
              height: H,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: open ? '#EEF3FC' : '#fff',
              border: '1px solid ' + (open ? '#C9DBFB' : '#E7ECF4'),
              borderRadius: 9,
              cursor: 'pointer',
              padding: 0,
              flex: 'none',
            }}
          >
            <Icon d="M12 5h.01M12 12h.01M12 19h.01" size={16} color="#54627B" strokeWidth={2.6} />
          </button>
          {open && pos && (
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: MENU_W,
                background: '#fff',
                border: '1px solid #E7ECF4',
                borderRadius: 12,
                boxShadow: '0 18px 40px -18px rgba(16,36,79,.35)',
                padding: 6,
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {rest.map((a) => (
                <button
                  key={a.key}
                  role="menuitem"
                  onClick={run(a)}
                  title={a.title || a.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    textAlign: 'right',
                    padding: '9px 11px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: TONE[a.kind || 'neutral'].color === '#fff' ? '#0B8A4B' : TONE[a.kind || 'neutral'].color,
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F5F8FD')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {a.icon && <Icon d={a.icon} size={14} color={TONE[a.kind || 'neutral'].color} strokeWidth={2.2} />}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
