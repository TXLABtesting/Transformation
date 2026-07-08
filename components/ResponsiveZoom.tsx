'use client';
import { useEffect } from 'react';

// Applies the global density zoom responsively. It lives in JS (not CSS)
// because the production CSS minifier collapses a `zoom` declaration inside a
// media query back into the unconditional base rule, so a CSS-only breakpoint
// can't reliably scale it down on small screens.
//   ≥1101px  → 1.15 (desktop density)
//   481–1100 → 1    (tablet, natural scale so nothing overflows)
//   ≤480     → 0.9  (small phones)
export function ResponsiveZoom() {
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const z = w >= 1101 ? 1.15 : w <= 480 ? 0.9 : 1;
      // setProperty keeps it as an inline style that beats the stylesheet
      document.body.style.setProperty('zoom', String(z));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
