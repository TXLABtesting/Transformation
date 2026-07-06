import type { Metadata } from 'next';
import { Noto_Kufi_Arabic, Alexandria } from 'next/font/google';
import './globals.css';

// Brand type: Noto Kufi Arabic is the base for all content; Alexandria is
// reserved for headings and titles (see globals.css)
const kufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-base',
});
const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-heading',
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
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${alexandria.variable}`}>
      <body>{children}</body>
    </html>
  );
}
