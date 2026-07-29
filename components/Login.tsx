'use client';
import { useState } from 'react';
import type { VM } from '@/lib/viewModel';
import { useStore } from '@/lib/store';
import { PATHS, DEFAULT_CONTACT_EMAILS } from '@/lib/domain';

// Landing/login navigation tabs — الصفحة الرئيسية is the login itself.
type NavTab = 'home' | 'about' | 'library' | 'contact';
const NAV_ITEMS: { key: NavTab; label: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية' },
  { key: 'about', label: 'عن المشروع' },
  { key: 'library', label: 'المكتبة' },
  { key: 'contact', label: 'تواصل معنا' },
];

// المسار المعني options for the inquiry form — the three streams + the secretariat.
const CONTACT_STREAMS: { key: string; label: string }[] = [
  ...PATHS.map((p) => ({ key: p.id, label: 'مسار ' + p.name })),
  { key: 'general', label: 'الأمانة العامة للجنة الوطنية (استفسارات عامة)' },
];

export function Login({ vm }: { vm: VM }) {
  const loginUaePass = useStore((s) => s.loginUaePass);
  const contactEmails = useStore((s) => s.contactEmails);
  const [hover, setHover] = useState(false);
  const [tab, setTab] = useState<NavTab>('home');
  const [navHov, setNavHov] = useState<NavTab | null>(null);
  // contact inquiry form state
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cStream, setCStream] = useState('');
  const [cMsg, setCMsg] = useState('');
  const [cErr, setCErr] = useState('');
  const [cSent, setCSent] = useState(false);
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

  const sendInquiry = () => {
    if (!cName.trim() || !cEmail.trim() || !cStream || !cMsg.trim()) {
      setCErr('نرجو تعبئة الاسم والبريد الإلكتروني والمسار المعني ومحتوى الرسالة');
      return;
    }
    setCErr('');
    const to = contactEmails?.[cStream] || DEFAULT_CONTACT_EMAILS[cStream];
    const streamLabel = CONTACT_STREAMS.find((s) => s.key === cStream)?.label || '';
    const subject = `استفسار عبر منصة الذكاء الاصطناعي المساعد — ${streamLabel}`;
    const body = [
      `الاسم: ${cName.trim()}`,
      cPhone.trim() ? `رقم الهاتف: ${cPhone.trim()}` : '',
      `البريد الإلكتروني: ${cEmail.trim()}`,
      `المسار المعني: ${streamLabel}`,
      '',
      cMsg.trim(),
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setCSent(true);
  };

  // Only the home page keeps the full blue identity — every other tab is light.
  const light = tab !== 'home';

  const pageCard: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E3E9F2',
    borderRadius: 22,
    padding: '28px 26px',
    boxShadow: '0 24px 54px -30px rgba(23,43,77,.28)',
    textAlign: 'right',
    color: '#3B4A63',
  };
  const pageTitle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: '#132A4E', margin: '0 0 14px' };
  const pageText: React.CSSProperties = { fontSize: 13.5, lineHeight: 2, color: '#54627B', fontWeight: 500, margin: 0 };

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 800,
    color: '#3B4A63',
    marginBottom: 6,
  };
  const fieldInput: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#FAFBFE',
    border: '1px solid #DDE4EE',
    borderRadius: 12,
    padding: '11px 13px',
    fontSize: 13.5,
    fontWeight: 600,
    color: '#132A4E',
    fontFamily: 'inherit',
    outline: 'none',
  };

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
        background: light
          ? '#F4F7FB'
          : 'radial-gradient(125% 125% at 50% 0%,#0B2A66 0%,#071A40 55%,#04102A 100%)',
      }}
    >
      {!light && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.55,
            backgroundImage:
              'radial-gradient(circle at 80% 15%,rgba(39,194,240,.20),transparent 45%),radial-gradient(circle at 15% 85%,rgba(37,99,235,.22),transparent 45%)',
          }}
        />
      )}

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
          background: light ? '#fff' : 'rgba(4,14,36,.35)',
          borderBottom: light ? '1px solid #E3E9F2' : '1px solid rgba(159,196,242,.16)',
          boxShadow: light ? '0 10px 24px -20px rgba(23,43,77,.35)' : 'none',
          backdropFilter: light ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: light ? 'none' : 'blur(10px)',
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
                background: light
                  ? active
                    ? '#EDF3FD'
                    : hov
                      ? '#F4F7FB'
                      : 'transparent'
                  : active
                    ? 'rgba(255,255,255,.10)'
                    : hov
                      ? 'rgba(255,255,255,.06)'
                      : 'transparent',
                border: 'none',
                borderRadius: 10,
                padding: '10px 22px',
                fontSize: 14.5,
                fontWeight: 800,
                color: light ? (active ? '#1F5FE0' : '#54627B') : active ? '#fff' : '#9FC4F2',
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
          alignItems: light ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: light ? '48px 20px 60px' : '32px 20px 60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: tab === 'home' ? 480 : 640, textAlign: 'center', animation: 'fadeUp .5s ease both' }}>
          {/* the project logo appears on the blue home page only */}
          {!light && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="assets/logo-dark.png"
                  alt="مشروع الذكاء الاصطناعي المساعد"
                  style={{ height: 110 }}
                />
              </div>
              <div style={{ height: 40 }} />
            </>
          )}

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
            <div style={{ ...pageCard, maxWidth: 640, margin: '0 auto' }}>
              <h2 style={pageTitle}>المكتبة</h2>
              <p style={{ ...pageText, marginBottom: 18 }}>
                الوثائق الرسمية الخاصة بمشروع الذكاء الاصطناعي المساعد.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                {[
                  {
                    title: 'نظام عمل مشروع الذكاء الاصطناعي المساعد',
                    cover: 'assets/docs/cover-work-system.png',
                    file: 'assets/docs/ai-work-system.pdf',
                    dl: 'نظام-عمل-الذكاء-الاصطناعي-المساعد.pdf',
                  },
                  {
                    title: 'الدليل التعريفي للذكاء الاصطناعي المساعد',
                    cover: 'assets/docs/cover-definition-guide.png',
                    file: 'assets/docs/ai-definition-guide.pdf',
                    dl: 'الدليل-التعريفي-للذكاء-الاصطناعي-المساعد.pdf',
                  },
                ].map((doc) => (
                  <div key={doc.file} style={{ background: '#FAFBFE', border: '1px solid #E3E9F2', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc.cover} alt={doc.title} style={{ width: '100%', borderRadius: 10, boxShadow: '0 14px 30px -18px rgba(23,43,77,.45)' }} />
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#132A4E', textAlign: 'center', lineHeight: 1.7, minHeight: 44 }}>{doc.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, textAlign: 'center', background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)', color: '#fff', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                      >
                        إطلاع
                      </a>
                      <a
                        href={doc.file}
                        download={doc.dl}
                        style={{ flex: 1, textAlign: 'center', background: '#fff', border: '1px solid #C9D6EA', color: '#1F5FE0', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                      >
                        تحميل
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- contact us: inquiry form --- */}
          {tab === 'contact' && (
            <div style={pageCard}>
              <h2 style={pageTitle}>تواصل معنا</h2>
              <p style={{ ...pageText, marginBottom: 18 }}>
                نرجو تعبئة النموذج التالي وسيتم توجيه استفساركم إلى الفريق المعني بالمسار المحدد.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={fieldLabel}>الاسم *</label>
                  <input
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="الاسم الكامل"
                    style={fieldInput}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>رقم الهاتف</label>
                  <input
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
                    placeholder="+971 5X XXX XXXX"
                    style={{ ...fieldInput, direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>البريد الإلكتروني *</label>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="name@entity.gov.ae"
                    style={{ ...fieldInput, direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>المسار المعني *</label>
                  <select value={cStream} onChange={(e) => setCStream(e.target.value)} style={fieldInput}>
                    <option value="">— اختر المسار —</option>
                    {CONTACT_STREAMS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>محتوى الرسالة *</label>
                <textarea
                  value={cMsg}
                  onChange={(e) => setCMsg(e.target.value)}
                  rows={5}
                  placeholder="اكتب استفسارك هنا…"
                  style={{ ...fieldInput, resize: 'vertical', lineHeight: 1.9 }}
                />
              </div>
              {cErr && (
                <div style={{ background: '#FDF1F1', border: '1px solid #F2C9C9', color: '#B3261E', borderRadius: 10, padding: '10px 13px', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
                  {cErr}
                </div>
              )}
              {cSent && !cErr && (
                <div style={{ background: '#EDF9F2', border: '1px solid #BFE5CE', color: '#0B8A4B', borderRadius: 10, padding: '10px 13px', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
                  تم تجهيز رسالتكم في تطبيق البريد الإلكتروني لإرسالها إلى الفريق المعني.
                </div>
              )}
              <button
                onClick={sendInquiry}
                style={{
                  width: '100%',
                  background: 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 0',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 14px 28px -14px rgba(31,95,224,.55)',
                }}
              >
                إرسال
              </button>
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
          color: light ? '#8A97AC' : '#5E7BA8',
          fontWeight: 500,
          zIndex: 1,
        }}
      >
        © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
      </div>
    </div>
  );
}
