import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

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
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={cairo.className}>{children}</body>
    </html>
  );
}
