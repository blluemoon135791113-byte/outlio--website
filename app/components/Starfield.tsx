"use client";

import { useEffect, useRef } from "react";

export default function Starfield() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cvs = cvsRef.current;
    if (!wrap || !cvs) return;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 3);
    let W: number, H: number;
    let animId: number;

    function resize() {
      W = wrap!.clientWidth;
      H = wrap!.clientHeight;
      cvs!.width = W * DPR;
      cvs!.height = H * DPR;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 0.5 + 0.2,
      base: Math.random() * 0.4 + 0.1,
      spd: 0.0004 + Math.random() * 0.0011,
      ph: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.25 ? 210 : 45,
    }));

    const heroes = [
      { x: 0.35, y: 0.65, size: 18, spike: 55, spd: 0.0009, ph: 0.0, hue: 48, sat: 55 },
      { x: 0.72, y: 0.28, size: 13, spike: 40, spd: 0.0013, ph: 1.9, hue: 42, sat: 60 },
    ];

    function spikes(x: number, y: number, len: number, w: number, alpha: number, hue: number) {
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      for (const [dx, dy] of dirs) {
        const g = ctx!.createLinearGradient(x, y, x + dx * len, y + dy * len);
        g.addColorStop(0, `hsla(${hue},70%,88%,${alpha})`);
        g.addColorStop(0.25, `hsla(${hue},70%,75%,${alpha * 0.35})`);
        g.addColorStop(1, `hsla(${hue},70%,60%,0)`);
        ctx!.strokeStyle = g;
        ctx!.lineWidth = w;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(x, y);
        ctx!.lineTo(x + dx * len, y + dy * len);
        ctx!.stroke();
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);

      ctx!.globalCompositeOperation = "lighter";

      for (const s of dust) {
        const tw = 0.55 + 0.45 * Math.sin(t * s.spd + s.ph);
        const a = s.base * tw;
        const x = s.x * W, y = s.y * H;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, s.r * 3.5);
        g.addColorStop(0, `hsla(${s.hue},40%,95%,${a})`);
        g.addColorStop(1, "hsla(0,0%,100%,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, s.r * 3.5, 0, 7);
        ctx!.fill();
      }

      for (const s of heroes) {
        const x = s.x * W, y = s.y * H;
        const slow = 0.82 + 0.18 * Math.sin(t * s.spd + s.ph);
        const micro = 0.96 + 0.04 * Math.sin(t * 0.008 + s.ph * 3.1);
        const k = slow * micro;

        const halo = ctx!.createRadialGradient(x, y, 0, x, y, s.size * 2.2 * k);
        halo.addColorStop(0, `hsla(${s.hue},${s.sat}%,92%,${0.5 * k})`);
        halo.addColorStop(0.3, `hsla(${s.hue},${s.sat}%,78%,${0.15 * k})`);
        halo.addColorStop(1, `hsla(${s.hue},${s.sat}%,60%,0)`);
        ctx!.fillStyle = halo;
        ctx!.beginPath();
        ctx!.arc(x, y, s.size * 2.2 * k, 0, 7);
        ctx!.fill();

        spikes(x, y, s.spike * k, 1.8, 0.85 * k, s.hue);
        spikes(x, y, s.spike * 0.5 * k, 4, 0.3 * k, s.hue);

        const core = ctx!.createRadialGradient(x, y, 0, x, y, s.size * 0.35);
        core.addColorStop(0, `rgba(255,255,255,${k})`);
        core.addColorStop(1, "rgba(255,240,210,0)");
        ctx!.fillStyle = core;
        ctx!.beginPath();
        ctx!.arc(x, y, s.size * 0.35, 0, 7);
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = "source-over";
      animId = requestAnimationFrame(draw);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      draw(0);
    } else {
      animId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="w-[280px] h-[280px]">
      <canvas ref={cvsRef} className="block w-full h-full" />
    </div>
  );
}
