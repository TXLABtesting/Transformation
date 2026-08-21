'use client';
import { asset, SITE_BRAND, SITE_NAME, SITE_COPYRIGHT } from '@/lib/site';

/** التذييل المتدرج الذي يختم كل صفحات الموقع العام */
export function SiteFooter() {
  return (
    <footer
      dir="rtl"
      className="relative overflow-hidden text-white"
      style={{
        background:
          'radial-gradient(120% 160% at 8% 0%, #01BDF9EB 0%, transparent 46%), radial-gradient(130% 150% at 96% 100%, #01B3FA 0%, #05337DE5 34%, transparent 68%), radial-gradient(90% 120% at 70% 12%, #0194FBEB 0%, transparent 52%), #002B6B',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-full"
        style={{
          background:
            'linear-gradient(180deg,rgba(8,31,84,1) 0%,rgba(8,31,84,.85) 20%,rgba(8,31,84,.55) 42%,rgba(8,31,84,.28) 62%,rgba(8,31,84,.1) 80%,rgba(8,31,84,0) 100%)',
        }}
      />
      <div
        className="relative z-[4] mx-auto w-full max-w-[1220px] px-5"
        style={{ paddingTop: 'clamp(70px,9vw,110px)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-12">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(SITE_BRAND.logoMono)} alt={SITE_NAME} className="h-[58px] object-contain" />
          </div>
          <div className="flex max-w-[380px] items-center">
            <div className="text-[13.5px] font-semibold leading-[2.1] text-white/60">{SITE_NAME}</div>
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-[26px] pb-[30px]">
          <div className="text-[12.5px] font-semibold text-white/50">{SITE_COPYRIGHT}</div>
        </div>
      </div>
    </footer>
  );
}
