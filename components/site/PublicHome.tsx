'use client';
// ===========================================================================
// الصفحة الرئيسية للموقع العام — من تسليم التصميم (Hero بالفيديو، المقدمة،
// الرسالة، المستهدفات، آخر الأخبار، مسارات المشروع، البرنامج الزمني).
// النصوص والقوائم من محتوى الموقع في المخزن (يحرَّر من لوحة المشرف).
// ===========================================================================
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { asset, SITE_MEDIA, type SiteContent } from '@/lib/site';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';
import { PhaseTimeline } from './PhaseTimeline';
import { TargetColumn } from './TargetColumn';
import { useScrollReveal, useMediaQuery } from './hooks';

const HERO_BACKDROP =
  'radial-gradient(70% 62% at 80% 8%, rgba(178,219,250,.9) 0%, rgba(198,229,252,.42) 46%, rgba(220,240,254,0) 74%), radial-gradient(65% 58% at 8% 26%, rgba(190,224,251,.85) 0%, rgba(208,233,252,.38) 48%, rgba(228,243,254,0) 74%), radial-gradient(75% 66% at 28% 96%, rgba(171,215,249,.95) 0%, rgba(196,228,252,.45) 46%, rgba(224,241,254,0) 76%), radial-gradient(70% 60% at 90% 74%, rgba(186,222,251,.8) 0%, rgba(206,232,252,.35) 50%, rgba(232,244,255,0) 76%), linear-gradient(180deg, #FDFEFF 0%, #F5F9FE 40%, #EFF6FD 100%)';

export function PublicHome() {
  const root = useRef<HTMLDivElement>(null);
  useScrollReveal(root);
  const hydrate = useStore((s) => s.hydrate);
  const site = useStore((s) => s.site);

  useEffect(() => {
    hydrate();
    window.scrollTo(0, 0);
  }, [hydrate]);

  return (
    <div ref={root} dir="rtl" className="pub-site">
      <Hero site={site} />
      <Intro site={site} />
      <Message site={site} />
      <Targets site={site} />
      <News site={site} />
      <Streams site={site} />
      <PhaseTimeline phases={site.phases} />
      <SiteFooter />
    </div>
  );
}

/* ---- Hero ---------------------------------------------------------------- */
function Hero({ site }: { site: SiteContent }) {
  return (
    <section
      dir="rtl"
      className="relative overflow-hidden"
      style={{ height: '100svh', minHeight: 'min(760px,100svh)', background: HERO_BACKDROP }}
    >
      {/* الفيديو من محتوى الموقع إن حدده المشرف، وإلا الفيديو الرسمي المضمّن.
          key يعيد تحميل المصدر عند تغييره من الـCMS */}
      <video
        key={site.heroVideoUrl || 'default'}
        autoPlay
        muted
        loop
        playsInline
        poster={site.heroPosterUrl ? asset(site.heroPosterUrl) : asset(SITE_MEDIA.heroPoster)}
        className="pointer-events-none absolute inset-0 block h-full w-full object-cover"
      >
        <source src={site.heroVideoUrl ? asset(site.heroVideoUrl) : asset(SITE_MEDIA.heroVideo)} type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(360deg, #2E4359, #20488150, #FFFFFFA0)' }}
      />

      <SiteNav overHero />

      <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-end pb-[5svh] text-center">
        <div
          style={{
            fontSize: 'clamp(38px,8.4vw,86px)',
            fontWeight: 400,
            lineHeight: 1.3,
            color: '#FFFFFF',
            textShadow: '0 4px 34px rgba(3,39,107,.6)',
            animation: 'omTitle 1.2s .5s cubic-bezier(.22,1,.36,1) both',
          }}
        >
          {site.heroLine1}
        </div>
        <div
          style={{
            fontSize: 'clamp(44px,9.6vw,98px)',
            fontWeight: 600,
            lineHeight: 1.15,
            background: 'linear-gradient(90deg,#7FDCFB,#01BDF9,#33A7FF)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 4px 26px rgba(3,39,107,.55))',
            animation: 'omTitle 1.2s .8s cubic-bezier(.22,1,.36,1) both',
          }}
        >
          {site.heroLine2}
        </div>
      </div>
    </section>
  );
}

/* ---- Intro --------------------------------------------------------------- */
function Intro({ site }: { site: SiteContent }) {
  return (
    <section dir="rtl" className="relative overflow-hidden bg-white">
      <div
        className="mx-auto flex max-w-[1180px] flex-col px-5"
        style={{ paddingTop: 'clamp(28px,3.5vw,52px)', paddingBottom: 'clamp(40px,5vw,64px)', gap: 'clamp(28px,3.5vw,44px)' }}
      >
        <div className="mx-auto flex max-w-[900px] flex-col items-center" style={{ gap: 'clamp(24px,3.5vw,40px)' }}>
          <div data-reveal className="text-center">
            <div className="mb-[18px] flex items-center justify-center gap-[14px]">
              <div className="h-[3.5px] w-16" style={{ background: 'linear-gradient(90deg,#01BDF9,#2563EB)' }} />
            </div>
            <div style={{ fontSize: 'clamp(28px,3.2vw,44px)', fontWeight: 500, color: '#1B2A4A', lineHeight: 1.75, textWrap: 'balance' }}>
              {site.introPre}{' '}
              <span
                style={{
                  background: 'linear-gradient(120deg,#01BDF9,#2563EB)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 600,
                }}
              >
                {site.introHighlight}
              </span>
            </div>
          </div>

          <div
            data-reveal
            style={{ fontSize: 'clamp(14px,2.8vw,16px)', fontWeight: 600, color: '#5B6B85', lineHeight: 2.15, textWrap: 'pretty', textAlign: 'center' }}
          >
            {site.introText}
          </div>
        </div>

        <div data-reveal className="relative" style={{ height: 'clamp(280px,34vw,480px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.introImageUrl ? asset(site.introImageUrl) : asset(SITE_MEDIA.introCabinet)}
            alt=""
            className="absolute inset-0 block h-full w-full object-cover"
            style={{ objectPosition: 'center 55%' }}
          />
          <div className="absolute inset-y-0 right-0 w-[5px]" style={{ background: 'linear-gradient(180deg,#01BDF9,#2563EB)' }} />
        </div>
      </div>
    </section>
  );
}

/* ---- Message ------------------------------------------------------------- */
function Message({ site }: { site: SiteContent }) {
  const stacked = useMediaQuery('(max-width: 860px)');

  return (
    <section
      dir="rtl"
      className="relative flex items-center overflow-hidden bg-[#052D8C]"
      style={{
        minHeight: stacked ? 0 : '72svh',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
      }}
    >
      <div
        className="overflow-hidden"
        style={
          stacked
            ? { position: 'relative', width: '100%', height: 'min(72vw,380px)' }
            : { position: 'absolute', insetBlock: 0, left: 0, width: '60%' }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={site.launchImageUrl ? asset(site.launchImageUrl) : asset(SITE_MEDIA.hhLaunch)}
          alt=""
          className="absolute inset-0 block h-full w-full object-cover"
          style={{ objectPosition: 'center 62%' }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: stacked
              ? 'linear-gradient(180deg,rgba(4,28,100,0) 52%,rgba(4,28,100,.62) 82%,#052D8C 100%)'
              : 'linear-gradient(90deg,transparent 50%,rgba(4,28,100,.55) 78%,#052D8C 100%)',
          }}
        />
      </div>
      {!stacked && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(270deg,rgba(3,24,88,.9) 0%,rgba(4,30,104,.6) 32%,rgba(4,36,120,.12) 55%,transparent 70%)',
          }}
        />
      )}
      <div
        className="relative z-[2] mx-auto flex w-full max-w-[1180px] justify-start px-5"
        style={{ paddingBlock: stacked ? '12px 56px' : 'clamp(64px,8vw,110px)' }}
      >
        <div style={{ maxWidth: stacked ? '100%' : 480 }}>
          <div data-reveal className="mb-6 flex items-center gap-[14px]">
            <div className="h-[3.5px] w-16" style={{ background: 'linear-gradient(90deg,#01BDF9,#7FD4F7)' }} />
          </div>
          <p
            data-reveal
            className="m-0"
            style={{ fontSize: 'clamp(24px,2.6vw,40px)', fontWeight: 500, color: '#FFFFFF', lineHeight: 1.9, textWrap: 'balance' }}
          >
            {site.messagePre}{' '}
            <span
              style={{
                background: 'linear-gradient(120deg,#7FD4F7,#01BDF9)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontWeight: 600,
              }}
            >
              {site.messageHighlight}
            </span>{' '}
            {site.messagePost}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---- Targets ------------------------------------------------------------- */
function Targets({ site }: { site: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const stacked = useMediaQuery('(max-width: 760px)');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section dir="rtl" className="relative overflow-hidden bg-[#F4F7FB]" style={{ padding: 'clamp(20px,3vw,40px) 0 0' }}>
      <div ref={ref} data-reveal className="mx-auto max-w-[1220px] px-5">
        <div
          className="relative overflow-hidden"
          style={{ padding: 'clamp(8px,1.4vw,20px) clamp(24px,4vw,60px) clamp(16px,2.5vw,36px)' }}
        >
          <div className="relative z-[6] text-center">
            <h2 className="m-0 text-[#0F1F3D]" style={{ fontSize: 'clamp(28px,3.4vw,48px)', fontWeight: 500, lineHeight: 1.6 }}>
              المستهدفات الرئيسية
            </h2>
          </div>

          <div
            className="relative z-[2] flex justify-center pb-4"
            style={{
              flexDirection: stacked ? 'column' : 'row',
              alignItems: stacked ? 'center' : 'flex-end',
              gap: stacked ? 190 : 'clamp(80px,12vw,180px)',
              marginTop: stacked ? 215 : 230,
              perspective: 1400,
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[30%] z-0 h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
              style={{
                width: 'min(760px,80vw)',
                background: 'radial-gradient(50% 50% at 50% 50%,rgba(1,189,249,.12),rgba(37,99,235,.05) 55%,transparent 75%)',
                filter: 'blur(18px)',
              }}
            />
            <div
              className="pointer-events-none absolute z-[4] h-[400px]"
              style={{
                bottom: -100,
                right: -260,
                left: -260,
                background:
                  'linear-gradient(0deg,rgba(244,247,251,1) 0%,rgba(244,247,251,1) 34%,rgba(244,247,251,.92) 50%,rgba(244,247,251,.66) 66%,rgba(244,247,251,.36) 82%,rgba(244,247,251,.12) 93%,rgba(244,247,251,0) 100%)',
                maskImage: 'radial-gradient(95% 120% at 50% 100%,#000 60%,rgba(0,0,0,.65) 84%,transparent 100%)',
                WebkitMaskImage: 'radial-gradient(95% 120% at 50% 100%,#000 60%,rgba(0,0,0,.65) 84%,transparent 100%)',
              }}
            />
            {site.targets.map((target) => (
              <TargetColumn key={target.label} target={target} active={active} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- News ---------------------------------------------------------------- */
function News({ site }: { site: SiteContent }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const max = site.news.length - 1;

  useEffect(() => {
    const measure = () => {
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (!first) return;
      setStep(first.getBoundingClientRect().width + 26);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section id="news" dir="rtl" className="relative bg-[#F4F7FB] pt-14 pb-2">
      <div className="mx-auto max-w-[1220px]">
        <div data-reveal className="mb-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 px-5">
          <div className="max-w-[900px]">
            <div className="mb-4 flex items-center gap-[14px]">
              <div className="h-[3.5px] w-16" style={{ background: 'linear-gradient(90deg,#01BDF9,#2563EB)' }} />
            </div>
            <h2
              className="m-0 text-[#0F1F3D]"
              style={{ fontSize: 'clamp(28px,3.4vw,48px)', fontWeight: 500, lineHeight: 1.6, textWrap: 'pretty' }}
            >
              آخر الأخبار
            </h2>
          </div>
          <div className="flex items-center gap-3 pb-[6px]">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              aria-label="السابق"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9D6EA] bg-white text-[#0F1F3D] transition-colors hover:border-[#2563EB] hover:bg-[#2563EB] hover:text-white"
              style={{ visibility: index > 0 ? 'visible' : 'hidden' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(max, i + 1))}
              aria-label="التالي"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0F1F3D] bg-[#0F1F3D] text-white transition-colors hover:border-[#2563EB] hover:bg-[#2563EB]"
              style={{ visibility: index < max ? 'visible' : 'hidden' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div data-reveal style={{ padding: '0 max(20px, calc(50vw - 590px)) 0 20px' }}>
        <div
          className="overflow-hidden pt-[14px] pb-[90px] -mb-[60px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to left,#000 0%,#000 84%,rgba(0,0,0,.35) 95%,rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to left,#000 0%,#000 84%,rgba(0,0,0,.35) 95%,rgba(0,0,0,0) 100%)',
          }}
        >
          <div
            ref={trackRef}
            className="flex gap-[26px]"
            style={{ transform: `translateX(${index * step}px)`, transition: 'transform 1.05s cubic-bezier(.22,1,.36,1)', willChange: 'transform' }}
          >
            {site.news.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-stretch overflow-hidden rounded-[18px] border border-[#EBF0F7] bg-white shadow-[0_22px_48px_-34px_rgba(15,31,61,.35)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_30px_60px_-32px_rgba(37,99,235,.35)]"
                style={{ flex: '0 0 max(min(89vw,760px),66%)', minWidth: 0 }}
              >
                <div
                  className="relative overflow-hidden"
                  style={{ flex: '1 1 42%', minWidth: 'min(100%,250px)', minHeight: 'clamp(210px,44vw,340px)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(item.image)}
                    alt=""
                    aria-hidden
                    className="absolute block object-cover"
                    style={{ inset: -12, width: 'calc(100% + 24px)', height: 'calc(100% + 24px)', filter: 'blur(18px) saturate(1.05)' }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(item.image)}
                    alt=""
                    className="absolute inset-0 block h-full w-full object-cover"
                    style={{ objectPosition: 'center 30%' }}
                  />
                </div>
                <div
                  className="flex flex-col"
                  style={{ flex: '1 1 58%', minWidth: 'min(100%,290px)', padding: 'clamp(22px,4.4vw,32px) clamp(20px,4vw,30px) clamp(20px,3.6vw,28px)' }}
                >
                  <h3
                    className="m-0 text-[#0F1F3D]"
                    style={{ fontSize: 'clamp(17px,3.9vw,22px)', fontWeight: 400, lineHeight: 1.65, textWrap: 'pretty' }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-[14px] text-sm font-semibold leading-[2] text-[#5E6E8C]" style={{ textWrap: 'pretty' }}>
                    {item.desc}
                  </p>
                  <div className="min-h-[28px] flex-1" />
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <div className="text-[11px] font-bold text-[#8A97AD]">التاريخ:</div>
                      <div className="mt-[3px] text-[13.5px] font-extrabold text-[#0F1F3D]">{item.date}</div>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-[10px] whitespace-nowrap rounded-[10px] border border-[#DDE5F0] bg-white px-[18px] py-[11px] text-[12.5px] font-extrabold text-[#0F1F3D] transition-all hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      اقرأ المزيد
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 7l10 10" />
                        <path d="M16 7H7v9" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Streams ------------------------------------------------------------- */
function Streams({ site }: { site: SiteContent }) {
  const [index, setIndex] = useState(0);
  const max = site.streams.length - 1;

  return (
    <section dir="rtl" className="relative -mt-10 bg-[#F4F7FB] pt-[100px] pb-[110px]">
      <div className="flex flex-col justify-center overflow-hidden">
        <div className="relative z-[2] mx-auto w-full max-w-[1220px] flex-none">
          <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 px-5">
            <div>
              <h2 className="m-0 text-[#0F1F3D]" style={{ fontSize: 'clamp(28px,3.4vw,48px)', fontWeight: 500, lineHeight: 1.6 }}>
                مسارات المشروع
              </h2>
              <div className="mt-[10px] font-semibold leading-[2.1] text-[#5E6E8C]" style={{ fontSize: 'clamp(14.5px,1.5vw,17px)' }}>
                {site.streamsSub}
              </div>
            </div>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                aria-label="السابق"
                className="h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-[#D7E2F2] bg-white text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-[#EAF1FE]"
                style={{ display: index > 0 ? 'flex' : 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(max, i + 1))}
                aria-label="التالي"
                className="h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-[#D7E2F2] bg-white text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-[#EAF1FE]"
                style={{ display: index < max ? 'flex' : 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-none overflow-hidden pb-[46px] -mb-[46px]">
          <div
            className="flex w-max gap-6"
            style={{
              padding: '0 max(20px, calc((100% - 1180px) / 2))',
              transform: `translateX(calc(${index} * (min(420px, 86vw) + 24px)))`,
              transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {site.streams.map((stream) => (
              <article
                key={stream.id}
                className="relative min-h-[250px] overflow-hidden rounded-[18px] border border-[#E9EEF7] bg-white px-7 py-[34px] text-[#0F1F3D] shadow-[0_20px_46px_-34px_rgba(15,31,61,.35)] transition-all duration-[250ms] hover:-translate-y-[6px] hover:shadow-[0_30px_60px_-30px_rgba(29,78,216,.4)]"
                style={{ flex: '0 0 min(420px,86vw)' }}
              >
                <div className="relative z-[2] flex h-full flex-col justify-center gap-[14px]">
                  <h3 className="m-0 text-[#0F1F3D]" style={{ fontSize: 'clamp(20px,4.4vw,26px)', fontWeight: 500, lineHeight: 1.6 }}>
                    {stream.title}
                  </h3>
                  <div className="h-1 w-14 rounded-full" style={{ background: 'linear-gradient(90deg,#01BDF9,#2563EB)' }} />
                  <p
                    className="m-0 font-semibold leading-[2.2] text-[#54627B]"
                    style={{ fontSize: 'clamp(14px,1.5vw,16px)', textWrap: 'pretty' }}
                  >
                    {stream.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
