import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

// Brand type: IBM Plex Sans Arabic across the whole product — titles carry the
// bold weights, body/paragraph text stays regular (see globals.css)
const ibm = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-base',
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
    <html lang="ar" dir="rtl" className={ibm.variable}>
      <head>
        {/* GE Alma (licensed) — drop the font files into public/assets/fonts/
            and the whole platform switches over; until then the fallback
            (IBM Plex Sans Arabic) renders. Black carries every weight so the
            brand cut is used for titles and body alike. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:'GE Alma';src:url('${base}/assets/fonts/GE-Alma-Black.otf') format('opentype'),url('${base}/assets/fonts/GE-Alma-Black.ttf') format('truetype');font-weight:100 900;font-style:normal;font-display:swap;}`,
          }}
        />
      </head>
      <body>
        {/* Set the responsive density zoom before first paint (no flash);
            ResponsiveZoom then keeps it in sync on resize. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var w=window.innerWidth;document.body.style.zoom=w>=1101?'1.15':'1';})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
