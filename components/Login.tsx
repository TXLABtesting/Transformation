'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';



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
        const alpha = c.base + (1 - c.base) * k;
        // muted blue -> light blue
        const r = Math.round(72 + (85 - 72) * k);
        const g = Math.round(103 + (199 - 103) * k);
        const b = Math.round(153 + (255 - 153) * k);
        ctx.font = size.toFixed(1) + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
        if (k > 0.02) {
          // activated digits bloom into a soft blur that grows with strength
          ctx.shadowColor = `rgba(120,216,255,${(0.85 * k).toFixed(3)})`;
          ctx.shadowBlur = 22 * k;
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
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        filter: 'blur(1.2px)',
      }}
    />
  );
}

const lblSt: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#BBD4F5', marginBottom: 6 };
const fldSt: CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,.35)',
  background: 'rgba(255,255,255,.10)',
  color: '#fff',
  padding: '0 14px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
};

export function Login({ vm }: { vm: VM }) {
  const loginUaePass = useStore((s) => s.loginUaePass);
  const [hover, setHover] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(base + '/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email: email.trim(), password: pw }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: body.message || 'تعذّر تسجيل الدخول' });
        return;
      }
      window.location.href = base + '/dashboard';
    } catch {
      setMsg({ ok: false, text: 'تعذّر الاتصال بالخادم' });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setMsg({ ok: false, text: 'اكتب بريدك الإلكتروني أولاً ثم اضغط «نسيت كلمة المرور؟»' });
      return;
    }
    setBusy(true);
    try {
      await fetch(base + '/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'forgot', email: email.trim() }),
      });
      setMsg({ ok: true, text: 'إن كان البريد مسجَّلاً فستصلكم رسالة لتعيين كلمة مرور جديدة.' });
    } catch {
      setMsg({ ok: false, text: 'تعذّر الاتصال بالخادم' });
    } finally {
      setBusy(false);
    }
  };
  // صفحات الموقع العام أصبحت مسارات مستقلة (/ و/about و/library و/contact)
  // بشريط التنقل العائم الخاص بها — هذه الصفحة لتسجيل الدخول فقط.
  void vm;

  // الدخول بالهوية الرقمية (UAE PASS) — مخفي من الواجهة حالياً بقرار الجهة،
  // ومساره في الخادم كما هو: يكفي إظهار الزر لإعادة تفعيله.
  // Presentation default is a MOCK login that jumps straight into the flow.
  // Set NEXT_PUBLIC_UAEPASS_MODE=live to start the real UAE PASS OIDC flow.
  const onLogin = () => {
    if (process.env.NEXT_PUBLIC_UAEPASS_MODE === 'live') {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
      window.location.href = `${base}/api/auth/login`;
      return;
    }
    loginUaePass();
  };
  void onLogin;

  // ---- the blue login page (existing platform design) ----
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

      {/* صفحة تسجيل الدخول بلا شريط تنقل علوي — الشعار وبطاقة الدخول فقط */}

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
              src={(process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/logo-dark.png'}
              alt="مشروع الذكاء الاصطناعي المساعد"
              style={{ height: 110 }}
            />
          </div>
          <div style={{ height: 40 }} />

          <div className="login-ring">
          <div className="login-card" style={{ padding: '30px 26px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 22px', color: '#fff' }}>
              تسجيل الدخول
            </h1>
            {/* الدخول بالبريد وكلمة المرور — الهوية الرقمية مخفية حالياً
                (تبقى مسارها في الخادم لتفعيلها متى اعتُمدت) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              style={{ display: 'grid', gap: 12, textAlign: 'right' }}
            >
              <div>
                <label style={lblSt}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  dir="ltr"
                  placeholder="name@entity.gov.ae"
                  style={fldSt}
                />
              </div>
              <div>
                <label style={lblSt}>كلمة المرور</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                  style={fldSt}
                />
              </div>
              {msg && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: msg.ok ? '#9BE7C4' : '#FFC9CE', lineHeight: 1.8 }}>{msg.text}</div>
              )}
              <button
                type="submit"
                disabled={busy || !email.trim() || !pw}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                  width: '100%',
                  background: busy || !email.trim() || !pw ? 'rgba(255,255,255,.55)' : '#fff',
                  border: '1.5px solid #DCE0E6',
                  borderRadius: 14,
                  padding: '13px 20px',
                  cursor: busy || !email.trim() || !pw ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 16.5,
                  fontWeight: 800,
                  color: '#1A1A1A',
                  transition: 'transform .15s,box-shadow .15s',
                  transform: hover && !busy ? 'scale(1.015)' : 'none',
                  boxShadow: '0 10px 28px -16px rgba(0,0,0,.45)',
                }}
              >
                {busy ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
              </button>
            </form>
            <button
              onClick={forgot}
              style={{ marginTop: 14, width: '100%', background: 'transparent', border: 'none', color: '#9FC4F2', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              نسيت كلمة المرور؟
            </button>
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
        © جميع الحقوق محفوظة لمشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات 2026
      </div>
    </div>
  );
}
