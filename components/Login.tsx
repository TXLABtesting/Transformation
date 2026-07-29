'use client';
import { useState } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';

// Landing/login navigation tabs — الصفحة الرئيسية is the login itself.
type NavTab = 'home' | 'about' | 'library' | 'contact';
const NAV_ITEMS: { key: NavTab; label: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية' },
  { key: 'about', label: 'عن المشروع' },
  { key: 'library', label: 'المكتبة' },
  { key: 'contact', label: 'تواصل معنا' },
];

export function Login({ vm }: { vm: VM }) {
  const loginUaePass = useStore((s) => s.loginUaePass);
  const [hover, setHover] = useState(false);
  const [tab, setTab] = useState<NavTab>('home');
  const [navHov, setNavHov] = useState<NavTab | null>(null);
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

  const pageCard: React.CSSProperties = {
    background: 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 22,
    padding: '28px 26px',
    backdropFilter: 'blur(16px) saturate(140%)',
    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    boxShadow: '0 24px 60px -24px rgba(0,0,0,.5)',
    textAlign: 'right',
    color: '#DCE7F7',
  };
  const pageTitle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 14px' };
  const pageText: React.CSSProperties = { fontSize: 13.5, lineHeight: 2, color: '#C7D6EE', fontWeight: 500, margin: 0 };

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
        <div style={{ width: '100%', maxWidth: tab === 'home' ? 480 : 640, textAlign: 'center', animation: 'fadeUp .5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="assets/uae-crest.png" alt="United Arab Emirates" style={{ height: 140 }} />
            <div style={{ width: 1, height: 96, background: 'rgba(159,196,242,.35)' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="assets/logo-dark.png"
              alt="مشروع الذكاء الاصطناعي المساعد"
              style={{ height: 96 }}
            />
          </div>
          <div style={{ height: 40 }} />

          {/* --- home: the login card --- */}
          {tab === 'home' && (
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
            </div>
          )}

          {/* --- about the project --- */}
          {tab === 'about' && (
            <div style={pageCard}>
              <h2 style={pageTitle}>عن المشروع</h2>
              <p style={pageText}>
                مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات هو مبادرة وطنية لتحويل العمليات
                والخدمات والمشاريع الحكومية عبر مساعدي الذكاء الاصطناعي، بمشاركة الجهات الاتحادية ضمن
                خمسة مسارات معتمدة. وتوفّر هذه المنصة بيئة موحّدة لتسجيل المدخلات ومتابعتها عبر مراحل
                التقييم والتطوير والإطلاق، وصولاً إلى التوسع في التطبيق على مستوى الحكومة.
              </p>
            </div>
          )}

          {/* --- library --- */}
          {tab === 'library' && (
            <div style={pageCard}>
              <h2 style={pageTitle}>المكتبة</h2>
              <p style={{ ...pageText, marginBottom: 16 }}>
                الوثائق والنماذج المعتمدة الخاصة بالمشروع.
              </p>
              <a
                href="assets/workplan_template.xlsx"
                download="النموذج.xlsx"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,.07)',
                  border: '1px dashed rgba(159,196,242,.4)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    flex: 'none',
                    borderRadius: 10,
                    background: 'rgba(39,194,240,.18)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#27C2F0',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  ⬇
                </span>
                <span style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
                    نموذج خطة العمل (Excel)
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: '#9FC4F2', marginTop: 2 }}>
                    النموذج المعتمد لتعبئة المدخلات ورفعها في المنصة
                  </span>
                </span>
              </a>
              <p style={{ ...pageText, fontSize: 12, color: '#8AA6CC', marginTop: 14 }}>
                ستُضاف الأدلة والوثائق الإضافية هنا تباعاً.
              </p>
            </div>
          )}

          {/* --- contact us --- */}
          {tab === 'contact' && (
            <div style={pageCard}>
              <h2 style={pageTitle}>تواصل معنا</h2>
              <p style={{ ...pageText, marginBottom: 16 }}>
                لأي استفسار حول المنصة أو المشروع، يسعد فريق العمل تواصلكم عبر القنوات التالية:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 12.5, color: '#9FC4F2', fontWeight: 700, flex: 'none' }}>البريد الإلكتروني</span>
                  <span style={{ flex: 1, direction: 'ltr', textAlign: 'left', fontSize: 13.5, fontWeight: 800, color: '#fff' }}>admin@aigp.gov.ae</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 12.5, color: '#9FC4F2', fontWeight: 700, flex: 'none' }}>الجهة</span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: '#fff' }}>وزارة شؤون مجلس الوزراء</span>
                </div>
              </div>
            </div>
          )}
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
        © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
      </div>
    </div>
  );
}
