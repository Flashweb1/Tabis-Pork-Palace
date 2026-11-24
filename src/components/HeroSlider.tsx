"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Img } from "@/components/Img";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  image: string;
  alt: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  note?: { href: string; label: string };
};

const CTRL =
  "grid h-9 w-9 place-items-center rounded-full border border-ivory/25 text-ivory/85 transition hover:border-gold-2 hover:text-gold-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-2 focus-visible:ring-offset-2 focus-visible:ring-offset-forest";

/** Time each slide stays on screen before advancing. */
const DURATION = 3000;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Autoplay bookkeeping: remember how much time is left so pausing and
  // resuming neither jumps ahead nor restarts the slide.
  const remaining = useRef(DURATION);
  const startedAt = useRef(0);
  const skipSubtract = useRef(false);

  const paused = manualPause || hovered || focused || tabHidden || reduced;

  const go = useCallback(
    (next: number) => {
      skipSubtract.current = true;
      remaining.current = DURATION;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(mq.matches);
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const syncVisibility = () => setTabHidden(document.hidden);
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      mq.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const id = setTimeout(() => {
      skipSubtract.current = true;
      remaining.current = DURATION;
      setIndex((i) => (i + 1) % count);
    }, remaining.current);
    return () => {
      clearTimeout(id);
      if (!skipSubtract.current) {
        remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
      }
      skipSubtract.current = false;
    };
  }, [paused, index, count]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured pork"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
      }}
      className="relative"
    >
      <div className="relative min-h-[560px] overflow-hidden lg:min-h-[640px]">
        {slides.map((s, i) => {
          const active = i === index;
          const Tag = (i === 0 ? "h1" : "h2") as "h1";
          return (
            <div
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "z-[1] opacity-100" : "z-0 pointer-events-none opacity-0"}`}
            >
              <Img
                priority={i === 0}
                src={s.image}
                alt={s.alt}
                className={`absolute inset-0 h-full w-full object-cover opacity-45 ${active ? "kenburns" : ""}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_18%,transparent_35%,rgba(6,20,13,0.6)_100%)]" />
              <div className="grain-layer" aria-hidden />
              <div className="container-x relative z-[2] grid min-h-[560px] items-center py-16 sm:py-24 lg:min-h-[640px]">
                <div className="max-w-2xl">
                  <p
                    className={`eyebrow mb-5 !text-gold-2 transition-all duration-700 ease-out ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                    style={{ transitionDelay: active ? "80ms" : "0ms" }}
                  >
                    {s.eyebrow}
                  </p>
                  <Tag className="font-display font-semibold leading-[0.95]">
                    <span
                      className={`block text-[3.4rem] transition-all duration-700 ease-out sm:text-7xl ${active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                      style={{ transitionDelay: active ? "180ms" : "0ms" }}
                    >
                      {s.title}
                    </span>
                    <span
                      className={`block text-[3.4rem] text-gold-2 transition-all duration-700 ease-out sm:text-7xl ${active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
                      style={{ transitionDelay: active ? "300ms" : "0ms" }}
                    >
                      {s.accent}
                    </span>
                    <span
                      className={`mt-3 block font-sans text-base font-normal normal-case leading-relaxed text-ivory/80 transition-all duration-700 ease-out sm:text-lg ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                      style={{ transitionDelay: active ? "420ms" : "0ms" }}
                    >
                      {s.body}
                    </span>
                  </Tag>
                  <div
                    className={`mt-9 flex flex-col gap-3 transition-all duration-700 ease-out sm:flex-row ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                    style={{ transitionDelay: active ? "540ms" : "0ms" }}
                  >
                    <Link href={s.primary.href} className="btn-gold sheen !px-8 !py-4">
                      {s.primary.label}
                    </Link>
                    <Link href={s.secondary.href} className="btn-light !px-8 !py-4">
                      {s.secondary.label}
                    </Link>
                  </div>
                  <div
                    className={`mt-7 transition-all duration-700 ease-out ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                    style={{ transitionDelay: active ? "660ms" : "0ms" }}
                  >
                    {i === 0 ? (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-3/20 px-3.5 py-1.5 text-xs font-semibold text-ivory backdrop-blur-sm">
                          <Icon name="star" fill className="h-3.5 w-3.5 text-gold-2" /> 4.9 from 300+ verified reviews
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3.5 py-1.5 text-xs font-semibold text-ivory/90 backdrop-blur-sm">
                          <Icon name="snow" className="h-3.5 w-3.5 text-gold-2" /> Cold-chain guaranteed
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3.5 py-1.5 text-xs font-semibold text-ivory/90 backdrop-blur-sm">
                          <Icon name="truck" className="h-3.5 w-3.5 text-gold-2" /> Same-day dispatch in Lagos
                        </span>
                      </div>
                    ) : (
                      s.note && (
                        <Link href={s.note.href} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-2 hover:text-white">
                          {s.note.label} <Icon name="right" className="h-4 w-4" />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls — top right so they never collide with the copy or the chat bubble */}
      <div className="absolute inset-x-0 top-0 z-[3]">
        <div className="container-x flex items-center justify-end gap-3 pt-6 sm:gap-4 sm:pt-8">
          <p className="hidden font-sans text-xs font-semibold uppercase tracking-[0.3em] text-ivory/70 sm:block" aria-hidden>
            {String(index + 1).padStart(2, "0")}
            <span className="ml-1 text-ivory/35">/ {String(count).padStart(2, "0")}</span>
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setManualPause((p) => !p)}
              aria-label={manualPause ? "Play slideshow" : "Pause slideshow"}
              className={CTRL}
            >
              <Icon name={manualPause ? "play" : "pause"} className="h-3.5 w-3.5" fill={manualPause} />
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className={CTRL}
            >
              <Icon name="left" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}: ${s.title}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-2 focus-visible:ring-offset-2 focus-visible:ring-offset-forest ${i === index ? "w-12 bg-ivory/30" : "w-6 bg-ivory/25 hover:bg-ivory/45"}`}
                >
                  {i === index && !reduced && (
                    <span
                      key={index}
                      className="hero-progress absolute inset-0 rounded-full bg-gold-2"
                      style={{
                        animationDuration: `${DURATION}ms`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className={CTRL}
            >
              <Icon name="right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live={paused ? "polite" : "off"}>
        Slide {index + 1} of {count}: {slides[index].title} {slides[index].accent}
      </p>
    </div>
  );
}
