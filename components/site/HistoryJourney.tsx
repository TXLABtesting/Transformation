'use client';
import { useEffect, useRef, useState } from "react";
import { asset, type SiteHistoryMilestone } from "@/lib/site";
import { useMediaQuery } from "./hooks";

interface HistoryJourneyProps {
  milestones: SiteHistoryMilestone[];
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * "مسيرة التحول" — شريط محطات يتنقل بينه الزائر بزرَّي «‹» و«›» (carousel).
 * كان الشريط يتحرك بتمرير الصفحة نفسها (scroll hijack)؛ صار التنقل بالأزرار
 * وبعلامات السنوات وبمفاتيح الأسهم، فالقسم بارتفاع شاشة واحدة لا أكثر.
 *
 * دون 860 بكسل: العرض نفسه بلوحة واحدة بعرض الشاشة، مع الأزرار والنقاط
 * وإمكانية السحب باللمس.
 */
export function HistoryJourney({ milestones }: HistoryJourneyProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [span, setSpan] = useState(1);
  const staged = useRef(new Set<number>());
  const touchX = useRef<number | null>(null);
  const mobile = useMediaQuery("(max-width: 860px)");
  const count = milestones.length;
  const current = milestones[Math.min(idx, count - 1)];
  const tint = current?.bg ?? "#2563EB";
  const light = isLight(tint);

  const go = (next: number) => setIdx((i) => clamp(next, 0, count - 1));
  const prev = () => go(idx - 1);
  const next = () => go(idx + 1);

  // المحطة الأولى تُعرض عند تغيّر المحتوى (تحرير المشرف) بلا بقايا حالة سابقة
  useEffect(() => {
    setIdx(0);
    staged.current = new Set();
  }, [milestones]);

  // قياس موضع كل لوحة: الإزاحة التي تجعلها في وسط الشاشة
  useEffect(() => {
    if (mobile) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const W = window.innerWidth;
      const saved = track.style.transition;
      track.style.transition = "none";
      track.style.transform = "translate3d(0,0,0)";
      const len = Math.max(1, track.scrollWidth - W);
      const rect = track.getBoundingClientRect();
      const offs = Array.from(track.children).map((child) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        return clamp(rect.right - (r.left + r.width / 2) - W / 2, 0, len);
      });
      setSpan(len);
      setOffsets(offs);
      requestAnimationFrame(() => {
        track.style.transition = saved;
      });
    };
    const timer = window.setTimeout(measure, 320);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [milestones, mobile]);

  // تحريك الشريط إلى اللوحة الحالية + تشغيل حركة الوصول أول مرة تظهر فيها
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!mobile) {
      const x = offsets[idx] ?? 0;
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    const panel = track.children[idx] as HTMLElement | undefined;
    if (panel && !staged.current.has(idx)) {
      staged.current.add(idx);
      arrive(panel);
    }
  }, [idx, offsets, mobile]);

  // الأسهم: في الاتجاه من اليمين لليسار، السهم الأيسر يتقدم والأيمن يرجع
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progress = span > 1 ? (offsets[idx] ?? 0) / span : 0;
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) < 45) return;
      // سحب لليسار = المحطة التالية (الشريط يسير من اليمين لليسار)
      if (dx < 0) next();
      else prev();
    },
  };

  const controls = (
    <>
      <NavArrow side="left" dir="next" onClick={next} disabled={idx >= count - 1} light={light} mobile={mobile} />
      <NavArrow side="right" dir="prev" onClick={prev} disabled={idx <= 0} light={light} mobile={mobile} />
    </>
  );

  if (mobile) {
    return (
      <section data-screen-label="Our History" className="relative overflow-hidden" {...swipe}>
        <div
          ref={trackRef}
          className="flex"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(${(idx * 100) / count}%)`,
            transition: "transform .55s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {milestones.map((m) => (
            <div key={m.year || "intro"} style={{ width: `${100 / count}%`, flex: "0 0 auto" }}>
              <MobilePanel milestone={m} />
            </div>
          ))}
        </div>
        {controls}
        <Dots count={count} idx={idx} onPick={go} light={light} />
      </section>
    );
  }

  return (
    <section data-screen-label="Our History" className="relative" style={{ height: "100svh" }}>
      <div
        className="relative h-full overflow-hidden"
        style={
          {
            backgroundColor: tint,
            transition: "background-color .6s ease",
            // اللوحات تذيب حوافها في هذا اللون فتتبع الخلفية لا لوناً ثابتاً
            "--tint": tint,
          } as React.CSSProperties
        }
        {...swipe}
      >
        {/* شبكة خفيفة مقنّعة نحو الوسط فتبقى الحواف نظيفة */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(85% 70% at 50% 45%,#000,transparent 80%)",
            WebkitMaskImage: "radial-gradient(85% 70% at 50% 45%,#000,transparent 80%)",
          }}
        />
        <div
          ref={trackRef}
          className="flex h-full w-max"
          style={{ willChange: "transform", transition: "transform .7s cubic-bezier(.22,1,.36,1)" }}
        >
          {milestones.map((m) => (
            <Panel key={m.year || "intro"} milestone={m} />
          ))}
        </div>

        {/* حافتا القسم تذوبان في لون الخلفية فلا تظهر اللوحة المجاورة مقطوعة */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 right-0 z-[5]"
          style={{
            background:
              "linear-gradient(to right,var(--tint) 0%,color-mix(in srgb, var(--tint) 65%, transparent) 4%,transparent 11%),linear-gradient(to left,var(--tint) 0%,color-mix(in srgb, var(--tint) 65%, transparent) 4%,transparent 11%)",
          }}
        />

        {controls}

        {/* المسطرة: علامات السنوات قابلة للنقر ومؤشر يتحرك مع المحطة الحالية */}
        <div className="absolute bottom-[22px] right-1/2 z-10 translate-x-1/2" style={{ width: "calc(100% - 160px)" }}>
          <div className="relative h-[46px]">
            <div className="absolute inset-x-0 bottom-0 flex h-[14px] items-end justify-between">
              {Array.from({ length: 70 }, (_, i) => {
                const major = i % 7 === 0;
                return (
                  <div
                    key={i}
                    style={{
                      width: 1,
                      height: major ? 14 : 7,
                      background: light
                        ? `rgba(15,31,61,${major ? ".45" : ".18"})`
                        : `rgba(255,255,255,${major ? ".4" : ".16"})`,
                    }}
                  />
                );
              })}
            </div>
            <div
              className="absolute inset-x-0 bottom-0 h-px"
              style={{ background: light ? "rgba(15,31,61,.25)" : "rgba(255,255,255,.2)" }}
            />
            <div
              className="absolute -bottom-[3px] h-[22px] w-[2.5px] rounded-sm"
              style={{
                right: `calc(${progress * 100}% - 1px)`,
                background: light ? "#2563EB" : "#fff",
                boxShadow: light ? "0 0 10px rgba(37,99,235,.7)" : "0 0 10px rgba(255,255,255,.8)",
                transition: "right .7s cubic-bezier(.22,1,.36,1),background .4s",
              }}
            />
            {milestones.map((m, i) => {
              if (!m.year) return null;
              const f = span > 1 ? (offsets[i] ?? 0) / span : 0;
              const on = i === idx;
              return (
                <button
                  key={m.year}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`الانتقال إلى ${m.year}`}
                  className="absolute bottom-5 cursor-pointer border-none bg-transparent px-[6px] py-1 text-xs font-extrabold"
                  style={{
                    right: `${f * 100}%`,
                    direction: "ltr",
                    transform: `translateX(50%) scale(${on ? 1.35 : 1})`,
                    color: on ? (light ? "#2563EB" : "#fff") : light ? "rgba(15,31,61,.55)" : "rgba(255,255,255,.6)",
                    textShadow: on && !light ? "0 0 12px rgba(255,255,255,.7)" : "none",
                    transition: "color .4s,transform .5s cubic-bezier(.22,1,.36,1),text-shadow .4s,right .7s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {m.year}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** لون فاتح؟ (لاختيار لون الأزرار والمسطرة فوقه) */
function isLight(colour: string): boolean {
  if (!colour.startsWith("#") || colour.length < 7) return false;
  const [r, g, b] = hexToRgb(colour);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

/** زر التنقل — دائرة زجاجية على حافة القسم */
function NavArrow({
  side,
  dir,
  onClick,
  disabled,
  light,
  mobile,
}: {
  side: "left" | "right";
  dir: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
  light: boolean;
  mobile: boolean;
}) {
  const size = mobile ? 40 : 52;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "next" ? "المحطة التالية" : "المحطة السابقة"}
      data-carousel={dir}
      className="absolute z-20 flex items-center justify-center rounded-full"
      style={{
        [side]: mobile ? 10 : 22,
        top: mobile ? "38%" : "50%",
        transform: "translateY(-50%)",
        width: size,
        height: size,
        border: `1px solid ${light ? "rgba(15,31,61,.18)" : "rgba(255,255,255,.45)"}`,
        background: light ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.16)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: light ? "#0F1F3D" : "#fff",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "opacity .3s,background .3s,border-color .3s",
      }}
    >
      <svg
        width={mobile ? 18 : 22}
        height={mobile ? 18 : 22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

/** نقاط المحطات — للجوال */
function Dots({ count, idx, onPick, light }: { count: number; idx: number; onPick: (i: number) => void; light: boolean }) {
  return (
    <div className="absolute bottom-[18px] left-0 right-0 z-20 flex items-center justify-center gap-[7px]">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={`المحطة ${i + 1}`}
          className="cursor-pointer rounded-full border-none p-0"
          style={{
            width: i === idx ? 20 : 7,
            height: 7,
            background: i === idx ? (light ? "#2563EB" : "#fff") : light ? "rgba(15,31,61,.3)" : "rgba(255,255,255,.45)",
            transition: "width .35s cubic-bezier(.22,1,.36,1),background .3s",
          }}
        />
      ))}
    </div>
  );
}

/**
 * أول ظهور للوحة: السنة تُعدّ تصاعدياً مع استقرار تباعد الحروف، والصورة
 * تصل ساطعة قليلاً ثم تستقر — القطع السينمائي في التصميم.
 */
function arrive(panel: HTMLElement) {
  const num = panel.querySelector<HTMLElement>("[data-num]");
  if (num && !num.dataset.rolled) {
    num.dataset.rolled = "1";
    const target = parseInt(num.textContent ?? "", 10);
    if (target) {
      num.style.transition = "letter-spacing 1.1s cubic-bezier(.22,1,.36,1)";
      num.style.letterSpacing = ".18em";
      const from = target - 14;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1100);
        const e = 1 - Math.pow(1 - p, 4);
        num.textContent = String(Math.round(from + (target - from) * e));
        if (p < 1) requestAnimationFrame(tick);
        else num.style.letterSpacing = "0";
      };
      requestAnimationFrame(tick);
    }
  }
  const img = panel.querySelector<HTMLImageElement>("[data-inner] img");
  if (img) {
    img.style.opacity = "0";
    img.style.filter = "brightness(1.3) saturate(1.2)";
    img.style.transition = "filter 1.4s cubic-bezier(.22,1,.36,1),opacity 1.2s ease";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        img.style.filter = "brightness(1) saturate(1)";
        img.style.opacity = "1";
      })
    );
  }
}

/* -------------------------------------------------------------------------- */

function Panel({ milestone }: { milestone: SiteHistoryMilestone }) {
  const { layout, width, image, year, title, eyebrow } = milestone;

  const base = {
    width: `${width}vw`,
    flex: "0 0 auto" as const,
    height: "100%",
  };

  if (layout === "intro") {
    return (
      <div
        className="relative flex items-center"
        style={{ ...base, padding: "0 7vw" }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to left,#000 86%,transparent 98%)",
            WebkitMaskImage:
              "linear-gradient(to left,#000 86%,transparent 98%)",
          }}
        >
          <div data-inner className="absolute inset-0 will-change-transform">
            <img
              src={asset(image)}
              alt=""
              className="absolute inset-y-0 block h-full object-cover"
              style={{ left: -110,
                  maxWidth: "none", width: "calc(100% + 220px)" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-white/[.18]" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right,rgba(8,31,84,0) 55%,rgba(8,31,84,.55) 85%,rgba(8,31,84,.75) 100%)",
              }}
            />
          </div>
        </div>
        <div className="relative z-[2] max-w-[640px] text-white">
          <div
            className="mb-[14px] font-extrabold text-white/85"
            style={{ fontSize: "clamp(15px,1.6vw,19px)" }}
          >
            {eyebrow}
          </div>
          <h2
            className="m-0 text-white"
            style={{
              fontSize: "clamp(40px,6vw,88px)",
              fontWeight: 500,
              lineHeight: 1.15,
              textShadow: "0 6px 40px rgba(4,16,42,.5)",
            }}
          >
            {title}
          </h2>
        </div>
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div
        className="relative flex items-center"
        style={{ ...base, padding: "0 5vw" }}
      >
        <div
          className="relative grid w-full items-center"
          style={{ gridTemplateColumns: "1.35fr 1fr", gap: "4vw" }}
        >
          <div
            className="relative h-screen overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right,transparent 2%,rgba(0,0,0,.35) 10%,#000 24%,#000 76%,rgba(0,0,0,.35) 90%,transparent 98%)",
              WebkitMaskImage:
                "linear-gradient(to right,transparent 2%,rgba(0,0,0,.35) 10%,#000 24%,#000 76%,rgba(0,0,0,.35) 90%,transparent 98%)",
            }}
          >
            <div data-inner className="absolute inset-0 will-change-transform">
              <img
                src={asset(image)}
                alt=""
                className="absolute inset-y-0 block h-full object-cover"
                style={{
                  left: -110,
                  maxWidth: "none",
                  width: "calc(100% + 220px)",
                  objectPosition: "center 30%",
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[rgba(214,231,252,.28)]" />
            </div>
            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  "linear-gradient(to right,var(--tint) 0%,color-mix(in srgb, var(--tint) 55%, transparent) 30%,transparent 62%)",
              }}
            />
          </div>
          <div className="relative z-[2]" style={{ left: "-3vw" }}>
            <Year value={year} colour="#1B3A8C" />
            <h3
              className="mt-[14px] mb-0 text-[#0F1F3D]"
              style={{
                fontSize: "clamp(26px,3vw,42px)",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "bottom-center") {
    return (
      <div className="relative flex items-center" style={base}>
        <div className="absolute inset-0 overflow-hidden bg-white">
          <div data-inner className="absolute inset-0 will-change-transform">
            <img
              src={asset(image)}
              alt=""
              aria-hidden
              className="absolute inset-0 block h-full w-full object-cover"
              style={{ filter: "blur(30px)", transform: "scale(1.12)" }}
            />
            <img
              src={asset(image)}
              alt=""
              className="absolute inset-0 block h-full w-full object-contain"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(0deg,rgba(255,255,255,.94) 0%,rgba(255,255,255,.6) 14%,rgba(255,255,255,0) 34%)",
              }}
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to right,var(--tint) 0%,color-mix(in srgb, var(--tint) 50%, transparent) 7%,transparent 20%),linear-gradient(to left,var(--tint) 0%,color-mix(in srgb, var(--tint) 50%, transparent) 7%,transparent 20%)",
          }}
        />
        <div className="relative z-[2] flex w-full items-end justify-center self-end px-[6vw] pb-[6vh]">
          <div>
            <Year value={year} colour="#2563EB" align="center" size="sm" />
            <h3
              className="mx-auto mt-[14px] mb-0 max-w-[400px] text-center text-[#0F1F3D]"
              style={{
                fontSize: "clamp(24px,2.6vw,36px)",
                fontWeight: 500,
                lineHeight: 1.8,
                textWrap: "balance",
              }}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "final") {
    return (
      <div className="relative flex items-center text-white" style={base}>
        <div
          data-ghost
          className="pointer-events-none absolute top-[6vh] right-[2vw] will-change-transform"
          style={{
            fontSize: "clamp(140px,22vw,320px)",
            fontWeight: 900,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,.3)",
            direction: "ltr",
          }}
        >
          {year}
        </div>
        <div
          className="relative grid w-full items-center"
          style={{ gridTemplateColumns: "2fr 1fr" }}
        >
          <div
            className="relative h-screen self-center overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right,transparent 1%,#000 12%,#000 72%,transparent 97%)",
              WebkitMaskImage:
                "linear-gradient(to right,transparent 1%,#000 12%,#000 72%,transparent 97%)",
            }}
          >
            <div data-inner className="absolute inset-0 will-change-transform">
              <img
                src={asset(image)}
                alt=""
                className="absolute inset-y-0 block h-full object-cover"
                style={{ left: -110,
                  maxWidth: "none", right: -110, width: "calc(100% + 220px)" }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: "#2563EB30" }}
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  "linear-gradient(to right,var(--tint) 0%,color-mix(in srgb, var(--tint) 50%, transparent) 18%,transparent 42%)",
              }}
            />
          </div>
          <div className="relative z-[2] px-[4vw]">
            <Year value={year} colour="#fff" />
            <h3
              className="mt-[14px] mb-0"
              style={{
                fontSize: "clamp(26px,3vw,42px)",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // layout === "bottom-start"
  return (
    <div className="relative flex items-center text-white" style={base}>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right,transparent 2%,#000 14%,#000 55%,transparent 92%)",
          WebkitMaskImage:
            "linear-gradient(to right,transparent 2%,#000 14%,#000 55%,transparent 92%)",
        }}
      >
        <div data-inner className="absolute inset-0 will-change-transform">
          <img
            src={asset(image)}
            alt=""
            className="absolute inset-y-0 block h-full object-cover"
            style={{
              left: -110,
                  maxWidth: "none",
              right: -110,
              width: "calc(100% + 220px)",
              objectPosition: "center 30%",
              filter: "saturate(.7)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[rgba(37,99,235,.3)]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(to left,var(--tint) 0%,color-mix(in srgb, var(--tint) 55%, transparent) 22%,transparent 48%)",
          }}
        />
      </div>
      <div className="relative z-[2] flex w-full items-end justify-start self-end px-[6vw] pb-[9vh]">
        <div className="text-right">
          <Year value={year} colour="#fff" size="lg" />
          <h3
            className="mt-[10px] mb-0"
            style={{
              fontSize: "clamp(28px,3.4vw,48px)",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function Year({
  value,
  colour,
  align = "right",
  size = "md",
}: {
  value: string;
  colour: string;
  align?: "right" | "center";
  size?: "sm" | "md" | "lg";
}) {
  const fontSize =
    size === "lg"
      ? "clamp(64px,8.5vw,130px)"
      : size === "sm"
        ? "clamp(48px,5.6vw,84px)"
        : "clamp(56px,7vw,104px)";
  return (
    <div
      data-num
      className="will-change-transform"
      style={{
        fontSize,
        fontWeight: 900,
        lineHeight: 1,
        color: colour,
        direction: "ltr",
        textAlign: align,
      }}
    >
      {value}
    </div>
  );
}

/** Stacked variant used below 860px. */
function MobilePanel({ milestone }: { milestone: SiteHistoryMilestone }) {
  const intro = milestone.layout === "intro";
  const lightPanel = milestone.bg === "#FFFFFF" || milestone.bg === "#EFEDE8";
  const wideShot = milestone.layout === "bottom-center";
  return (
    <div
      className="relative px-[22px] py-14"
      style={{ background: milestone.bg }}
    >
      <div
        className="relative mb-6 overflow-hidden"
        style={{
          // A 4:3 window loses far less of a landscape frame than the taller
          // box the prototype used, and every photo declares the point that
          // has to survive the crop.
          aspectRatio: "4 / 3",
          background: wideShot ? "#F2F4F7" : undefined,
        }}
      >
        <img
          src={asset(milestone.image)}
          alt=""
          className="absolute inset-0 block h-full w-full"
          style={{
            // The 2017 hall photograph puts its subjects at both far edges,
            // so any crop loses one of them — show the whole frame instead.
            objectFit: wideShot ? "contain" : "cover",
            objectPosition: milestone.focus ?? "50% 50%",
          }}
        />
      </div>
      {intro ? (
        <>
          <div className="mb-3 text-[15px] font-extrabold text-white/85">
            {milestone.eyebrow}
          </div>
          <h2 className="m-0 text-[40px] font-medium leading-[1.15] text-white">
            {milestone.title}
          </h2>
        </>
      ) : (
        <>
          <div
            className="text-[56px] font-black leading-none"
            style={{
              direction: "ltr",
              textAlign: "right",
              color: lightPanel ? "#1B3A8C" : "#fff",
            }}
          >
            {milestone.year}
          </div>
          <h3
            className="mt-3 mb-0 text-[26px] font-medium leading-[1.5]"
            style={{ color: lightPanel ? "#0F1F3D" : "#fff" }}
          >
            {milestone.title}
          </h3>
        </>
      )}
    </div>
  );
}
