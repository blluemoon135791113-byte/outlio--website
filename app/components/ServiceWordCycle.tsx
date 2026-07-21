"use client";

import { useEffect, useState } from "react";

const WORDS = ["OUTBOUND", "INBOUND"];
const WORD_MS = 2500;

export default function ServiceWordCycle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, WORD_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-block whitespace-nowrap text-left align-baseline">
      {/* width reserved by the longest word so the loop never causes layout shift */}
      <span aria-hidden className="invisible">
        OUTBOUND.
      </span>
      <span key={index} className="absolute inset-y-0 left-0 text-accent hero-word-fade">
        {WORDS[index]}.
      </span>
    </span>
  );
}
