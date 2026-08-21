'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';

interface SiteLayoutProps {
  children: ReactNode;
  /** خلفية الصفحة خلف المحتوى */
  background?: string;
  /** للصفحات التي تبدأ بـ hero ممتد: يبقى الشريط شفافاً حتى أول تمرير */
  overHero?: boolean;
}

/** غلاف الشريط + الصفحة + التذييل لكل صفحات الموقع العام */
export function SiteLayout({ children, background = '#F4F7FB', overHero = false }: SiteLayoutProps) {
  const pathname = usePathname();

  // كل صفحة تبدأ من الأعلى — الصفحات طويلة ومقادة بالتمرير
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div dir="rtl" className="pub-site flex min-h-screen flex-col" style={{ background }}>
      <SiteNav overHero={overHero} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
