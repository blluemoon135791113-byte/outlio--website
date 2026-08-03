"use client";

import { useEffect, useRef } from "react";

export default function CosmicHeroViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Particle class for stars/widgets
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update(width: number, height: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const particles: Particle[] = [];
    const particleCount = 150;

    // Create particles (stars)
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(width, height));
    }

    // Central star position
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    let animationFrame: number;
    let time = 0;

    function animate() {
      if (!ctx || !canvas) return;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear with dark background
      ctx.fillStyle = "rgba(16, 15, 32, 0.95)";
      ctx.fillRect(0, 0, width, height);

      time += 0.01;

      // Draw particles (background stars)
      particles.forEach(particle => {
        particle.update(width, height);
        particle.draw(ctx);
      });

      // Draw orbit paths
      ctx.strokeStyle = "rgba(79, 75, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const radius = 60 * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Add tick marks
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + 5);
          const y2 = centerY + Math.sin(angle) * (radius + 5);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = "rgba(79, 75, 255, 0.3)";
          ctx.stroke();
        }
      }

      // Draw orbiting widgets
      for (let i = 0; i < 5; i++) {
        const angle = (time + (i * Math.PI * 2) / 5);
        const orbitRadius = 100 + (i * 25);
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;

        // Widget glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        gradient.addColorStop(0, "rgba(79, 75, 255, 0.8)");
        gradient.addColorStop(1, "rgba(79, 75, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Widget core
        ctx.fillStyle = "#4f4bff";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Connection line to center
        ctx.strokeStyle = "rgba(79, 75, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw central star (Outlio)
      // Outer glow rings
      for (let i = 4; i >= 1; i--) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40 * i);
        glowGradient.addColorStop(0, `rgba(79, 75, 255, ${0.15 / i})`);
        glowGradient.addColorStop(1, "rgba(79, 75, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40 * i, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central bright core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
      coreGradient.addColorStop(0, "#ffffff");
      coreGradient.addColorStop(0.3, "#4f4bff");
      coreGradient.addColorStop(1, "rgba(79, 75, 255, 0)");
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Lens flare (horizontal streak)
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(centerX - 100, centerY - 1, 200, 2);

      // Particle beam shooting outward
      const beamAngle = time * 0.5;
      const beamLength = 200;
      const beamEndX = centerX + Math.cos(beamAngle) * beamLength;
      const beamEndY = centerY + Math.sin(beamAngle) * beamLength;

      const beamGradient = ctx.createLinearGradient(centerX, centerY, beamEndX, beamEndY);
      beamGradient.addColorStop(0, "rgba(79, 75, 255, 0.6)");
      beamGradient.addColorStop(1, "rgba(79, 75, 255, 0)");
      ctx.strokeStyle = beamGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(beamEndX, beamEndY);
      ctx.stroke();

      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-accent/20">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(135deg, #0f0e1f 0%, #1a1930 100%)" }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/60 text-xs font-semibold tracking-wide">
        OUTLIO SYSTEM
      </div>
    </div>
  );
}
