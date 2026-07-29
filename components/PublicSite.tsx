'use client';
import { useEffect, useMemo, useState } from 'react';
import { CONTACT_STREAMS, type LibraryDoc } from '@/lib/domain';
import { useStore } from '@/lib/store';

// ===========================================================================
// Public site (design_handoff_public_site) — عن المشروع / المكتبة / تواصل معنا
// White shared top nav + footer; page backgrounds and tokens per the handoff.
// The home page (UAE PASS login) keeps the existing platform design.
// ===========================================================================

export type PublicTab = 'home' | 'about' | 'library' | 'contact';

const NAV_LINKS: { key: PublicTab; label: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية' },
  { key: 'about', label: 'عن المشروع' },
  { key: 'library', label: 'المكتبة' },
  { key: 'contact', label: 'تواصل معنا' },
];

// stroke icons (Material-symbol equivalents, self-contained SVG)
function PIcon({ d, size = 20, color = '#2563EB', sw = 1.9 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
      {d.split('|').map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
const IC = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.35-4.35',
  download: 'M12 15V3|M7 10l5 5 5-5|M5 21h14',
  block: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M5.6 5.6l12.8 12.8',
  bank: 'M3 21h18|M4 10h16|M12 3l9 5H3l9-5z|M6 10v8|M10 10v8|M14 10v8|M18 10v8',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  headset: 'M3 13a9 9 0 0 1 18 0|M3 13v3a2 2 0 0 0 2 2h2v-7H5a2 2 0 0 0-2 2z|M21 13v3a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2z|M16 21h-4',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z|M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  check: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M8 12.5l2.6 2.6L16 9.6',
};

// ---------------------------------------------------------------------------
// Page data (official copy where provided; the rest is provisional and
// data-driven so the confirmed text can be dropped in without layout work)
// ---------------------------------------------------------------------------
const HERO_TEXT =
  'بتوجيهات من صاحب السمو الشيخ محمد بن زايد آل نهيان، رئيس الدولة "حفظه الله"، أعلن صاحب السمو الشيخ محمد بن راشد آل مكتوم، نائب رئيس الدولة رئيس مجلس الوزراء حاكم دبي "رعاه الله"، في أبريل 2026 عن إطلاق مشروع وطني استراتيجي، بإشراف سمو الشيخ منصور بن زايد آل نهيان، نائب رئيس الدولة نائب رئيس مجلس الوزراء رئيس ديوان الرئاسة، يهدف إلى تحويل 50% من العمليات والمهام والإجراءات والخدمات الحكومية إلى نماذج وأنظمة مدعومة بالذكاء الاصطناعي المساعد خلال عامين، بما يسهم في خفض التكاليف التشغيلية، ورفع الكفاءة الحكومية، وتعزيز جودة المخرجات والخدمات، وتسريع الإنجاز، ودعم اتخاذ القرار، وذلك لبناء أفضل حكومة في العالم ولتعزيز جاهزية الدولة لمتغيرات المستقبل.';

type Doc = { id: string; title: string; cat: 'guide' | 'system'; catLabel: string; date: string; cover: string; file: string; dl: string };
const DOC_ASSETS: Record<string, { cover: string; file: string; dl: string }> = {
  guide: {
    cover: 'assets/docs/cover-definition-guide.png',
    file: 'assets/docs/ai-definition-guide.pdf',
    dl: 'الدليل-التعريفي-للذكاء-الاصطناعي-المساعد.pdf',
  },
  system: {
    cover: 'assets/docs/cover-work-system.png',
    file: 'assets/docs/ai-work-system.pdf',
    dl: 'نظام-عمل-الذكاء-الاصطناعي-المساعد.pdf',
  },
};
// data: URLs cannot be navigated to directly — convert to a blob URL on click
function openDocFile(file: string) {
  if (!file.startsWith('data:')) return false;
  try {
    const [meta, b64] = file.split(',');
    const mime = meta.slice(5, meta.indexOf(';'));
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime || 'application/pdf' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch {
    return false;
  }
}

const toDoc = (d: LibraryDoc): Doc => {
  const asset = DOC_ASSETS[d.id];
  return {
    id: d.id,
    title: d.title,
    cat: d.cat,
    catLabel: d.cat === 'system' ? 'نظام عمل' : 'دليل',
    date: d.date,
    cover: d.coverUrl || asset?.cover || '',
    file: d.fileUrl || asset?.file || '#',
    dl: asset?.dl || d.title + '.pdf',
  };
};

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------
export function PublicNav({ tab, onNav, onLogin }: { tab: PublicTab; onNav: (t: PublicTab) => void; onLogin: () => void }) {
  const [hov, setHov] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // ≤768px: logo + hamburger with a drawer (per the handoff responsive rules)
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const upd = () => setMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  const linkBtn = (n: { key: PublicTab; label: string }, block: boolean) => {
    const active = tab === n.key;
    // per handoff: pill outline on About/Contact, bottom border on Library
    const libStyle = active && n.key === 'library' && !block;
    return (
      <button
        key={n.key}
        onClick={() => {
          setMenuOpen(false);
          onNav(n.key);
        }}
        onMouseEnter={() => setHov(n.key)}
        onMouseLeave={() => setHov(null)}
        style={{
          fontSize: 14,
          fontWeight: active ? 800 : 700,
          lineHeight: 1.9,
          color: active ? '#2563EB' : hov === n.key ? '#0F1F3D' : '#54627B',
          padding: block ? '12px 18px' : '9px 18px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: block ? 'right' : 'center',
          width: block ? '100%' : undefined,
          background: libStyle ? 'transparent' : active ? '#F0F5FF' : hov === n.key ? '#F4F7FC' : 'transparent',
          border: 'none',
          borderRadius: libStyle ? 0 : 12,
          borderBottom: libStyle ? '3px solid #2563EB' : 'none',
          ...(active && !libStyle ? { border: '1.5px solid #2563EB' } : {}),
        }}
      >
        {n.label}
      </button>
    );
  };

  return (
    <div style={{ position: 'relative', background: '#fff', borderBottom: '1px solid #E7ECF4', padding: mobile ? '12px 18px' : '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="assets/logo.png" alt="مشروع الذكاء الاصطناعي المساعد" style={{ height: mobile ? 48 : 62 }} />
      </div>
      {!mobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {NAV_LINKS.map((n) => linkBtn(n, false))}
        </div>
      )}
      {!mobile && (
        <button
          onClick={onLogin}
          onMouseEnter={() => setHov('login')}
          onMouseLeave={() => setHov(null)}
          style={{ background: hov === 'login' ? '#1B3260' : '#0F1F3D', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13.5, fontWeight: 800, lineHeight: 1.9, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          تسجيل الدخول
        </button>
      )}
      {mobile && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="القائمة"
          style={{ width: 44, height: 44, borderRadius: 12, background: '#F4F7FC', border: '1px solid #E7ECF4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <PIcon d={menuOpen ? 'M18 6L6 18|M6 6l12 12' : 'M3 6h18|M3 12h18|M3 18h18'} size={20} color="#0F1F3D" sw={2.2} />
        </button>
      )}
      {mobile && menuOpen && (
        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#fff', borderBottom: '1px solid #E7ECF4', boxShadow: '0 24px 44px -24px rgba(15,31,61,.4)', display: 'flex', flexDirection: 'column', padding: '8px 12px 14px', gap: 2 }}>
          {NAV_LINKS.map((n) => linkBtn(n, true))}
          <button
            onClick={() => {
              setMenuOpen(false);
              onLogin();
            }}
            style={{ marginTop: 8, background: '#0F1F3D', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, lineHeight: 1.9, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            تسجيل الدخول
          </button>
        </div>
      )}
    </div>
  );
}

export function PublicFooter() {
  return (
    <div style={{ textAlign: 'center', padding: '26px 0', fontSize: 11.5, color: '#8A97AD', fontWeight: 600 }}>
      © 2026 مشروع الذكاء الاصطناعي المساعد، جميع الحقوق محفوظة
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 24, fontWeight: 900, textAlign: 'center', margin: '0 0 30px', color: '#0F1F3D' };

// ---------------------------------------------------------------------------
// عن المشروع
// ---------------------------------------------------------------------------
const SCOPE_ICONS = [IC.bank, IC.cog, IC.headset, IC.target];
export function AboutPage() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const upd = () => setMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);
  const heroFromAdmin = useStore((s) => s.aboutHero);
  const about = useStore((s) => s.about);
  const hero = (heroFromAdmin || '').trim() || HERO_TEXT;
  const TL = about.timeline;
  const TR = about.tracks;
  const SC = about.scope;
  const PR = about.principles;
  const TG = about.targets;
  return (
    <div style={{ background: '#F7F9FD' }}>
      {/* hero */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '64px 32px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 18px', color: '#0F1F3D' }}>عن المشروع</h1>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#3B4A66', lineHeight: 2.15, maxWidth: 920, margin: '0 auto', textAlign: 'justify', textAlignLast: 'center' }}>{hero}</p>
      </div>

      {/* timeline */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px 20px' }}>
        <h2 style={{ ...sectionTitle, marginBottom: 6 }}>مسيرة التحول الحكومي</h2>
        <p style={{ fontSize: 13.5, color: '#7484A0', fontWeight: 600, textAlign: 'center', margin: '0 0 34px' }}>ربع قرن من الريادة في التحول الرقمي الحكومي</p>
        {mobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {TL.map((t) => (
              <div key={t.year} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 4 }}>
                  <div style={{ width: t.major ? 15 : 11, height: t.major ? 15 : 11, borderRadius: '50%', background: t.major ? '#2563EB' : '#9AA6BC', border: t.major ? '3px solid #DBEAFE' : 'none' }} />
                  <div style={{ width: 2, flex: 1, minHeight: 26, background: '#C4D2E8', marginTop: 4 }} />
                </div>
                <div>
                  <div style={{ fontSize: t.major ? 20 : 16, fontWeight: 900, color: '#2563EB', lineHeight: 1.2 }}>{t.year}</div>
                  <div style={{ fontSize: t.major ? 14 : 12.5, fontWeight: 800, color: '#1F2D49', marginTop: 3 }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#7484A0', marginTop: 2, lineHeight: 1.7 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'row-reverse', overflowX: 'auto' }}>
          {TL.map((t) =>
            t.major ? (
              <div key={t.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#2563EB' }}>{t.year}</div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 15 }}>
                  <div style={{ flex: 1, borderTop: '2px dashed #C4D2E8' }} />
                  <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#2563EB', border: '3px solid #DBEAFE', flex: '0 0 auto' }} />
                  <div style={{ flex: 1, borderTop: '2px dashed #C4D2E8' }} />
                </div>
                <div
                  style={{ width: 128, height: 128, borderRadius: '50%', background: 'repeating-linear-gradient(45deg,#E3EAF5 0 8px,#EFF3FA 8px 16px)', border: '1px solid #DCE4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, color: '#8A97AD' }}
                >
                  صورة
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1F2D49', textAlign: 'center', lineHeight: 1.7, padding: '0 8px' }}>{t.title}</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#7484A0', textAlign: 'center', lineHeight: 1.7, padding: '0 10px' }}>{t.sub}</div>
              </div>
            ) : (
              <div key={t.year} style={{ flex: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 900, visibility: 'hidden' }}>0000</div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 15 }}>
                  <div style={{ flex: 1, borderTop: '2px dashed #C4D2E8' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#9AA6BC', flex: '0 0 auto' }} />
                  <div style={{ flex: 1, borderTop: '2px dashed #C4D2E8' }} />
                </div>
                <div style={{ height: 38, borderLeft: '2px dotted #B7C4D8', margin: '-6px 0 -2px' }} />
                <div style={{ fontSize: 17, fontWeight: 900, color: '#2563EB', lineHeight: 1, marginTop: -4 }}>{t.year}</div>
                <div style={{ marginTop: -6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#33405A', textAlign: 'center', lineHeight: 1.75, padding: '0 8px' }}>{t.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#7484A0', textAlign: 'center', lineHeight: 1.75, padding: '0 8px' }}>{t.sub}</div>
                </div>
              </div>
            )
          )}
        </div>
        )}
      </div>

      {/* targets */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '44px 32px 8px' }}>
        <h2 style={sectionTitle}>المستهدفات الرئيسية</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
          <div style={{ background: 'linear-gradient(150deg,#0B2A66,#123B85)', borderRadius: 20, padding: '36px 34px', color: '#fff', textAlign: 'center', boxShadow: '0 22px 46px -26px rgba(11,42,102,.7)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#8FB4EC', marginBottom: 6 }}>{TG.label1}</div>
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{TG.value1}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#C6D8F5', lineHeight: 2, marginTop: 14 }}>{TG.text1}</div>
          </div>
          <div style={{ background: 'linear-gradient(150deg,#1D4ED8,#2E6FD1)', borderRadius: 20, padding: '36px 34px', color: '#fff', textAlign: 'center', boxShadow: '0 22px 46px -26px rgba(29,78,216,.7)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#BFD6F8', marginBottom: 6 }}>{TG.label2}</div>
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{TG.value2}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#DBE8FC', lineHeight: 2, marginTop: 14 }}>{TG.text2}</div>
          </div>
        </div>
        <div style={{ marginTop: 18, background: '#EAF1FE', border: '1px solid #C9DBF8', borderRadius: 14, padding: '16px 22px', fontSize: 13, fontWeight: 600, color: '#1F3D77', lineHeight: 2, textAlign: 'center' }}>
          {TG.note}
        </div>
      </div>

      {/* tracks */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '44px 32px 8px' }}>
        <h2 style={sectionTitle}>المسارات</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TR.map((tr, ti) => (
            <HoverLift key={tr.title + ti}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: '20px 26px' }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#DCE6F7', lineHeight: 1, flex: '0 0 64px', textAlign: 'center' }}>{String(ti + 1).padStart(2, '0')}</div>
                <div style={{ width: 1, alignSelf: 'stretch', background: '#EDF1F8' }} />
                <div>
                  <div style={{ fontSize: 16.5, fontWeight: 800, color: '#122748', marginBottom: 4 }}>{tr.title}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#5E6E8C', lineHeight: 1.9 }}>{tr.desc}</div>
                </div>
              </div>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* scope */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '44px 32px 8px' }}>
        <h2 style={sectionTitle}>نطاق التحويل</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {SC.map((s, si) => (
            <div key={s.title + si} style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EAF1FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PIcon d={SCOPE_ICONS[si % SCOPE_ICONS.length]} size={24} />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.6, color: '#0F1F3D' }}>{s.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#5E6E8C', lineHeight: 1.95 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 18, background: '#0F1F3D', borderRadius: 16, padding: '20px 26px', color: '#fff' }}>
          <PIcon d={IC.block} size={30} color="#7E9AC8" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>خارج نطاق التحويل</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B9CDEC', lineHeight: 1.9 }}>{about.outOfScope}</div>
          </div>
        </div>
      </div>

      {/* principles */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '44px 32px 64px' }}>
        <h2 style={sectionTitle}>
          المبادئ العامة <span style={{ fontSize: 13, fontWeight: 700, color: '#7484A0' }}>· {PR.length} مبدأ</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: '10px 28px' }}>
          {PR.map((p, i) => (
            <div key={p.title + i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 4px', borderBottom: '1px solid #EDF1F8' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EAF1FE', color: '#2563EB', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1F3D' }}>{p.title}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#5E6E8C', lineHeight: 1.85, marginTop: 2 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HoverLift({ children }: { children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ transition: 'box-shadow .2s,transform .2s', boxShadow: h ? '0 18px 40px -24px rgba(15,31,61,.4)' : 'none', transform: h ? 'translateY(-2px)' : 'none', borderRadius: 16 }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// المكتبة
// ---------------------------------------------------------------------------
const normAr = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/[ً-ْ]/g, '');

export function LibraryPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | 'guide' | 'system'>('all');
  const storeDocs = useStore((s) => s.libraryDocs);
  const docs = useMemo(() => {
    const nq = normAr(q.trim());
    return storeDocs.map(toDoc).filter((d) => (cat === 'all' || d.cat === cat) && (!nq || normAr(d.title).includes(nq)));
  }, [q, cat, storeDocs]);
  const chips: { k: 'all' | 'guide' | 'system'; label: string }[] = [
    { k: 'all', label: 'الكل' },
    { k: 'guide', label: 'الأدلة' },
    { k: 'system', label: 'أنظمة العمل' },
  ];
  return (
    <div style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 40px 72px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 6px', color: '#0F1F3D' }}>المكتبة</h1>
            <p style={{ color: '#5E6E8C', fontSize: 14.5, fontWeight: 600, margin: 0 }}>الوثائق الرسمية الخاصة بمشروع الذكاء الاصطناعي المساعد.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4F7FC', border: '1px solid #E7ECF4', borderRadius: 999, padding: '8px 16px', width: 260 }}>
              <PIcon d={IC.search} size={18} color="#8A97AD" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث في الوثائق..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#0F1F3D', minWidth: 0, fontFamily: 'inherit' }}
              />
            </div>
            {chips.map((c) => (
              <button
                key={c.k}
                onClick={() => setCat(c.k)}
                style={{
                  background: cat === c.k ? '#0F1F3D' : '#F4F7FC',
                  color: cat === c.k ? '#fff' : '#54627B',
                  border: cat === c.k ? 'none' : '1px solid #E7ECF4',
                  borderRadius: 999,
                  padding: '8px 20px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <PIcon d={IC.search} size={44} color="#8A97AD" />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1F3D', marginTop: 12 }}>لا توجد وثائق مطابقة</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8A97AD', marginTop: 4 }}>جرّب كلمة أخرى أو امسح البحث</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 34 }}>
            {docs.map((d) => (
              <div key={d.id}>
                <DocCover d={d} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1F3D' }}>{d.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8A97AD', marginTop: 2 }}>{d.catLabel} · PDF · {d.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {d.file !== '#' && (
                    <a
                      href={d.file}
                      download={d.dl}
                      title="تحميل"
                      style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1.5px solid #C9D8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                    >
                      <PIcon d={IC.download} size={20} />
                    </a>
                    )}
                    {d.file !== '#' && (
                    <a
                      href={d.file}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (openDocFile(d.file)) e.preventDefault();
                      }}
                      style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', borderRadius: 12, padding: '0 24px', height: 42, display: 'inline-flex', alignItems: 'center', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}
                    >
                      إطلاع
                    </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocCover({ d }: { d: Doc }) {
  const [h, setH] = useState(false);
  return (
    <a
      href={d.file}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: '#F4F7FC',
        border: '1px solid #E7ECF4',
        borderRadius: 20,
        padding: 34,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow .25s',
        boxShadow: h ? '0 26px 56px -26px rgba(15,31,61,.5)' : 'none',
      }}
    >
      {d.cover ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={d.cover} alt={d.title} style={{ width: 280, maxWidth: '100%', borderRadius: 8, boxShadow: '0 18px 38px -18px rgba(15,31,61,.5)' }} />
      ) : (
        <div style={{ width: 280, maxWidth: '100%', aspectRatio: '280/390', background: 'linear-gradient(160deg,#16375F,#0B2244)', borderRadius: 8, boxShadow: '0 18px 38px -18px rgba(15,31,61,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="assets/logo-dark.png" alt="" style={{ height: 40 }} />
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, textAlign: 'center', lineHeight: 1.8 }}>{d.title}</div>
          {d.date && <div style={{ color: '#B9CDEC', fontSize: 12, fontWeight: 700 }}>{d.date}</div>}
        </div>
      )}
    </a>
  );
}

// ---------------------------------------------------------------------------
// تواصل معنا
// ---------------------------------------------------------------------------
type CForm = { name: string; phone: string; email: string; stream: string; message: string };
const EMPTY_FORM: CForm = { name: '', phone: '', email: '', stream: '', message: '' };

export function ContactPage() {
  const addInquiry = useStore((s) => s.addInquiry);
  const [f, setF] = useState<CForm>(EMPTY_FORM);
  const [errs, setErrs] = useState<Partial<Record<keyof CForm, string>>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const set = (k: keyof CForm, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: undefined }));
  };
  const validate = (): boolean => {
    const e: Partial<Record<keyof CForm, string>> = {};
    if (!f.name.trim()) e.name = 'يرجى إدخال الاسم';
    if (!/^(\+971|00971|05)\d[\d\s-]{6,}$/.test(f.phone.trim().replace(/\s/g, ''))) e.phone = 'يرجى إدخال رقم هاتف صحيح';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'يرجى إدخال بريد إلكتروني صحيح';
    if (!f.stream) e.stream = 'يرجى اختيار المسار المعني';
    if (!f.message.trim()) e.message = 'يرجى كتابة محتوى الرسالة';
    setErrs(e);
    return Object.keys(e).length === 0;
  };
  const [website, setWebsite] = useState(''); // honeypot — humans never see it
  const submit = () => {
    if (state === 'sending') return;
    if (!validate()) return;
    if (website.trim()) {
      setState('error');
      return;
    }
    setState('sending');
    // The inquiry lands as a ticket in the admin backoffice (التواصل
    // والاستفسارات), which forwards it to the stream's configured inbox. In
    // production a server endpoint additionally emails it directly; the
    // stream → email mapping never reaches this page.
    addInquiry({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), stream: f.stream, message: f.message.trim() });
    window.setTimeout(() => setState('success'), 900);
  };
  const reset = () => {
    setF(EMPTY_FORM);
    setErrs({});
    setState('idle');
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, color: '#54627B', display: 'block', marginBottom: 7 };
  const input = (k: keyof CForm): React.CSSProperties => ({
    width: '100%',
    boxSizing: 'border-box',
    background: '#F7F9FD',
    border: `1.5px solid ${errs[k] ? '#B42318' : '#E1E7F1'}`,
    borderRadius: 12,
    padding: '12px 15px',
    fontSize: 14,
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0F1F3D',
  });
  const err = (k: keyof CForm) => errs[k] && <div style={{ fontSize: 12, fontWeight: 700, color: '#B42318', marginTop: 5 }}>{errs[k]}</div>;

  return (
    <div style={{ background: '#EEF2F9' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '56px 32px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 8px', color: '#0F1F3D' }}>تواصل معنا</h1>
          <p style={{ color: '#5E6E8C', fontSize: 14.5, fontWeight: 600, margin: 0 }}>ما الذي ترغب في الاستفسار عنه؟</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E7ECF4', borderRadius: 22, padding: '38px 42px', boxShadow: '0 18px 44px -30px rgba(15,31,61,.35)' }}>
          {state === 'success' ? (
            <div style={{ textAlign: 'center', padding: '26px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PIcon d={IC.check} size={56} color="#16A34A" sw={1.6} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F1F3D', marginTop: 14 }}>تم إرسال استفسارك بنجاح</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#5E6E8C', marginTop: 6 }}>سيتواصل معك الفريق المعني في أقرب وقت.</div>
              <button
                onClick={reset}
                style={{ marginTop: 20, background: '#fff', border: '1.5px solid #C9D8F2', color: '#2563EB', borderRadius: 12, padding: '11px 28px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                إرسال استفسار آخر
              </button>
            </div>
          ) : (
            <>
              {state === 'error' && (
                <div style={{ background: '#FDF6F6', border: '1px solid #F3D2D2', color: '#7A3B3B', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 18 }}>
                  تعذر إرسال الاستفسار، يرجى المحاولة مجدداً.
                </div>
              )}
              <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} placeholder="website" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '18px 20px' }}>
                <div>
                  <label style={label}>الاسم</label>
                  <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="الاسم الكامل" style={input('name')} />
                  {err('name')}
                </div>
                <div>
                  <label style={label}>رقم الهاتف</label>
                  <input value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/[^0-9+\s-]/g, ''))} placeholder="+971 5x xxx xxxx" style={{ ...input('phone'), direction: 'ltr', textAlign: 'right' }} />
                  {err('phone')}
                </div>
                <div>
                  <label style={label}>البريد الإلكتروني</label>
                  <input value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@entity.gov.ae" style={{ ...input('email'), direction: 'ltr', textAlign: 'right' }} />
                  {err('email')}
                </div>
                <div>
                  <label style={label}>المسار المعني</label>
                  <select value={f.stream} onChange={(e) => set('stream', e.target.value)} style={{ ...input('stream'), fontWeight: 700, cursor: 'pointer' }}>
                    <option value="">اختر المسار…</option>
                    {CONTACT_STREAMS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {err('stream')}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={label}>محتوى الرسالة</label>
                  <textarea value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="اكتب استفسارك هنا…" rows={6} style={{ ...input('message'), resize: 'vertical', padding: '13px 15px' }} />
                  {err('message')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 22 }}>
                <button
                  onClick={submit}
                  disabled={state === 'sending'}
                  style={{
                    background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 52px',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: state === 'sending' ? 'default' : 'pointer',
                    opacity: state === 'sending' ? 0.7 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {state === 'sending' ? 'جارِ الإرسال…' : 'إرسال'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
