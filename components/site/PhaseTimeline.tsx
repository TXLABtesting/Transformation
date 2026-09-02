'use client';
import type { SitePhase } from "@/lib/site";

interface PhaseTimelineProps {
  phases: SitePhase[];
}

/** Fixed row heights so the rail line stays aligned with the dots even when a
 *  title wraps to a second line. */
const NUM_H = "clamp(34px,4.6vw,58px)";
const TITLE_H = "clamp(44px,5.4vw,58px)";
const DOT_ROW = 28;

/**
 * "البرنامج الزمني للتنفيذ" — the eight implementation phases laid out
 * statically on one horizontal rail: number, then title, then the dot on the
 * line, then the date range. No stepping, no arrows — everything visible.
 */
export function PhaseTimeline({ phases }: PhaseTimelineProps) {
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

        {/* Section title + the small descriptive line under it. */}
        <div
          className="absolute z-[4] text-right"
          style={{
            top: "clamp(160px,22vh,230px)",
            right: "clamp(20px,5vw,60px)",
            color: "#0F1F3D",
          }}
        >
          <h2
            className="m-0 font-medium"
            style={{ fontSize: "clamp(22px,2.4vw,32px)" }}
          >
            البرنامج الزمني للتنفيذ
          </h2>
          <div
            className="mt-2 font-semibold"
            style={{
              fontSize: "clamp(12.5px,1.3vw,15px)",
              color: "#1F3D77",
              maxWidth: 520,
            }}
          >
            ينقسم المشروع إلى المراحل التنفيذية الثماني التالية
          </div>
        </div>

        {/* The rail: one column per phase — number, title, dot, date range. */}
        <div
          className="absolute inset-x-0 z-[2] overflow-x-auto"
          style={{ top: "max(46%,clamp(280px,40vh,380px))", padding: "0 clamp(14px,3vw,48px)" }}
        >
          <div className="relative mx-auto" style={{ minWidth: 1240, maxWidth: 1360 }}>
            {/* the continuous line, aligned with the dots row */}
            <div
              className="absolute inset-x-[4%]"
              style={{
                top: `calc(${NUM_H} + ${TITLE_H} + ${DOT_ROW / 2}px - 1px)`,
                height: 2,
                background: "rgba(255,255,255,.28)",
              }}
            />
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${phases.length || 8},minmax(150px,1fr))` }}
            >
              {phases.map((ph, i) => (
                <div key={ph.phase} className="flex flex-col items-center text-center">
                  <div
                    className="flex items-end justify-center font-semibold"
                    style={{
                      height: NUM_H,
                      fontSize: "clamp(26px,3.4vw,46px)",
                      lineHeight: 1,
                      color: "rgba(255,255,255,.92)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="flex items-center justify-center font-semibold leading-[1.45]"
                    style={{
                      height: TITLE_H,
                      fontSize: "clamp(11.5px,1.15vw,15px)",
                      padding: "0 6px",
                      color: "#FFFFFF",
                    }}
                  >
                    {ph.title}
                  </div>
                  <div
                    className="relative flex w-full items-center justify-center"
                    style={{ height: DOT_ROW }}
                  >
                    <span
                      className="rounded-full"
                      style={{
                        width: 12,
                        height: 12,
                        background: "#fff",
                        boxShadow: "0 0 12px rgba(255,255,255,.85)",
                      }}
                    />
                  </div>
                  <div
                    className="mt-2 font-extrabold"
                    style={{
                      fontSize: "clamp(11px,1.05vw,13.5px)",
                      color: "rgba(230,241,255,.95)",
                      lineHeight: 1.7,
                      padding: "0 6px",
                    }}
                  >
                    {ph.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
