import type { Metadata } from 'next';
import { Noto_Kufi_Arabic, Alexandria, Cairo } from 'next/font/google';
import './globals.css';

// Brand type: Noto Kufi Arabic across the whole product; titles (.hd, h1-h3)
// render in Alexandria (see globals.css)
const noto = Noto_Kufi_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-base',
});
const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-head',
});
// خط الموقع العام (الرئيسية/من نحن/المنشورات/تواصل معنا) وفق تسليم التصميم
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'المنصة الحكومية لتخطيط ومتابعة مشروع الذكاء الاصطناعي المساعد',
  description:
    'منصة حكومية لحصر ومراجعة ومتابعة أعمال التحول بالذكاء الاصطناعي عبر الجهات الاتحادية.',
  robots: { index: false, follow: false },
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return (
    <html lang="ar" dir="rtl" className={noto.variable + ' ' + alexandria.variable + ' ' + cairo.variable}>
      <head>
      </head>
      <body>
        {/* Set the responsive density zoom before first paint (no flash);
            ResponsiveZoom then keeps it in sync on resize. Density zoom is a
            platform-dashboard affordance only — the public site pages
            (الرئيسية/من نحن/المنشورات/تواصل معنا/تسجيل الدخول) render at
            natural scale, and their scroll-driven sections depend on it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var b='" +
              base +
              "';var p=location.pathname;if(b&&p.indexOf(b)===0)p=p.slice(b.length);var plat=p.indexOf('/dashboard')===0||p.indexOf('/moca')===0;var w=window.innerWidth;document.body.style.zoom=plat&&w>=1101?'1.15':'1';})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
