"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 500;

export default function StarFieldCanvas() {
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W: number, H: number;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 0.7,
      a: 0.4 + Math.random() * 0.45,
    }));

    function resize() {
      W = cvs!.clientWidth;
      H = cvs!.clientHeight;
      cvs!.width = W * DPR;
      cvs!.height = H * DPR;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      draw();
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      for (const s of stars) {
        ctx!.beginPath();
        ctx!.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx!.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={cvsRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
