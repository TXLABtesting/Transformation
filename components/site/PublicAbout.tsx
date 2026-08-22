'use client';
// من نحن — مسيرة التحول (فيلم أفقي مقاد بالتمرير) + اقتباس القيادة + المبادئ
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { mergedHistory, type SiteContent } from '@/lib/site';
import { asset, SITE_MEDIA } from '@/lib/site';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';
import { HistoryJourney } from './HistoryJourney';
import { useScrollReveal, useMediaQuery } from './hooks';

export function PublicAbout() {
  const root = useRef<HTMLDivElement>(null);
  useScrollReveal(root);
  const hydrate = useStore((s) => s.hydrate);
  const site = useStore((s) => s.site);

  useEffect(() => {
    hydrate();
    window.scrollTo(0, 0);
  }, [hydrate]);

  return (
    <div ref={root} dir="rtl" className="pub-site min-h-screen bg-[#F7F9FD] font-kufi">
      <SiteNav overHero />
      <HistoryJourney milestones={mergedHistory(site)} />
      <Quote site={site} />
      <Principles site={site} />
      <SiteFooter />
    </div>
  );
}

/* ---- اقتباس القيادة ------------------------------------------------------- */
function Quote({ site }: { site: SiteContent }) {
  const stacked = useMediaQuery('(max-width: 860px)');

  return (
    <section
      data-reveal
      className="relative flex overflow-hidden bg-white"
      style={{ minHeight: stacked ? 0 : '100svh', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center' }}
    >
      <div
        className="overflow-hidden"
        style={
          stacked
            ? { position: 'relative', width: '100%', height: 'min(88vw,440px)' }
            : { position: 'absolute', insetBlock: 0, left: 0, width: '66%' }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={site.quoteImageUrl ? site.quoteImageUrl : asset(SITE_MEDIA.mgQuote)}
          alt=""
          className="absolute block w-full object-cover"
          style={{ top: -2, bottom: -2, height: 'calc(100% + 4px)', objectPosition: '25% 32%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: stacked
              ? 'linear-gradient(0deg,#FFFFFF 0%,rgba(255,255,255,.55) 16%,rgba(255,255,255,0) 38%)'
              : 'linear-gradient(270deg,#FFFFFF 0%,#FFFFFF 4%,rgba(255,255,255,.85) 16%,rgba(255,255,255,.4) 30%,rgba(255,255,255,0) 50%)',
          }}
        />
      </div>

      <div
        className="relative z-[2] mx-auto flex w-full max-w-[1220px] justify-start px-6"
        style={{ paddingBlock: stacked ? '10px 56px' : 'clamp(40px,6vw,80px)' }}
      >
        <div className="text-right" style={{ maxWidth: stacked ? '100%' : 'min(440px,38%)', minWidth: 'min(100%,300px)' }}>
          <blockquote className="m-0 text-[#0F1F3D]" style={{ fontSize: 'clamp(22px,2.4vw,33px)', fontWeight: 500, lineHeight: 2 }}>
            {site.quoteText}
          </blockquote>
          <div className="mt-[22px] font-semibold text-[#8A97AD]" style={{ fontSize: 'clamp(14.5px,1.5vw,17px)' }}>
            {site.quoteAttribution}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- المبادئ العامة -------------------------------------------------------- */
function Principles({ site }: { site: SiteContent }) {
  const single = useMediaQuery('(max-width: 760px)');

  return (
    <section style={{ background: 'linear-gradient(180deg,#0B2A66 0%,#0D2450 62%,#0F1F3D 100%)' }}>
      <div className="mx-auto max-w-[1120px] px-8 pt-16 pb-[72px]">
        <div data-reveal className="mb-11 text-center">
          <h2 className="m-0 text-white" style={{ fontSize: 'clamp(30px,3.4vw,44px)', fontWeight: 500 }}>
            المبادئ العامة
          </h2>
          <div className="mx-auto mt-5 h-[3.5px] w-14 rounded-[3px] bg-[#2563EB]" />
        </div>

        <div className="grid" style={{ gridTemplateColumns: single ? '1fr' : '1fr 1fr', gap: '0 64px' }}>
          {site.principles.map((principle) => (
            <div key={principle.n} data-reveal className="flex items-start gap-[22px] border-b border-white/[.09] px-1 py-[26px]">
              <div
                className="mt-[2px] flex-none text-center"
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  lineHeight: 1,
                  width: 62,
                  color: 'transparent',
                  WebkitTextStroke: '1.3px rgba(143,180,236,.6)',
                  direction: 'ltr',
                }}
              >
                {principle.n}
              </div>
              <div>
                <div className="text-[17px] font-extrabold leading-[1.7] text-white">{principle.title}</div>
                <div className="mt-[6px] text-[13px] font-semibold leading-[2] text-[#9DB6DF]">{principle.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
