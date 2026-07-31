'use client';
import { useState } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import { AboutPage, ContactPage, LibraryPage, PublicFooter, PublicNav, type PublicTab } from './PublicSite';

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
