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
 * "مسيرة التحول" — the milestones scroll sideways while the page scrolls down.
 * The section is a tall scroll track with a sticky viewport; the filmstrip
 * inside translates by the scrolled fraction and the viewport background
 * cross-fades to whichever panel is centred.
 *
 * Below 860px the whole thing degrades to a plain vertical stack: no sticky
 * hijack, no ruler, each panel simply full width.
 */
export function HistoryJourney({ milestones }: HistoryJourneyProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [trackHeight, setTrackHeight] = useState<number | null>(null);
  const [tint, setTint] = useState(milestones[0]?.bg ?? "#2563EB");
  const [light, setLight] = useState(false);
  const scrollLen = useRef(1);
  const fracs = useRef<number[]>([]);
  const smooth = useRef(0);
  const mobile = useMediaQuery("(max-width: 860px)");

  useEffect(() => {
    if (mobile) {
      setTrackHeight(null);
      return;
    }
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    let raf = 0;
    let lastT = performance.now();

    const measure = () => {
      const W = window.innerWidth;
      const VH = window.innerHeight;
      track.style.transform = "translate3d(0,0,0)";
      scrollLen.current = Math.max(1, track.scrollWidth - W);
      setTrackHeight(scrollLen.current * 1.35 + VH);
      const trackRect = track.getBoundingClientRect();
      fracs.current = Array.from(track.children).map(child => {
        const r = (child as HTMLElement).getBoundingClientRect();
        const off = trackRect.right - (r.left + r.width / 2) - W / 2;
        return clamp(off / scrollLen.current, 0, 1);
      });
    };

    const timer = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);

    const panelColours = milestones.map(m => hexToRgb(m.bg));
    const staged = new Set<number>();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(50, now - lastT);
      lastT = now;

      const y = window.scrollY;
      const target = clamp(
        (y - wrap.offsetTop) / (scrollLen.current * 1.35),
        0,
        1
      );
      // Time-based exponential smoothing: frame-rate independent, no jitter on
      // a fast flick.
      const k = 1 - Math.exp(-dt / 180);
      smooth.current += (target - smooth.current) * k;
      if (Math.abs(target - smooth.current) < 0.00015) smooth.current = target;

      const dpr = window.devicePixelRatio || 1;
      const x = Math.round(smooth.current * scrollLen.current * dpr) / dpr;
      track.style.transform = `translate3d(${x}px,0,0)`;
      setProgress(smooth.current);

      const W = window.innerWidth;

      // Photos drift against the filmstrip and breathe from a slight zoom to
      // rest as their panel centres — the counter-movement is what lets one
      // image hand over to the next instead of hard-cutting at the mask edge.
      // Year numbers and the 2026 ghost outline drift on their own rates.
      Array.from(track.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.right < -W * 0.3 || rect.left > W * 1.3) return;
        const t = (rect.left + rect.width / 2 - W / 2) / W;
        const vis = clamp(1 - Math.abs(t) * 1.15, 0, 1);
        const inner = el.querySelector<HTMLElement>("[data-inner]");
        if (inner) {
          // الإزاحة محدودة بـ ±1 لوحة: أبعد من ذلك كانت تتجاوز هامش الصورة
          // الزائد فتظهر حافة الصورة خطاً عمودياً صريحاً وسط التدرج
          const ti = clamp(t, -1, 1);
          inner.style.transform = `translate3d(${(ti * 30).toFixed(2)}px,0,0) scale(${(1.06 - vis * 0.06).toFixed(4)})`;
        }
        const num = el.querySelector<HTMLElement>("[data-num]");
        if (num) {
          num.style.transform = `translate3d(${(t * W * 0.05).toFixed(1)}px,${(Math.abs(t) * 18).toFixed(1)}px,0)`;
        }
        const ghost = el.querySelector<HTMLElement>("[data-ghost]");
        if (ghost) {
          ghost.style.transform = `translate3d(${(t * W * 0.16).toFixed(1)}px,${(t * -34).toFixed(1)}px,0)`;
          ghost.style.opacity = String(clamp(1 - Math.abs(t) * 1.3, 0, 1));
        }
        if (vis > 0.35 && !staged.has(i)) {
          staged.add(i);
          arrive(el);
        }
      });

      // Blend the panel background colours weighted by how centred each one is.
      let r = 0;
      let g = 0;
      let b = 0;
      let total = 0;
      Array.from(track.children).forEach((child, i) => {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const t = (rect.left + rect.width / 2 - W / 2) / W;
        const w = Math.pow(clamp(1 - Math.abs(t), 0, 1), 5);
        if (w <= 0) return;
        r += panelColours[i][0] * w;
        g += panelColours[i][1] * w;
        b += panelColours[i][2] * w;
        total += w;
      });
      if (total > 0) {
        const cr = Math.round(r / total);
        const cg = Math.round(g / total);
        const cb = Math.round(b / total);
        setTint(`rgb(${cr},${cg},${cb})`);
        setLight((0.299 * cr + 0.587 * cg + 0.114 * cb) / 255 > 0.55);
      }
    };
    loop();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [milestones, mobile]);

  /**
   * First time a panel reaches centre stage: its year counts up while the
   * letter-spacing settles, and the photograph arrives bright and slightly
   * washed before settling to its final grade — the design's cinematic cut.
   */
  const arrive = (panel: HTMLElement) => {
    const num = panel.querySelector<HTMLElement>("[data-num]");
    if (!num || num.dataset.rolled) return;
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
    const img = panel.querySelector<HTMLImageElement>("[data-inner] img");
    if (img) {
      img.style.opacity = "0";
      img.style.filter = "brightness(1.3) saturate(1.2)";
      img.style.transition =
        "filter 1.4s cubic-bezier(.22,1,.36,1),opacity 1.2s ease";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          img.style.filter = "brightness(1) saturate(1)";
          img.style.opacity = "1";
        })
      );
    }
  };

  const jumpTo = (year: string) => {
    const idx = milestones.findIndex(m => m.year === year);
    const wrap = wrapRef.current;
    if (idx < 0 || !wrap) return;
    if (mobile) {
      wrap.children[0]?.children[idx]?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo({
      top:
        wrap.offsetTop + (fracs.current[idx] ?? 0) * scrollLen.current * 1.35,
      behavior: "smooth",
    });
  };

  if (mobile) {
    return (
      <section
        ref={wrapRef}
        data-screen-label="Our History"
        className="relative"
      >
        <div className="flex flex-col">
          {milestones.map(m => (
            <MobilePanel key={m.year || "intro"} milestone={m} />
          ))}
        </div>
      </section>
    );
  }

  const inJourney = progress > 0.001 && progress < 0.999;

  return (
    <section
      ref={wrapRef}
      data-screen-label="Our History"
      className="relative"
      style={{ height: trackHeight ?? "640vh" }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={
          {
            backgroundColor: tint,
            // Panels dissolve their edges into this, so seams track the
            // blended backdrop instead of a fixed navy.
            "--tint": tint,
          } as React.CSSProperties
        }
      >
        {/* faint grid, masked to the centre so the edges stay clean */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(85% 70% at 50% 45%,#000,transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(85% 70% at 50% 45%,#000,transparent 80%)",
          }}
        />
        <div
          ref={trackRef}
          className="flex h-full w-max"
          style={{ willChange: "transform" }}
        >
          {milestones.map(m => (
            <Panel key={m.year || "intro"} milestone={m} />
          ))}
        </div>

        {/* Ruler: ticks, a travelling cursor and clickable year marks. */}
        <div
          className="absolute bottom-[22px] right-1/2 z-10 translate-x-1/2"
          style={{
            width: "calc(100% - 56px)",
            opacity: inJourney ? 1 : 0,
            transition: "opacity .4s",
          }}
        >
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
              style={{
                background: light
                  ? "rgba(15,31,61,.25)"
                  : "rgba(255,255,255,.2)",
              }}
            />
            <div
              className="absolute -bottom-[3px] h-[22px] w-[2.5px] rounded-sm"
              style={{
                right: `calc(${progress * 100}% - 1px)`,
                background: light ? "#2563EB" : "#fff",
                boxShadow: light
                  ? "0 0 10px rgba(37,99,235,.7)"
                  : "0 0 10px rgba(255,255,255,.8)",
              }}
            />
            {/* علامات السنوات على المسطرة تُشتق من المحطات (تتبع تحرير المشرف) */}
            {milestones.filter(m => m.year).map(m => m.year).map(year => {
              const idx = milestones.findIndex(m => m.year === year);
              const f = fracs.current[idx] ?? 0;
              const on = Math.abs(f - progress) < 0.06;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => jumpTo(year)}
                  className="absolute bottom-5 cursor-pointer border-none bg-transparent px-[6px] py-1 text-xs font-extrabold"
                  style={{
                    right: `${f * 100}%`,
                    direction: "ltr",
                    transform: `translateX(50%) scale(${on ? 1.35 : 1})`,
                    color: on
                      ? light
                        ? "#2563EB"
                        : "#fff"
                      : light
                        ? "rgba(15,31,61,.55)"
                        : "rgba(255,255,255,.6)",
                    textShadow:
                      on && !light ? "0 0 12px rgba(255,255,255,.7)" : "none",
                    transition:
                      "color .4s,transform .5s cubic-bezier(.22,1,.36,1),text-shadow .4s",
                  }}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
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
