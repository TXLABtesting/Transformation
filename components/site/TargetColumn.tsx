'use client';
import { useEffect, useRef, useState } from 'react';
import type { SiteTargetItem } from '@/lib/site';

interface TargetColumnProps {
  target: SiteTargetItem;
  /** يبدأ التعبئة والعدّاد عند دخول القسم نافذة العرض */
  active: boolean;
}

const FILL_GRADIENT =
  'linear-gradient(180deg,rgba(1,189,249,.92) 0%,rgba(1,138,251,.94) 45%,rgba(0,98,253,.96) 100%)';
const SIDE_GRADIENT = 'linear-gradient(180deg,rgba(1,189,249,.55),rgba(1,96,253,.65))';

/** أحد المستهدفين الرئيسيين: عمود زجاجي ثلاثي الأبعاد يمتلئ للنسبة المستهدفة */
export function TargetColumn({ target, active }: TargetColumnProps) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const { height, value, fill, label } = target;
  const depth = height / 2;

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1400);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  const level = active ? `${fill}%` : '0%';
  const faceBase = {
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    borderRadius: 8,
  };

  return (
    <div className="relative">
      <div
        className="relative"
        style={{ width: 190, height, transformStyle: 'preserve-3d', transform: 'rotateX(-4deg) rotateY(28deg)' }}
      >
        {/* الوجه الخلفي */}
        <div
          style={{
            ...faceBase,
            width: 190,
            height,
            transform: 'translate(-50%,-50%) rotateY(180deg) translateZ(60px)',
            background: 'linear-gradient(180deg,rgba(37,99,235,.04),rgba(37,99,235,.09))',
            border: '1px solid rgba(37,99,235,.14)',
          }}
        />
        {/* الوجهان الجانبيان */}
        {[-90, 90].map((deg) => (
          <div
            key={deg}
            style={{
              ...faceBase,
              width: 120,
              height,
              overflow: 'hidden',
              transform: `translate(-50%,-50%) rotateY(${deg}deg) translateZ(95px)`,
              background: 'linear-gradient(180deg,rgba(37,99,235,.05),rgba(37,99,235,.1))',
              border: '1px solid rgba(37,99,235,.12)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                insetInline: 0,
                bottom: 0,
                height: level,
                transition: 'height 1.8s .4s cubic-bezier(.22,1,.36,1)',
                background: SIDE_GRADIENT,
              }}
            />
          </div>
        ))}
        {/* الغطاءان العلوي والسفلي */}
        {[depth, -depth].map((z, i) => (
          <div
            key={z}
            style={{
              ...faceBase,
              width: 190,
              height: 120,
              transform: `translate(-50%,-50%) rotateX(90deg) translateZ(${z}px)`,
              background: i
                ? 'linear-gradient(140deg,rgba(37,99,235,.22),rgba(37,99,235,.12))'
                : 'linear-gradient(140deg,rgba(37,99,235,.12),rgba(37,99,235,.04))',
              border: `1px solid rgba(37,99,235,${i ? '.22' : '.18'})`,
            }}
          />
        ))}
        {/* الوجه الأمامي — يحمل التعبئة المضيئة */}
        <div
          style={{
            ...faceBase,
            width: 190,
            height,
            overflow: 'hidden',
            transform: 'translate(-50%,-50%) translateZ(60px)',
            background: 'linear-gradient(180deg,rgba(37,99,235,.06),rgba(37,99,235,.12))',
            border: '1px solid rgba(37,99,235,.2)',
            boxShadow: 'inset 0 0 40px rgba(37,99,235,.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              insetInline: 0,
              bottom: 0,
              height: level,
              transition: 'height 1.8s .4s cubic-bezier(.22,1,.36,1)',
              background: FILL_GRADIENT,
              boxShadow: '0 0 46px rgba(1,189,249,.55)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -16,
                insetInline: '-10%',
                height: 34,
                background:
                  'radial-gradient(ellipse at center,rgba(207,239,255,.95),rgba(127,212,247,.3) 60%,transparent 80%)',
                filter: 'blur(7px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ظل الأرضية */}
      <div
        className="absolute -bottom-7 left-1/2 h-14 w-[260px] -translate-x-1/2"
        style={{ background: 'radial-gradient(ellipse,rgba(37,99,235,.25),transparent 70%)', filter: 'blur(10px)' }}
      />

      <div className="absolute bottom-[calc(100%+22px)] left-1/2 z-[6] w-[220px] -translate-x-1/2 text-center">
        <div
          style={{
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: '-.02em',
            lineHeight: 1.15,
            background: 'linear-gradient(180deg,#01BDF9,#0062FD)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {count}%
        </div>
        <div className="mt-2 text-[13.5px] font-bold leading-[1.9] text-[#33415E]">{label}</div>
      </div>
    </div>
  );
}
