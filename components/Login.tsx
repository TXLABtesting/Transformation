'use client';
import { useEffect, useRef, useState } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import { AboutPage, ContactPage, LibraryPage, PublicFooter, PublicNav, type PublicTab } from './PublicSite';



// ===========================================================================
// InteractiveNumberBackground — homepage only. A dense, very faint field of
// 0-9 digits on canvas; digits near the pointer ease toward light blue and
// scale up slightly. No spotlight, no glow layer, no particles.
// ===========================================================================
function InteractiveNumberBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    type Cell = { x: number; y: number; v: string; base: number; s: number; cur: number };
    let cells: Cell[] = [];
    let W = 0;
    let H = 0;
    let raf = 0;
    let dirty = true;
    const ptr = { x: -9999, y: -9999, on: false };
    let radius = 160;
    let fontSize = 10;

    const build = () => {
      const rect = cv.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // density + radius per breakpoint
      const wide = W >= 1200;
      const mid = W >= 768;
      fontSize = wide ? 10 : mid ? 9 : 8;
      radius = wide ? 160 : mid ? 130 : 110;
      const stepX = wide ? 22 : mid ? 20 : 18;
      const stepY = wide ? 24 : mid ? 22 : 20;
      cells = [];
      for (let y = stepY * 0.6; y < H + stepY; y += stepY) {
        for (let x = stepX * 0.6; x < W + stepX; x += stepX) {
          cells.push({
            // tiny controlled jitter so the grid never reads as mechanical
            x: x + (Math.random() - 0.5) * 3,
            y: y + (Math.random() - 0.5) * 3,
            v: String(Math.floor(Math.random() * 10)),
            base: 0.1 + Math.random() * 0.04, // 0.10-0.14
            s: 0,
            cur: 0,
          });
        }
      }
      dirty = true;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const c of cells) {
        // target strength from pointer distance, smoothstep falloff
        let target = 0;
        if (ptr.on) {
          const dx = c.x - ptr.x;
          const dy = c.y - ptr.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < radius) {
            const t = 1 - d / radius;
            target = t * t * (3 - 2 * t);
          }
        }
        c.cur += (target - c.cur) * 0.12; // eased approach + gentle release
        if (c.cur < 0.002) c.cur = 0;
        const k = c.cur;
        const size = fontSize * (1 + 0.18 * k);
        const alpha = c.base + (0.9 - c.base) * k;
        // muted blue -> light blue
        const r = Math.round(72 + (85 - 72) * k);
        const g = Math.round(103 + (199 - 103) * k);
        const b = Math.round(153 + (255 - 153) * k);
        ctx.font = size.toFixed(1) + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
        if (k > 0.02) {
          // activated digits bloom into a soft blur that grows with strength
          ctx.shadowColor = `rgba(120,216,255,${(0.75 * k).toFixed(3)})`;
          ctx.shadowBlur = 18 * k;
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx.fillText(c.v, c.x, c.y - k);
          // second pass widens the halo so the glow reads as a diffuse blur
          ctx.shadowBlur = 34 * k;
          ctx.globalAlpha = 0.55 * k;
          ctx.fillText(c.v, c.x, c.y - k);
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx.fillText(c.v, c.x, c.y - k);
        }
      }
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      const active = ptr.on || cells.some((c) => c.cur > 0.002);
      if (active || dirty) {
        draw();
        dirty = false;
      }
      raf = requestAnimationFrame(loop);
    };

    build();
    draw();
    if (!reduced && !coarse) raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const rect = cv.getBoundingClientRect();
      ptr.x = e.clientX - rect.left;
      ptr.y = e.clientY - rect.top;
      ptr.on = ptr.x >= 0 && ptr.y >= 0 && ptr.x <= rect.width && ptr.y <= rect.height;
    };
    const onLeave = () => {
      ptr.on = false;
    };
    const onResize = () => {
      build();
      draw();
    };
    if (!reduced && !coarse) {
      window.addEventListener('mousemove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

// Landing navigation — الصفحة الرئيسية is the login itself (blue, platform
// design); the other tabs are the public site pages from the design handoff.
const NAV_ITEMS: { key: PublicTab; label: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية' },
  { key: 'about', label: 'من نحن' },
  { key: 'library', label: 'المنشورات' },
  { key: 'contact', label: 'تواصل معنا' },
];

export function Login({ vm }: { vm: VM }) {
  const loginUaePass = useStore((s) => s.loginUaePass);
  const [hover, setHover] = useState(false);
  const [tab, setTab] = useState<PublicTab>('home');
  const [navHov, setNavHov] = useState<PublicTab | null>(null);
  void vm;

  // Presentation default is a MOCK login that jumps straight into the flow.
  // Set NEXT_PUBLIC_UAEPASS_MODE=live to start the real UAE PASS OIDC flow.
  const onLogin = () => {
    if (process.env.NEXT_PUBLIC_UAEPASS_MODE === 'live') {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
      window.location.href = `${base}/api/auth/uaepass/login`;
      return;
    }
    loginUaePass();
  };

  // ---- public site pages (white nav + page + footer, per the handoff) ----
  if (tab !== 'home') {
    return (
      <div data-screen-label="Login" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', direction: 'rtl', background: tab === 'about' ? '#F7F9FD' : tab === 'library' ? '#fff' : '#EEF2F9' }}>
        <PublicNav tab={tab} onNav={setTab} onLogin={() => setTab('home')} />
        <div style={{ flex: 1 }}>
          {tab === 'about' && <AboutPage />}
          {tab === 'library' && <LibraryPage />}
          {tab === 'contact' && <ContactPage />}
        </div>
        <PublicFooter />
      </div>
    );
  }

  // ---- home: the blue login page (existing platform design) ----
  return (
    <div
      data-screen-label="Login"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#041126 0%,#020713 100%)',
      }}
    >
      <InteractiveNumberBackground />

      {/* ===== top navigation ===== */}
      <nav
        data-r="landing-nav"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          flexWrap: 'wrap',
          padding: '16px 20px',
          background: 'rgba(4,14,36,.35)',
          borderBottom: '1px solid rgba(159,196,242,.16)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {NAV_ITEMS.map((n) => {
          const active = tab === n.key;
          const hov = navHov === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              onMouseEnter={() => setNavHov(n.key)}
              onMouseLeave={() => setNavHov(null)}
              style={{
                position: 'relative',
                background: active ? 'rgba(255,255,255,.10)' : hov ? 'rgba(255,255,255,.06)' : 'transparent',
                border: 'none',
                borderRadius: 10,
                padding: '10px 22px',
                fontSize: 14.5,
                fontWeight: 800,
                color: active ? '#fff' : '#9FC4F2',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background .15s,color .15s',
              }}
            >
              {n.label}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    right: 18,
                    left: 18,
                    bottom: 4,
                    height: 2.5,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg,#27C2F0,#2E74EE)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ===== page body ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px 60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', animation: 'fadeUp .5s ease both' }}>
          {/* the project logo appears on the blue home page only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="assets/logo-dark.png"
              alt="مشروع الذكاء الاصطناعي المساعد"
              style={{ height: 110 }}
            />
          </div>
          <div style={{ height: 40 }} />

          <div
            style={{
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.16)',
              borderRadius: 22,
              padding: '30px 26px',
              backdropFilter: 'blur(16px) saturate(140%)',
              WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              boxShadow: '0 24px 60px -24px rgba(0,0,0,.5)',
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 22px', color: '#fff' }}>
              تسجيل الدخول
            </h1>
            <button
              onClick={onLogin}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                direction: 'ltr',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 11,
                width: '100%',
                background: '#fff',
                border: '1.5px solid #DCE0E6',
                borderRadius: 14,
                padding: '13px 20px',
                cursor: 'pointer',
                transition: 'transform .15s,box-shadow .15s',
                transform: hover ? 'scale(1.015)' : 'none',
                boxShadow: hover
                  ? '0 14px 32px -14px rgba(0,0,0,.5)'
                  : '0 10px 28px -16px rgba(0,0,0,.45)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="assets/uaepass-finger.png"
                alt=""
                style={{ height: 26, maxHeight: 26, width: 'auto', display: 'block' }}
              />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', letterSpacing: '.2px' }}>
                Sign in with UAE PASS
              </span>
            </button>
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#9FC4F2', lineHeight: 1.8 }}>
              هوية رقمية واحدة موثوقة لجميع المواطنين والمقيمين والزوار
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          padding: '0 0 20px',
          textAlign: 'center',
          fontSize: 11.5,
          color: '#5E7BA8',
          fontWeight: 500,
          zIndex: 1,
        }}
      >
        © 2026 مشروع الذكاء الاصطناعي المساعد، جميع الحقوق محفوظة
      </div>
    </div>
  );
}
