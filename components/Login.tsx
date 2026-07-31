'use client';
import { useEffect, useRef, useState } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import { AboutPage, ContactPage, LibraryPage, PublicFooter, PublicNav, type PublicTab } from './PublicSite';


// ============================================================================
// Home-hero Agentic-AI background: slow neural network + drifting particles +
// curved data paths on canvas, plus an eased cursor spotlight. Decorative
// only (pointer-events none, behind all content), reduced-motion aware.
// ============================================================================
function LoginFx() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const cv = canvasRef.current;
    const glow = glowRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let raf = 0;
    let t = 0;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; depth: number; phase: number };
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };

    const resize = () => {
      W = cv.offsetWidth;
      H = cv.offsetHeight;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.round(Math.min(64, Math.max(26, (W * H) / 30000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.5 + 0.7,
        depth: Math.random() < 0.45 ? 0.45 : 1, // two depth planes
        phase: Math.random() * Math.PI * 2,
      }));
    };

    // keep the column behind the logo + card calm and readable
    const keep = (x: number, y: number) => {
      const dx = (x - W / 2) / (W * 0.3);
      const dy = (y - H * 0.55) / (H * 0.42);
      const d = dx * dx + dy * dy;
      return d < 1 ? Math.max(0.12, d * d) : 1;
    };

    const drawPaths = () => {
      // three slow curved data paths with a travelling dash
      const paths: [number, number, number, number, number, number][] = [
        [-60, H * 0.22, W * 0.42, H * -0.06, W + 80, H * 0.3],
        [-80, H * 0.85, W * 0.5, H * 1.06, W + 60, H * 0.72],
        [W * 0.1, H * 1.05, W * 0.02, H * 0.45, W * 0.24, -40],
      ];
      paths.forEach((p9, i) => {
        ctx.beginPath();
        ctx.moveTo(p9[0], p9[1]);
        ctx.quadraticCurveTo(p9[2], p9[3], p9[4], p9[5]);
        ctx.strokeStyle = 'rgba(39,194,240,0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 130]);
        ctx.lineDashOffset = -((t * 26 + i * 60) % 500);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    };

    const frame = (loop: boolean) => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // eased cursor / ambient position
      if (coarse) {
        mouse.tx = W / 2 + Math.cos(t * 0.13) * W * 0.34;
        mouse.ty = H * 0.5 + Math.sin(t * 0.09) * H * 0.3;
        mouse.on = true;
      }
      mouse.x += (mouse.tx - mouse.x) * 0.07;
      mouse.y += (mouse.ty - mouse.y) * 0.07;
      if (glow) {
        glow.style.opacity = mouse.on && !reduced ? '1' : '0';
        glow.style.transform = `translate(${mouse.x - 320}px, ${mouse.y - 320}px)`;
      }

      drawPaths();

      const LINK = Math.min(168, Math.max(112, W * 0.105));
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }
      // links between nearby nodes (alpha breathes slowly per pair)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const d = Math.sqrt(d2);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const mdx = mx - mouse.x;
          const mdy = my - mouse.y;
          const boost = mouse.on ? Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 340) * 0.14 : 0;
          const breathe = 0.75 + 0.25 * Math.sin(t * 0.6 + a.phase + b.phase);
          const alpha = ((1 - d / LINK) * 0.13 * a.depth * b.depth * breathe + boost) * keep(mx, my);
          if (alpha <= 0.004) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(120,190,248,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      // glowing nodes + faint particles
      for (const n of nodes) {
        const tw = 0.65 + 0.35 * Math.sin(t * 0.8 + n.phase);
        const ndx = n.x - mouse.x;
        const ndy = n.y - mouse.y;
        const nboost = mouse.on ? Math.max(0, 1 - Math.sqrt(ndx * ndx + ndy * ndy) / 300) * 0.35 : 0;
        const al = (0.32 * n.depth * tw + nboost) * keep(n.x, n.y);
        if (al <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * n.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,205,250,${al.toFixed(3)})`;
        ctx.fill();
        if (n.depth === 1) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(39,194,240,${(al * 0.16).toFixed(3)})`;
          ctx.fill();
        }
      }
      if (loop) raf = requestAnimationFrame(() => frame(true));
    };

    resize();
    if (reduced) {
      // a single calm static frame — no motion, no spotlight
      frame(false);
    } else {
      raf = requestAnimationFrame(() => frame(true));
    }

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      if (!mouse.on) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      mouse.on = true;
    };
    const onLeave = () => {
      mouse.on = false;
      if (glow) glow.style.opacity = '0';
    };
    const onResize = () => resize();
    if (!coarse && !reduced) {
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
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      />
      <div
        ref={glowRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 640,
          height: 640,
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0,
          background: 'radial-gradient(circle, rgba(39,194,240,.14), rgba(46,116,238,.07) 42%, transparent 70%)',
          transition: 'opacity .6s ease',
          willChange: 'transform, opacity',
        }}
      />
    </>
  );
}

// Landing navigation — الصفحة الرئيسية is the login itself (blue, platform
// design); the other tabs are the public site pages from the design handoff.
const NAV_ITEMS: { key: PublicTab; label: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية' },
  { key: 'about', label: 'من نحن' },
  { key: 'library', label: 'المكتبة' },
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
        background: 'radial-gradient(125% 125% at 50% 0%,#0B2A66 0%,#071A40 55%,#04102A 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.55,
          backgroundImage:
            'radial-gradient(circle at 80% 15%,rgba(39,194,240,.20),transparent 45%),radial-gradient(circle at 15% 85%,rgba(37,99,235,.22),transparent 45%)',
        }}
      />

      <LoginFx />

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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fx-breath" aria-hidden style={{ position: 'absolute', width: 340, height: 200, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(39,194,240,.16), rgba(46,116,238,.07) 55%, transparent 78%)', pointerEvents: 'none' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="assets/logo-dark.png"
              alt="مشروع الذكاء الاصطناعي المساعد"
              style={{ height: 110, position: 'relative' }}
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
