'use client';
// ============================================================================
// استكمال التسجيل بدعوة البريد
// ----------------------------------------------------------------------------
// خطوتان: تأكيد البريد المسجَّل بالدعوة، ثم تعيين كلمة المرور وتأكيدها.
// الرمز في الرابط هو السر؛ الواجهة لا تكشف وجود أي بريد من عدمه، والتحقق
// كله في الخادم (صلاحية الرمز، مطابقة البريد، سياسة كلمة المرور).
// ============================================================================
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CSSProperties } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const lbl: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#54627B', marginBottom: 6 };
const fld: CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1.5px solid #E1E7F0',
  background: '#fff',
  color: '#13213C',
  padding: '0 14px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
};
const btn = (disabled: boolean): CSSProperties => ({
  width: '100%',
  height: 48,
  borderRadius: 12,
  border: 'none',
  background: disabled ? '#C8D2E4' : 'linear-gradient(180deg,#2E74EE,#1F5FE0)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: disabled ? 'default' : 'pointer',
});

/** مؤشر قوة بسيط يعكس سياسة الخادم نفسها */
function strengthOf(v: string): { score: number; label: string; color: string } {
  let n = 0;
  if (v.length >= 10) n++;
  if (v.length >= 14) n++;
  if (/[A-Za-z]/.test(v) && /\d/.test(v)) n++;
  if (/[^A-Za-z0-9]/.test(v)) n++;
  const map = [
    { label: 'ضعيفة', color: '#C0303B' },
    { label: 'مقبولة', color: '#B45309' },
    { label: 'جيدة', color: '#1F5FE0' },
    { label: 'قوية', color: '#0B8A4B' },
    { label: 'قوية جداً', color: '#0B8A4B' },
  ];
  return { score: n, ...map[Math.min(n, 4)] };
}

export function RegisterScreen() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email');
  const [mode, setMode] = useState<'register' | 'reset'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const strength = useMemo(() => strengthOf(pw), [pw]);
  const call = async (payload: Record<string, unknown>) => {
    const res = await fetch(BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, ...payload }),
    });
    return { ok: res.ok, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  const verify = async () => {
    setBusy(true);
    setErr('');
    const { ok, body } = await call({ step: 'verify', email: email.trim() });
    setBusy(false);
    if (!ok) {
      setErr(String(body.message || 'تعذّر التحقق'));
      return;
    }
    setName(String(body.name || ''));
    setMode(body.mode === 'reset' ? 'reset' : 'register');
    setStep('password');
  };

  const complete = async () => {
    setBusy(true);
    setErr('');
    const { ok, body } = await call({ step: 'complete', email: email.trim(), password: pw, confirm });
    setBusy(false);
    if (!ok) {
      setErr(String(body.message || 'تعذّر حفظ كلمة المرور'));
      return;
    }
    setStep('done');
    window.location.href = BASE + '/dashboard';
  };

  return (
    <div
      dir="rtl"
      style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0B2A66,#123C8C 55%,#0B2A66)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'inherit' }}
    >
      <div style={{ width: 'min(460px,100%)', background: '#fff', borderRadius: 20, padding: '30px 28px', boxShadow: '0 30px 70px -24px rgba(2,12,35,.6)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BASE + '/assets/web/logo-full-z.png'} alt="مشروع الذكاء الاصطناعي المساعد" style={{ height: 46, display: 'block', margin: '0 auto 22px' }} />

        {!token ? (
          <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#C0303B', lineHeight: 2 }}>
            رابط غير مكتمل — افتح الرابط المرسل إلى بريدك الرسمي كما هو.
          </div>
        ) : step === 'email' ? (
          <form onSubmit={(e) => { e.preventDefault(); verify(); }} style={{ display: 'grid', gap: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C', textAlign: 'center' }}>تفعيل الحساب</div>
            <div style={{ fontSize: 12.5, color: '#6B7A93', textAlign: 'center', lineHeight: 1.9, marginTop: -6 }}>
              أدخل بريدك الرسمي كما سُجّل في المنصة للمتابعة
            </div>
            <div>
              <label style={lbl}>البريد الإلكتروني</label>
              <input autoFocus type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@entity.gov.ae" style={fld} />
            </div>
            {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#C0303B', lineHeight: 1.8 }}>{err}</div>}
            <button type="submit" disabled={busy || !email.trim()} style={btn(busy || !email.trim())}>
              {busy ? 'جارٍ التحقق…' : 'متابعة'}
            </button>
          </form>
        ) : step === 'password' ? (
          <form onSubmit={(e) => { e.preventDefault(); complete(); }} style={{ display: 'grid', gap: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#13213C', textAlign: 'center' }}>
              {mode === 'reset' ? 'تعيين كلمة مرور جديدة' : 'تعيين كلمة المرور'}
            </div>
            {name && (
              <div style={{ fontSize: 12.5, color: '#6B7A93', textAlign: 'center', lineHeight: 1.9, marginTop: -6 }}>
                مرحباً {name} — اختر كلمة مرور لحسابك
              </div>
            )}
            <div>
              <label style={lbl}>كلمة المرور</label>
              <input autoFocus type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" style={fld} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 999, background: '#EEF1F7', overflow: 'hidden' }}>
                  <div style={{ width: Math.min(100, strength.score * 25) + '%', height: '100%', background: strength.color, transition: 'width .2s' }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: strength.color }}>{pw ? strength.label : ''}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#8A97AD', marginTop: 6, lineHeight: 1.8 }}>
                10 محارف على الأقل، وتشمل حرفاً ورقماً، وبلا تسلسل أو تكرار.
              </div>
            </div>
            <div>
              <label style={lbl}>تأكيد كلمة المرور</label>
              <input type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={fld} />
              {confirm && confirm !== pw && (
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#C0303B', marginTop: 6 }}>كلمتا المرور غير متطابقتين</div>
              )}
            </div>
            {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#C0303B', lineHeight: 1.8 }}>{err}</div>}
            <button type="submit" disabled={busy || !pw || pw !== confirm} style={btn(busy || !pw || pw !== confirm)}>
              {busy ? 'جارٍ الحفظ…' : 'حفظ والدخول'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#0B8A4B' }}>تم — جارٍ فتح المنصة…</div>
        )}

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid #EEF1F7', textAlign: 'center', fontSize: 12, color: '#6B7A93', lineHeight: 1.9 }}>
          للتواصل والاستفسارات:
          <br />
          <a href="mailto:agentic.ai@moca.gov.ae" dir="ltr" style={{ color: '#1F5FE0', textDecoration: 'none', fontWeight: 700 }}>
            agentic.ai@moca.gov.ae
          </a>
        </div>
      </div>
    </div>
  );
}
