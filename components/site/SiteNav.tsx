'use client';
// ===========================================================================
// شريط التنقل العائم للموقع العام — من تسليم التصميم.
// زائر غير مسجّل: الرئيسية · من نحن · زر تسجيل الدخول.
// بعد الدخول: تظهر المنشورات وتواصل معنا مع زر «منصة الإدخال» وقائمة الحساب.
// «منصة الإدخال» توجّه حسب جهة المستخدم: وزارة شؤون مجلس الوزراء → لوحة
// الوزارة (/moca)، وبقية الجهات والأدوار → لوحة المنصة (/dashboard).
// ===========================================================================
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ROLE } from '@/lib/domain';
import { asset, dashboardHref, SITE_BRAND } from '@/lib/site';

interface NavLink {
  href: string;
  label: string;
}

/** روابط يراها كل زائر */
const PUBLIC_LINKS: NavLink[] = [
  { href: '/', label: 'الرئيسية' },
  { href: '/about', label: 'من نحن' },
];

/** روابط الأعضاء — تبقى مخفية حتى تسجيل الدخول (وفق التصميم) */
const MEMBER_LINKS: NavLink[] = [
  { href: '/library', label: 'المنشورات' },
  { href: '/contact', label: 'تواصل معنا' },
];

const CTA_GRADIENT = 'linear-gradient(135deg,#0158DF 0%,#0098F8 55%,#00B8F8 100%)';

const NAV_BREAKPOINT = 1040;

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" />
    </svg>
  );
}

interface SiteNavProps {
  /** true فوق hero ممتد: يبقى الشريط شفافاً حتى أول تمرير */
  overHero?: boolean;
}

export function SiteNav({ overHero = false }: SiteNavProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s._hydrated);
  const authed = useStore((s) => s.view !== 'login');
  const role = useStore((s) => s.role);
  const entityName = useStore((s) => s.entityName);
  const logout = useStore((s) => s.logout);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const lastY = useRef(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const user = hydrated && authed;
  const roleInfo = ROLE[role] || { label: '', sub: '' };
  const userName = roleInfo.label || 'مستخدم المنصة';
  const userSub = role === 'coord' || role === 'entity' ? entityName : roleInfo.sub;
  const links = user ? [...PUBLIC_LINKS, ...MEMBER_LINKS] : PUBLIC_LINKS;
  const inputHref = dashboardHref(entityName);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NAV_BREAKPOINT);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y >= 40);
      const delta = y - lastY.current;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // إغلاق القوائم عند التنقل وعند اتساع الشاشة
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!narrow) setMenuOpen(false);
  }, [narrow]);

  // قائمة الحساب تُغلق بنقرة خارجية أو Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const signOut = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    const clean = pathname.replace(/\/$/, '') || '/';
    return href === '/' ? clean === '/' : clean.endsWith(href);
  };

  const solid = scrolled || !overHero;

  return (
    <div
      className="pointer-events-none fixed top-[18px] right-0 left-0 z-[80] flex justify-center px-5"
      style={{
        transition: 'transform .38s cubic-bezier(.22,1,.36,1)',
        transform: hidden ? 'translateY(-130%)' : 'translateY(0)',
      }}
    >
      <div
        className="pointer-events-auto flex w-full max-w-[1180px] items-center justify-between rounded-full py-2 px-[18px]"
        style={{
          gap: 'clamp(6px,1.4vw,30px)',
          background: solid ? 'rgba(255,255,255,.9)' : 'transparent',
          backdropFilter: solid ? 'blur(20px) saturate(1.5)' : 'none',
          WebkitBackdropFilter: solid ? 'blur(20px) saturate(1.5)' : 'none',
          boxShadow: solid ? '0 18px 44px -20px rgba(15,31,61,.35)' : 'none',
          transition: 'background .35s,box-shadow .35s,backdrop-filter .35s',
        }}
      >
        <Link href="/" className="flex min-w-0 flex-1 items-center justify-start gap-[10px] py-[3px] px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(SITE_BRAND.logoNav)} alt="مشروع الذكاء الاصطناعي المساعد" className="h-[33px] w-[127px] object-contain" />
        </Link>

        {!narrow && (
          <nav className="flex min-w-0 flex-[0_1_auto] items-center justify-center" style={{ gap: 'clamp(6px,1.4vw,30px)' }}>
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap rounded-full transition-colors hover:!text-[#2563EB]"
                  style={{
                    padding: '10px clamp(4px,0.9vw,16px)',
                    fontSize: active ? 13 : 13.5,
                    fontWeight: active ? 800 : 400,
                    color: active ? '#2563EB' : '#0F1F3D',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {!narrow && !user && (
          <div className="flex flex-1 justify-end">
            <Link
              href="/login"
              className="inline-block flex-none whitespace-nowrap rounded-full text-white transition-transform hover:-translate-y-px"
              style={{ background: CTA_GRADIENT, padding: '11px clamp(16px,2vw,28px)', fontSize: 13, fontWeight: 800 }}
            >
              تسجيل الدخول
            </Link>
          </div>
        )}

        {!narrow && user && (
          <div className="flex flex-1 items-center justify-end gap-[10px]">
            <a
              href={inputHref}
              className="inline-block flex-none whitespace-nowrap rounded-full text-white transition-transform hover:-translate-y-px"
              style={{ background: CTA_GRADIENT, padding: '11px clamp(16px,2vw,24px)', fontSize: 13, fontWeight: 800 }}
            >
              منصة الإدخال
            </a>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-label="حساب المستخدم"
                aria-expanded={userMenuOpen}
                className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-none bg-[#0F1F3D] text-white transition-all hover:-translate-y-px hover:brightness-95"
              >
                <UserIcon />
              </button>
              {userMenuOpen && (
                <div className="absolute top-[52px] left-0 z-[90] flex min-w-[216px] flex-col gap-[2px] rounded-2xl border border-[#E6ECF6] bg-white p-[10px] shadow-[0_26px_54px_-26px_rgba(15,31,61,.4)]">
                  <div className="mb-[6px] border-b border-[#F0F4FA] px-3 pt-[10px] pb-3 text-right">
                    <div className="text-[13.5px] font-black text-[#0F1F3D]">{userName}</div>
                    <div className="mt-1 text-[11.5px] font-bold text-[#7C8AA3]">{userSub}</div>
                  </div>
                  <a
                    href={inputHref}
                    className="cursor-pointer rounded-[10px] border-none bg-transparent px-3 py-[11px] text-right text-[13px] font-extrabold text-[#0F1F3D] transition-colors hover:bg-[#F4F7FC]"
                  >
                    الملف الشخصي
                  </a>
                  <button
                    type="button"
                    onClick={signOut}
                    className="cursor-pointer rounded-[10px] border-none bg-transparent px-3 py-[11px] text-right text-[13px] font-extrabold text-[#C0392B] transition-colors hover:bg-[#FDF1EF]"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {narrow && (
          <div className="relative flex-none">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="القائمة"
              aria-expanded={menuOpen}
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[rgba(15,31,61,.12)] bg-[rgba(255,255,255,.94)] text-[#0F1F3D] transition-colors hover:bg-[#EAF1FE]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute top-14 left-0 z-[90] flex min-w-[242px] flex-col gap-[2px] rounded-[18px] border border-[#E6ECF6] bg-white p-[10px] shadow-[0_28px_58px_-26px_rgba(15,31,61,.42)]">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-[14px] py-3 text-sm font-extrabold text-[#0F1F3D] transition-colors hover:bg-[#F4F7FC]"
                  >
                    {link.label}
                  </Link>
                ))}
                {!user ? (
                  <Link
                    href="/login"
                    className="mt-2 rounded-full bg-[#0F1F3D] px-[18px] py-[13px] text-center text-[13.5px] font-extrabold text-white"
                  >
                    تسجيل الدخول
                  </Link>
                ) : (
                  <>
                    <a
                      href={inputHref}
                      className="mt-2 rounded-full px-[18px] py-[13px] text-center text-[13.5px] font-extrabold text-white"
                      style={{ background: CTA_GRADIENT }}
                    >
                      منصة الإدخال
                    </a>
                    <div className="mt-2 flex flex-col gap-[2px] border-t border-[#F0F4FA] pt-2">
                      <div className="px-[14px] pt-2 pb-[6px] text-right">
                        <div className="text-[13.5px] font-black text-[#0F1F3D]">{userName}</div>
                        <div className="mt-[3px] text-[11.5px] font-bold text-[#7C8AA3]">{userSub}</div>
                      </div>
                      <a
                        href={inputHref}
                        className="cursor-pointer rounded-xl border-none bg-transparent px-[14px] py-3 text-right text-sm font-extrabold text-[#0F1F3D] transition-colors hover:bg-[#F4F7FC]"
                      >
                        الملف الشخصي
                      </a>
                      <button
                        type="button"
                        onClick={signOut}
                        className="cursor-pointer rounded-xl border-none bg-transparent px-[14px] py-3 text-right text-sm font-extrabold text-[#C0392B] transition-colors hover:bg-[#FDF1EF]"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
