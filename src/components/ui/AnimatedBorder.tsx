import { useEffect, useRef, useMemo } from "react";

const DEFAULT_COLORS = ["#38bdf8", "#a78bfa", "#f472b6", "#fbbf24"];
const GOLDEN_COLORS = ["#fbbf24", "#f59e0b", "#eab308", "#fbbf24"];

const SPEED_DURATION: Record<number, number> = {
  1: 4000,
  2: 2000,
  3: 1000,
};

interface AnimatedBorderProps {
  active: boolean;
  speed?: number;
  colors?: string[];
  borderWidth?: number;
  borderRadius?: number;
  golden?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function AnimatedBorder({
  active,
  speed = 1,
  colors,
  borderWidth = 2,
  borderRadius = 10,
  golden = false,
  className = "",
  children,
}: AnimatedBorderProps) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const angleRef = useRef<number>(0);
  const gradientRef = useRef<HTMLDivElement>(null);

  const resolvedColors = colors ?? (golden ? GOLDEN_COLORS : DEFAULT_COLORS);
  const duration = SPEED_DURATION[speed] ?? 4000;
  const colorString = useMemo(() => resolvedColors.join(", "), [resolvedColors]);

  useEffect(() => {
    if (!active) {
      angleRef.current = 0;
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      angleRef.current = (angleRef.current + (360 * delta) / duration) % 360;

      if (gradientRef.current) {
        gradientRef.current.style.background = `conic-gradient(from ${angleRef.current}deg, ${colorString})`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, duration, colorString]);

  if (!active) {
    return (
      <div
        className={className}
        style={{
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius,
        }}
      >
        {children}
      </div>
    );
  }

  const innerRadius = Math.max(0, borderRadius - borderWidth);

  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius,
        padding: borderWidth,
        ...(golden
          ? { boxShadow: "0 0 20px rgba(251, 191, 36, 0.15)" }
          : undefined),
      }}
    >
      {/* Rotating gradient layer — updated via ref, no re-renders */}
      <div
        ref={gradientRef}
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `conic-gradient(from 0deg, ${colorString})`,
          borderRadius,
        }}
      />

      {/* Content with solid background to mask the center */}
      <div
        className="relative"
        style={{
          background: "var(--color-bg-surface, #252d3d)",
          borderRadius: innerRadius,
        }}
      >
        {children}
      </div>
    </div>
  );
}
