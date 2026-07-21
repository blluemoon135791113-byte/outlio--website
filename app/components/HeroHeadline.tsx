"use client";

import { useEffect, useState, useRef } from "react";

const WORDS = ["tech startups", "agencies", "SaaS startups"];
const WORD_MS = 2500;

export default function HeroHeadline() {
  const [index, setIndex] = useState(0);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, WORD_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!headlineRef.current) return;

      const scrollY = window.scrollY;
      const fadeStart = 0;
      const fadeEnd = 400;

      let opacity = 1;
      if (scrollY > fadeStart) {
        opacity = 1 - Math.min((scrollY - fadeStart) / (fadeEnd - fadeStart), 1);
      }

      setScrollOpacity(opacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <h1
      ref={headlineRef}
      className="text-[clamp(2.6rem,7.2vw,6.2rem)] font-bold uppercase leading-[0.98] tracking-tight transition-all duration-300"
      style={{
        opacity: scrollOpacity,
        filter: `blur(${(1 - scrollOpacity) * 4}px)`,
        transform: `translateY(${(1 - scrollOpacity) * -20}px)`
      }}
    >
      <span className="hero-main block">
        <span className="inline-block hero-text-slide">We</span>{" "}
        <span className="inline-block hero-text-slide" style={{ animationDelay: "0.1s" }}>
          book
        </span>{" "}
        <span className="inline-block hero-text-slide" style={{ animationDelay: "0.2s" }}>
          the
        </span>{" "}
        <span className="inline-block hero-text-slide" style={{ animationDelay: "0.3s" }}>
          meetings
        </span>{" "}
        <span className="inline-block hero-text-slide" style={{ animationDelay: "0.4s" }}>
          for
        </span>{" "}
        <span className="relative inline-block whitespace-nowrap text-left align-baseline">
          {/* width reserved by the longest word so the loop never causes layout shift */}
          <span aria-hidden className="invisible">
            SaaS startups.
          </span>
          <span key={index} className="absolute inset-y-0 left-0 text-accent hero-word-fade">
            {WORDS[index]}.
          </span>
        </span>
      </span>
      {/* the outcome statement — always visible beneath the looping line */}
      <span
        className="hero-text-slide mt-5 block text-[0.52em] leading-tight tracking-tight"
        style={{ animationDelay: "0.55s" }}
      >
        You build the product.{" "}
        <span className="text-accent">We build the pipeline.</span>
      </span>
    </h1>
  );
}
