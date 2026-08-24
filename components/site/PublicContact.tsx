'use client';
// تواصل معنا — نموذج الاستفسار من تسليم التصميم؛ الإرسال يصب في صندوق
// استفسارات المسار المعني داخل المنصة (نفس آلية الاستفسارات الحالية).
import { useEffect, useState, type CSSProperties } from 'react';
import { useStore } from '@/lib/store';
import { CONTACT_STREAMS } from '@/lib/domain';
import { SiteLayout } from './SiteLayout';

type Field = 'name' | 'phone' | 'email' | 'streamId' | 'message';

type Values = Record<Field, string>;

const EMPTY: Values = { name: '', phone: '', email: '', streamId: '', message: '' };

/** أرقام الإمارات: ‎+971 5x xxxxxxx أو محلي 05x xxxxxxx — الفراغات والشرطات تُتجاهل */
const PHONE_RE = /^(?:\+?971|0)(?:\d{8,9})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ERRORS: Record<Field, string> = {
  name: 'يرجى إدخال الاسم',
  phone: 'يرجى إدخال رقم هاتف صحيح',
  email: 'يرجى إدخال بريد إلكتروني صحيح',
  streamId: 'يرجى اختيار المسار المعني',
  message: 'يرجى كتابة محتوى الرسالة',
};

function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) errors.name = ERRORS.name;
  if (!PHONE_RE.test(values.phone.replace(/[\s-]/g, ''))) errors.phone = ERRORS.phone;
  if (!EMAIL_RE.test(values.email.trim())) errors.email = ERRORS.email;
  if (!values.streamId) errors.streamId = ERRORS.streamId;
  if (!values.message.trim()) errors.message = ERRORS.message;
  return errors;
}

// backgroundColor (لا background المختصرة) حتى لا يُمحى سهم القائمة المنسدلة
// المرسوم عالمياً على select في globals.css
const controlStyle = (invalid: boolean): CSSProperties => ({
  width: '100%',
  backgroundColor: '#F7F9FD',
  border: `1.5px solid ${invalid ? '#B42318' : '#E1E7F1'}`,
  borderRadius: 12,
  padding: '12px 15px',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
  fontFamily: 'inherit',
});

const CheckIcon = () => (
  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12.5l2.6 2.6L16 9.5" />
  </svg>
);

export function PublicContact() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s._hydrated);
  const authed = useStore((s) => s.view !== 'login');
  const role = useStore((s) => s.role);
  const myPath = useStore((s) => s.myPath);
  const setup = useStore((s) => s.setup);
  const me = useStore((s) => s.me);
  const addInquiry = useStore((s) => s.addInquiry);
  const contactSub = useStore((s) => s.site.contactSub);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'success'>('idle');
  /** فخ للروبوتات: الشخص الحقيقي لا يملأ حقلاً لا يراه */
  const [trap, setTrap] = useState('');
  const [prefilled, setPrefilled] = useState<Partial<Record<Field, boolean>>>({});

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // بيانات المستخدم المسجّل تُعبَّأ مسبقاً وتُقفل. المصدر الأول هو هوية
  // الجلسة نفسها (الهوية الرقمية) — لا يُستعاض عنها ببيانات إعداد الفريق
  // إلا حين لا تتوفر هوية جلسة (النسخة التجريبية).
  useEffect(() => {
    if (!hydrated || !authed) return;
    const owner = setup.owners?.[myPath];
    const fallback = role === 'coord' && owner?.name ? owner : setup.rep;
    const who = me?.name?.trim() || me?.email?.trim() ? me : fallback;
    if (!who) return;
    const patch: Partial<Values> = {};
    const locked: Partial<Record<Field, boolean>> = {};
    if (who.name?.trim()) {
      patch.name = who.name.trim();
      locked.name = true;
    }
    if (who.phone?.trim()) {
      patch.phone = who.phone.trim();
      locked.phone = true;
    }
    if (who.email?.trim()) {
      patch.email = who.email.trim();
      locked.email = true;
    }
    if (Object.keys(patch).length) {
      setValues((prev) => ({ ...prev, ...patch }));
      setPrefilled(locked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authed, role, myPath, me]);

  const set = (field: Field) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (state === 'sending') return;

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (trap) {
      setState('success');
      return;
    }

    setState('sending');
    addInquiry({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      stream: values.streamId,
      message: values.message.trim(),
    });
    setState('success');
    setValues(EMPTY);
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setState('idle');
  };

  return (
    <SiteLayout background="#EEF2F9">
      <div className="mx-auto w-full max-w-[840px] px-8 pt-[140px] pb-[72px]">
        <header className="mb-[30px] text-center">
          <h1 className="m-0 mb-2 text-[30px] font-black">تواصل معنا</h1>
          <p className="m-0 text-[14.5px] font-semibold text-[#5E6E8C]">{contactSub}</p>
        </header>

        <div className="rounded-[22px] border border-[#E7ECF4] bg-white px-[42px] py-[38px] shadow-[0_18px_44px_-30px_rgba(15,31,61,.35)] max-[700px]:px-5 max-[700px]:py-[26px]">
          {state === 'success' ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckIcon />
              <h2 className="mt-4 mb-0 text-xl font-black">تم إرسال استفسارك بنجاح</h2>
              <p className="mt-2 mb-0 text-[13.5px] font-semibold text-[#5E6E8C]">سيتواصل معك الفريق المعني في أقرب وقت.</p>
              <button
                type="button"
                onClick={reset}
                className="mt-7 cursor-pointer rounded-xl border-[1.5px] border-[#C9D8F2] bg-white px-6 py-3 text-sm font-extrabold text-[#2563EB] transition-colors hover:bg-[#F0F5FF]"
              >
                إرسال استفسار آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-2 gap-x-5 gap-y-[18px] max-[700px]:grid-cols-1">
                <FieldInput id="name" label="الاسم" error={errors.name} placeholder="الاسم الكامل" value={values.name} onChange={set('name')} disabled={prefilled.name} />
                <FieldInput id="phone" label="رقم الهاتف" error={errors.phone} placeholder="+971 5x xxx xxxx" value={values.phone} onChange={set('phone')} type="tel" ltr disabled={prefilled.phone} />
                <FieldInput id="email" label="البريد الإلكتروني" error={errors.email} placeholder="name@entity.gov.ae" value={values.email} onChange={set('email')} type="email" ltr disabled={prefilled.email} />

                <div>
                  <label htmlFor="streamId" className="mb-[7px] block text-[12.5px] font-extrabold text-[#54627B]">
                    المسار المعني
                  </label>
                  <select
                    id="streamId"
                    value={values.streamId}
                    onChange={(e) => set('streamId')(e.target.value)}
                    aria-invalid={Boolean(errors.streamId)}
                    className="cursor-pointer focus:!border-[#2563EB] focus:!bg-white"
                    style={{ ...controlStyle(Boolean(errors.streamId)), padding: '12px 15px 12px 18px', fontWeight: 700, color: '#0F1F3D' }}
                  >
                    <option value="">اختر المسار…</option>
                    {CONTACT_STREAMS.map((stream) => (
                      <option key={stream.key} value={stream.key}>
                        {stream.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.streamId} />
                </div>

                <div className="col-span-full max-[700px]:col-span-1">
                  <label htmlFor="message" className="mb-[7px] block text-[12.5px] font-extrabold text-[#54627B]">
                    محتوى الرسالة
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    placeholder="اكتب استفسارك هنا…"
                    value={values.message}
                    onChange={(e) => set('message')(e.target.value)}
                    aria-invalid={Boolean(errors.message)}
                    className="focus:!border-[#2563EB] focus:!bg-white"
                    style={{ ...controlStyle(Boolean(errors.message)), padding: '13px 15px', resize: 'vertical' }}
                  />
                  <FieldError message={errors.message} />
                </div>
              </div>

              {/* فخ الروبوتات — مخفي عن الأشخاص */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="mt-[22px] flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="cursor-pointer rounded-xl border-none px-[52px] py-[13px] text-[15px] font-extrabold text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', opacity: state === 'sending' ? 0.7 : 1 }}
                >
                  {state === 'sending' ? 'جارِ الإرسال…' : 'إرسال'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

/* -------------------------------------------------------------------------- */

interface FieldProps {
  id: Field;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  /** قيمة لاتينية داخل نموذج RTL */
  ltr?: boolean;
  /** معبّأ من بيانات المستخدم المسجّل — للعرض فقط */
  disabled?: boolean;
}

function FieldInput({ id, label, placeholder, value, onChange, error, type = 'text', ltr = false, disabled = false }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-[7px] block text-[12.5px] font-extrabold text-[#54627B]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className="focus:!border-[#2563EB] focus:!bg-white"
        style={{
          ...controlStyle(Boolean(error)),
          ...(ltr ? { direction: 'ltr', textAlign: 'right' } : null),
          ...(disabled ? { backgroundColor: '#EEF2F8', color: '#54627B', cursor: 'not-allowed', fontWeight: 700 } : null),
        }}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mt-[6px] text-xs font-bold text-[#B42318]">{message}</div>;
}
