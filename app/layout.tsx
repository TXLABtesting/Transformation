import type { Metadata } from 'next';
import { Noto_Kufi_Arabic, Alexandria } from 'next/font/google';
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
    <html lang="ar" dir="rtl" className={noto.variable + ' ' + alexandria.variable}>
      <head>
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
