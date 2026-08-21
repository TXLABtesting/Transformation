'use client';
import { useMemo, useState } from "react";
import type { SitePhase } from "@/lib/site";
import { useMediaQuery } from "./hooks";

interface PhaseTimelineProps {
  phases: SitePhase[];
}

/** Marker line geometry, in the SVG's 1440×560 user space (RTL: right → left). */
const LX0 = 1330;
const LX1 = 110;
const LY = 470;

/** Background colour stops the section walks through as phases advance. */
const STOPS: [number, number, number][] = [
  [169, 201, 251],
  [127, 177, 255],
  [80, 135, 242],
  [43, 92, 208],
  [18, 58, 155],
  [8, 31, 84],
];

function mixStops(p: number) {
  const sp = p * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(sp));
  const f = sp - i;
  return STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f)) as [
    number,
    number,
    number,
  ];
}

/**
 * "البرنامج الزمني للتنفيذ" — the eight implementation phases laid out on a
 * horizontal rail. Stepping through them walks the section background from
 * pale blue to deep navy; once it is light enough the ink flips to dark so the
 * copy stays readable.
 */
export function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const [index, setIndex] = useState(0);
  const phone = useMediaQuery("(max-width: 760px)");
  const compact = useMediaQuery("(max-width: 1040px)");
  const n = phases.length;

  const size = phone
    ? { r: 10, rOn: 15, font: 84, ty: 96, dot: 15, ln: 6, pg: 10 }
    : { r: 5, rOn: 7, font: 44, ty: 66, dot: 8, ln: 2, pg: 3 };

  const progress = n > 1 ? index / (n - 1) : 0;
  const dotX = LX0 + (LX1 - LX0) * progress;

  const { mix, dark } = useMemo(() => {
    const m = mixStops(progress);
    const lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
    return { mix: m, dark: lum > 0.55 };
  }, [progress]);

  const go = (i: number) => setIndex(Math.max(0, Math.min(n - 1, i)));

  return (
    <section
      dir="rtl"
      className="relative"
      style={{
        background:
          "linear-gradient(180deg,#A6E4FB 0%,#5ED2FA 16%,#01BDF9 34%,#018AFB 52%,#0062FD 68%,#03276B 100%)",
      }}
    >
      {/* Blend the top edge into the light section above it. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[300px]"
        style={{
          background:
            "linear-gradient(180deg,#F4F7FB 0%,rgba(244,247,251,.92) 14%,rgba(232,241,253,.68) 34%,rgba(214,231,252,.4) 56%,rgba(196,222,252,.18) 78%,rgba(190,218,252,0) 100%)",
        }}
      />

      <div className="relative h-screen overflow-hidden text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: `rgb(${mix.join(",")})`,
            opacity: Math.min(1, progress * 5),
          }}
        />
        {/* Ambient glow blobs. */}
        <div
          className="pointer-events-none absolute -top-[30%] -right-[12%] h-[900px] w-[900px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(127,212,247,.28),transparent 62%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-[35%] -left-[14%] h-[1000px] w-[1000px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(2,38,105,.45),transparent 65%)",
            filter: "blur(46px)",
          }}
        />

        <div
          className="absolute z-[2] text-right transition-colors"
          style={{
            top: "clamp(160px,22vh,230px)",
            right: "clamp(20px,5vw,60px)",
            color: dark ? "#0F1F3D" : "#fff",
          }}
        >
          <h2
            className="m-0 font-medium"
            style={{ fontSize: "clamp(22px,2.4vw,32px)" }}
          >
            البرنامج الزمني للتنفيذ
          </h2>
        </div>

        <div
          className="absolute inset-x-0 z-[2]"
          style={{
            top: "max(32%,clamp(220px,30vh,300px))",
            bottom: "max(30vh,180px)",
          }}
        >
          {phases.map((ph, i) => {
            const on = i === index;
            return (
              <div
                key={ph.phase}
                className="absolute inset-0 flex flex-col items-center justify-start text-center"
                style={{
                  gap: "clamp(8px,1.4vh,14px)",
                  padding: "0 clamp(18px,5vw,40px)",
                  color: dark ? "#0F1F3D" : "#fff",
                  opacity: on ? 1 : 0,
                  transform: on
                    ? "none"
                    : `translateY(${i < index ? -24 : 24}px)`,
                  // Outgoing panels leave fast; the incoming one waits for the
                  // stage to clear, then rises in.
                  transition: on
                    ? "opacity .5s cubic-bezier(.22,1,.36,1) .24s,transform .5s cubic-bezier(.22,1,.36,1) .24s"
                    : "opacity .2s ease,transform .2s ease",
                }}
              >
                <div
                  className="flex items-center gap-[14px] text-[17px] font-extrabold tracking-[2px] transition-colors"
                  style={{ color: dark ? "#1D4FB8" : "#9EC5FF" }}
                >
                  {ph.phase}
                </div>
                <div
                  className="font-normal leading-[1.25]"
                  style={{
                    fontSize: "clamp(24px,min(6vw,5.2vh),56px)",
                    marginBottom: "clamp(4px,1.2vh,14px)",
                  }}
                >
                  {ph.title}
                </div>
                <div className="flex flex-wrap justify-center gap-[10px]">
                  <span
                    className="rounded-full px-5 py-[6px] text-[13.5px] font-extrabold transition-colors"
                    style={{ color: dark ? "#0F1F3D" : "#fff" }}
                  >
                    {ph.range}
                  </span>
                </div>
                <div
                  className="max-w-[560px] font-semibold leading-[1.9] transition-colors"
                  style={{
                    fontSize: "clamp(12.5px,min(3.4vw,2vh),15.5px)",
                    color: dark ? "#1F3D77" : "#D6E6FF",
                  }}
                >
                  {ph.desc}
                </div>
              </div>
            );
          })}
        </div>

        <svg
          viewBox="0 0 1440 560"
          preserveAspectRatio={compact ? "xMidYMax meet" : "xMidYMax slice"}
          className="absolute inset-x-0 bottom-0 h-[56vh] w-full overflow-visible"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.25) 12%,rgba(0,0,0,.7) 26%,#000 42%)",
            maskImage:
              "linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.25) 12%,rgba(0,0,0,.7) 26%,#000 42%)",
          }}
        >
          <line
            x1={LX0}
            y1={LY}
            x2={LX1}
            y2={LY}
            stroke={dark ? "rgba(15,31,61,.3)" : "rgba(255,255,255,.22)"}
            strokeWidth={size.ln}
          />
          <path
            d={`M ${LX0} ${LY} L ${dotX} ${LY}`}
            fill="none"
            stroke={dark ? "#2563EB" : "rgba(191,227,255,.95)"}
            strokeWidth={size.pg}
            strokeLinecap="round"
          />
          {phases.map((ph, i) => {
            const f = n > 1 ? i / (n - 1) : 0;
            const x = LX0 + (LX1 - LX0) * f;
            const on = i === index;
            const done = f <= progress + 0.001;
            const fill = on
              ? dark
                ? "#1D4FB8"
                : "#FFFFFF"
              : done
                ? dark
                  ? "rgba(29,79,184,.85)"
                  : "rgba(191,227,255,.9)"
                : dark
                  ? "rgba(15,31,61,.4)"
                  : "rgba(255,255,255,.45)";
            return (
              <g
                key={ph.phase}
                onClick={() => go(i)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={LY} r={on ? size.rOn : size.r} fill={fill} />
                <text
                  x={x}
                  y={LY - size.ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={
                    on
                      ? dark
                        ? "#0F1F3D"
                        : "#FFFFFF"
                      : dark
                        ? "rgba(15,31,61,.55)"
                        : "rgba(255,255,255,.6)"
                  }
                  style={{ font: `600 ${size.font}px var(--font-cairo), Cairo, sans-serif` }}
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}
          <circle
            cx={dotX}
            cy={LY}
            r={size.dot}
            fill={dark ? "#2563EB" : "#fff"}
            style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,.95))" }}
          />
        </svg>

        <div
          className="absolute right-1/2 z-[8] flex translate-x-1/2 gap-[10px]"
          style={{ bottom: compact ? 110 : 26 }}
        >
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="السابق"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white transition-colors hover:bg-white/25"
            style={{ visibility: index <= 0 ? "hidden" : "visible" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="التالي"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-white/45 bg-white/10 text-white transition-colors hover:bg-white/25"
            style={{ visibility: index >= n - 1 ? "hidden" : "visible" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
