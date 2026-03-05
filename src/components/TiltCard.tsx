"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
  perspective?: number;
  scale?: number;
};

export default function TiltCard({
  children,
  className,
  maxTiltDeg = 10,
  perspective = 900,
  scale = 1.015,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setEnabled(!prefersReduced && !isTouch);
  }, []);

  const reset = () => {
    if (!ref.current) return;
    ref.current.style.transition = enabled ? "transform 220ms ease" : "";
    ref.current.style.transform = `perspective(${perspective}px) translateZ(0) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  const onMove = (e: React.MouseEvent) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    el.style.transition = "";

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const tiltY = (px - 0.5) * (maxTiltDeg * 2);
    const tiltX = (0.5 - py) * (maxTiltDeg * 2);

    if (frame.current != null) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transform = `perspective(${perspective}px) translateZ(0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale})`;
    });
  };

  const onLeave = () => {
    if (!enabled) return;
    if (frame.current != null) window.cancelAnimationFrame(frame.current);
    reset();
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: enabled ? "transform" : undefined,
        transform: `perspective(${perspective}px) translateZ(0) rotateX(0deg) rotateY(0deg) scale(1)`,
      }}
    >
      {children}
    </div>
  );
}
