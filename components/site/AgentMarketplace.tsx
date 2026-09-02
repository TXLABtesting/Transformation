'use client';
// ============================================================================
// «سوق المساعدين» — استكشاف وكلاء الذكاء الاصطناعي المساعد بحسب المسارات،
// ببحث وتصفية بالفئة. منفَّذ من ملف التصميم Agent Marketplace.dc.html كما هو.
// ============================================================================
import { useMemo, useState } from 'react';
import { SiteLayout } from './SiteLayout';

type Agent = {
  cat: string;
  name: string;
  by: string;
  feats: string[];
  rate: string;
  sat: string;
  rev: number;
};

const AGENTS: Agent[] = [
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل جدولة الاجتماعات', by: 'سعيد النعيمي', feats: ['يجد الأوقات المناسبة عبر التقويمات', 'يحجز القاعات تلقائياً', 'يرسل الدعوات ويحدّثها'], rate: '4.2', sat: '94%', rev: 12 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل تلخيص الوثائق', by: 'أحمد المنصوري', feats: ['يلخّص التقارير الطويلة', 'يختصر سلاسل البريد', 'يقدّم موجزات دقيقة'], rate: '4.0', sat: '98%', rev: 26 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل صياغة البريد', by: 'مريم السويدي', feats: ['يصيغ بأسلوبك', 'بالعربية والإنجليزية', 'يحسّن حتى الاعتماد'], rate: '4.8', sat: '98%', rev: 16 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل التوظيف', by: 'فاطمة الزعابي', feats: ['يفرز طلبات التوظيف', 'يجدول المقابلات', 'يعدّ تقارير المرشحين'], rate: '4.5', sat: '96%', rev: 34 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل المشتريات', by: 'نورة القبيسي', feats: ['يعدّ طلبات الشراء', 'يقارن العروض', 'يتابع دورة الاعتماد'], rate: '4.6', sat: '97%', rev: 29 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل مراجعة العقود', by: 'لطيفة المزروعي', feats: ['يراجع بنود العقود', 'يرصد المخاطر القانونية', 'يقترح صياغات بديلة'], rate: '4.4', sat: '95%', rev: 19 },
  { cat: 'مسار العمل الحكومي الاستراتيجي', name: 'وكيل البيانات والتقارير', by: 'شمّا الحوسني', feats: ['يحوّل البيانات إلى رؤى', 'يولّد لوحات متابعة', 'يجيب بالأرقام'], rate: '4.5', sat: '96%', rev: 27 },
  { cat: 'مسار العمل الحكومي الاستراتيجي', name: 'وكيل تنظيم المهام', by: 'خالد الشامسي', feats: ['يلتقط بنود العمل من الاجتماعات', 'يرتّب الأولويات', 'يتابع الإنجاز'], rate: '4.4', sat: '95%', rev: 21 },
  { cat: 'مسار الخدمات الحكومية', name: 'وكيل إسعاد المتعاملين', by: 'راشد النيادي', feats: ['يجيب عن الاستفسارات على مدار الساعة', 'يوجّه الطلبات للجهة المعنية', 'يقيس رضا المتعاملين'], rate: '4.6', sat: '97%', rev: 52 },
  { cat: 'مسار الخدمات الحكومية', name: 'وكيل الإجازات والحضور', by: 'محمد الكعبي', feats: ['يعالج طلبات الإجازات', 'يجيب عن أسئلة السياسات', 'يرصد أنماط الحضور'], rate: '4.3', sat: '93%', rev: 18 },
  { cat: 'مسار تقنيات الذكاء الاصطناعي والبيانات', name: 'وكيل الدعم الفني', by: 'عائشة الفلاسي', feats: ['يحل المشكلات الشائعة فوراً', 'يصعّد الحالات المعقدة', 'يوثّق الحلول'], rate: '4.1', sat: '92%', rev: 41 },
  { cat: 'مسار تقنيات الذكاء الاصطناعي والبيانات', name: 'وكيل أمن المعلومات', by: 'حمدان الظاهري', feats: ['يرصد التهديدات', 'يقيّم الثغرات', 'ينبّه الفرق المعنية'], rate: '4.9', sat: '99%', rev: 15 },
  { cat: 'مسار العمليات والدعم المؤسسي', name: 'وكيل التدقيق المالي', by: 'سلطان المهيري', feats: ['يراجع المعاملات آلياً', 'يكشف الحالات الشاذة', 'يولّد تقارير التدقيق'], rate: '4.7', sat: '98%', rev: 22 },
  { cat: 'مسار بناء القدرات والتدريب', name: 'وكيل التدريب والتأهيل', by: 'عبدالله الحمادي', feats: ['يقترح مسارات تعلم مخصصة', 'يتابع تقدم المتدربين', 'يقيس أثر التدريب'], rate: '4.5', sat: '96%', rev: 14 },
];

const CATS = ['الكل', 'مسار العمليات والدعم المؤسسي', 'مسار العمل الحكومي الاستراتيجي', 'مسار الخدمات الحكومية', 'مسار تقنيات الذكاء الاصطناعي والبيانات', 'مسار بناء القدرات والتدريب'];

const ENTS: Record<string, string> = { 'سعيد النعيمي': 'وزارة شؤون مجلس الوزراء', 'أحمد المنصوري': 'الأمانة العامة للجنة الوطنية', 'مريم السويدي': 'وزارة الاقتصاد', 'فاطمة الزعابي': 'الهيئة الاتحادية للموارد البشرية', 'نورة القبيسي': 'وزارة المالية', 'لطيفة المزروعي': 'وزارة العدل', 'شمّا الحوسني': 'المركز الاتحادي للتنافسية والإحصاء', 'خالد الشامسي': 'وزارة الطاقة والبنية التحتية', 'راشد النيادي': 'وزارة الداخلية', 'محمد الكعبي': 'الهيئة الاتحادية للموارد البشرية', 'عائشة الفلاسي': 'هيئة تنظيم الاتصالات والحكومة الرقمية', 'حمدان الظاهري': 'مجلس الأمن السيبراني', 'سلطان المهيري': 'وزارة المالية', 'عبدالله الحمادي': 'البرنامج الوطني للذكاء الاصطناعي' };

// انزياحات هالات البطاقات — تتناوب كما في التصميم
const BLOOMS = [
  { b1Top: '-130px', b1Right: '-90px', b1Blur: '26px', b1Rot: '14deg', b2Bottom: '-150px', b2Left: '-80px', b2Blur: '30px', b2Rot: '-18deg' },
  { b1Top: '-90px', b1Right: '-140px', b1Blur: '34px', b1Rot: '-26deg', b2Bottom: '-120px', b2Left: '-130px', b2Blur: '26px', b2Rot: '22deg' },
  { b1Top: '-160px', b1Right: '-40px', b1Blur: '30px', b1Rot: '38deg', b2Bottom: '-170px', b2Left: '-40px', b2Blur: '34px', b2Rot: '-8deg' },
  { b1Top: '-110px', b1Right: '-120px', b1Blur: '22px', b1Rot: '-6deg', b2Bottom: '-130px', b2Left: '-110px', b2Blur: '38px', b2Rot: '30deg' },
];

const norm = (v: string) => v.replace(/[أإآ]/g, 'ا');

export function AgentMarketplace() {
  const [cat, setCat] = useState('الكل');
  const [q, setQ] = useState('');

  const sections = useMemo(() => {
    const match = (a: Agent) => !q || norm(a.name + a.by + a.feats.join(' ') + a.cat).includes(norm(q));
    const list = AGENTS.filter(match);
    const byCat: { name: string; agents: (Agent & typeof BLOOMS[number] & { tag: string; ent: string })[] }[] = [];
    list.forEach((a) => {
      let sec = byCat.find((x) => x.name === a.cat);
      if (!sec) {
        sec = { name: a.cat, agents: [] };
        byCat.push(sec);
      }
      const bloom = BLOOMS[sec.agents.length % BLOOMS.length];
      sec.agents.push({ ...a, ...bloom, tag: a.cat.replace('مسار ', ''), ent: ENTS[a.by] || 'جهة اتحادية' });
    });
    byCat.sort((a, b) => CATS.indexOf(a.name) - CATS.indexOf(b.name));
    return { byCat, empty: list.length === 0 };
  }, [q]);

  const scrollToSec = (name: string) => {
    requestAnimationFrame(() => {
      if (name === 'الكل') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = Array.from(document.querySelectorAll('[data-sec]')).find((el) => el.getAttribute('data-sec') === name);
      const doc = document.scrollingElement || document.documentElement;
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + doc.scrollTop - 110, behavior: 'smooth' });
    });
  };

  return (
    <SiteLayout>
      <div dir="rtl">
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '170px 20px 44px' }}>
          <h1 style={{ fontSize: 'clamp(36px,4.4vw,54px)', fontWeight: 900, margin: '0 0 40px', textAlign: 'center', color: '#0F1F3D' }}>
            استكشف المساعدين
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 260px', borderBottom: '1px solid rgba(15,31,61,.16)', padding: '0 4px 16px', marginTop: -14, transform: 'translateY(7px)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="عمّ تبحث؟…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', background: 'transparent', color: '#0F1F3D', minWidth: 120 }}
              />
            </div>
            <div style={{ position: 'relative', flex: '0 0 auto' }}>
              <select
                value={cat}
                onChange={(e) => {
                  setCat(e.target.value);
                  scrollToSec(e.target.value);
                }}
                style={{ appearance: 'none', WebkitAppearance: 'none', border: '1px solid #D7E1F0', backgroundColor: '#fff', borderRadius: 12, padding: '13px 20px 13px 48px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', color: '#0F1F3D', cursor: 'pointer', outline: 'none', maxWidth: 320 }}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#54627B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(180deg,#F4F7FB 0px,#EEF3F9 100px,#E0E8F5 210px,#CBD8ED 320px,#AEC0E1 430px,#8CA3D3 540px,#6A87C4 650px,#4B6DB6 760px,#2F55A8 870px,#1B459E 980px,#16409B 1080px,#0C2868 72%,#081F54 100%)' }}>
          <div style={{ maxWidth: 1220, margin: '0 auto', padding: '30px 20px 80px', position: 'relative', zIndex: 2 }}>
            {sections.empty && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.75)', fontSize: 15, fontWeight: 700, padding: '60px 0' }}>
                لا توجد نتائج مطابقة — جرّب كلمة أخرى
              </div>
            )}
            {sections.byCat.map((sec, si) => (
              <div key={sec.name} data-sec={sec.name} style={{ marginBottom: 64 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 26, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: si === 0 ? '#0F1F3D' : '#fff' }}>{sec.name}</h2>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: si === 0 ? 'rgba(15,31,61,.55)' : 'rgba(255,255,255,.85)', letterSpacing: '.22em' }}>
                    {sec.agents.length + (sec.agents.length > 2 ? ' مساعدين' : ' مساعد')}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 24 }}>
                  {sec.agents.map((a) => (
                    <div
                      key={a.name}
                      style={{ position: 'relative', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #EDF2F9', borderRadius: 18, padding: '16px 16px 22px', display: 'flex', flexDirection: 'column', boxShadow: '0 18px 42px -32px rgba(15,31,61,.32)', transition: 'box-shadow .3s,transform .3s' }}
                    >
                      <div style={{ position: 'absolute', top: a.b1Top, right: a.b1Right, width: 340, height: 250, borderRadius: '50%', background: 'radial-gradient(52% 48% at 50% 50%,rgba(0,152,248,.22),rgba(1,88,248,.10) 55%,transparent 76%)', filter: `blur(${a.b1Blur})`, transform: `rotate(${a.b1Rot})`, pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: a.b2Bottom, left: a.b2Left, width: 300, height: 230, borderRadius: '50%', background: 'radial-gradient(50% 50% at 50% 50%,rgba(0,184,248,.17),transparent 73%)', filter: `blur(${a.b2Blur})`, transform: `rotate(${a.b2Rot})`, pointerEvents: 'none' }} />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '6px 4px 0' }}>
                        <div style={{ fontSize: 18.5, fontWeight: 900, color: '#0F1F3D', lineHeight: 1.5 }}>{a.name}</div>
                        <button
                          title="طلب استخدام المساعد"
                          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: '#0F1F3D', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', boxShadow: '0 8px 20px -10px rgba(1,88,248,.7)' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7l10 10" />
                            <path d="M16 7H7v9" />
                          </svg>
                        </button>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14, padding: '0 4px', flex: 1 }}>
                        {a.feats.map((f) => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 17, height: 17, borderRadius: 5, background: '#E4EEFD', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', marginTop: 3 }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#3B4A66', lineHeight: 1.9 }}>{f}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, padding: '0 4px' }}>
                        <span style={{ background: '#E4EEFD', color: '#1D4ED8', fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: '6px 13px' }}>{a.tag}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FBF1DC', color: '#8A5A00', fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: '6px 13px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#F5A623" stroke="none">
                            <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                          </svg>
                          {a.rate}
                        </span>
                        <span style={{ background: '#EDF1F7', color: '#3B4A66', fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: '6px 13px' }}>{a.rev} مراجعة</span>
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, borderTop: '1px solid #EFF3F9', marginTop: 16, padding: '14px 4px 0' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', flex: '0 0 auto', background: '#EAF1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7C95BF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8.2" r="3.6" />
                            <path d="M4.8 20c.7-3.7 3.7-5.8 7.2-5.8s6.5 2.1 7.2 5.8" />
                          </svg>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0F1F3D' }}>{a.by}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#5E6E8C', marginTop: 1 }}>{a.ent}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
