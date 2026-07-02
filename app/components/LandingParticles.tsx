"use client";

import { useEffect, useRef } from "react";

// Subtle drifting "dust" particles behind the landing hero. They float slowly on their own
// and gently part around the cursor (Google-Antigravity style). Purely decorative: the canvas
// is pointer-events-none and listens on the window, so it never blocks the cards underneath.
export function LandingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mostly faint slate dots with a few sky-blue accents, echoing the brand palette.
    const palette = [
      "rgba(100,116,139,0.45)",
      "rgba(100,116,139,0.30)",
      "rgba(148,163,184,0.35)",
      "rgba(2,132,199,0.50)",
      "rgba(14,165,233,0.40)"
    ];

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string };
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    const REPEL_RADIUS = 200;

    const buildParticles = () => {
      const count = Math.max(120, Math.min(460, Math.floor((width * height) / 3400)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.7 + 0.6,
        color: palette[Math.floor(Math.random() * palette.length)]
      }));
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around the edges so the field never empties out.
        if (p.x < -6) p.x = width + 6;
        else if (p.x > width + 6) p.x = -6;
        if (p.y < -6) p.y = height + 6;
        else if (p.y > height + 6) p.y = -6;

        // Push particles away from the cursor (transient — they resume drifting after).
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / REPEL_RADIUS) * 2.6;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };

    let raf = 0;
    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onResize = () => {
      resize();
      draw();
    };

    resize();
    draw(); // paint one frame immediately so particles show even before rAF ticks
    // Always animate + react to the cursor (decorative hero effect, requested behaviour).
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
