'use client';
import { useEffect, useState } from 'react';

/** الاشتراك في استعلام وسائط CSS — يعيد false قبل أول رسم (SSR) */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * يكشف كل عنصر [data-reveal] داخل root عند دخوله نافذة العرض (الانتقال نفسه
 * في globals.css). العناصر الظاهرة عند التحميل تُكشف فوراً، والأشقاء يتدرجون
 * بفارق 70ms كما في ملفات التصميم.
 */
export function useScrollReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;

    const reveal = (el: Element) => {
      if (el.hasAttribute('data-revealed')) return;
      el.setAttribute('data-revealed', '');
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }
    );

    const targets = Array.from(host.querySelectorAll('[data-reveal]'));
    targets.forEach((el) => {
      let index = 0;
      let sibling: Element | null = el;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.hasAttribute('data-reveal')) index++;
      }
      (el as HTMLElement).style.transitionDelay = `${(index % 8) * 0.07}s`;

      const rect = el.getBoundingClientRect();
      if (rect.height && rect.top < window.innerHeight * 0.92) {
        reveal(el);
        return;
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [root]);
}
