import { useRef } from "react";
import { useAnimationFrame } from "framer-motion";

interface MomentumPulseProps {
  completionRate: number; // 0-100
}

function getConfig(rate: number) {
  if (rate < 30) {
    return {
      color: "56, 189, 248",
      baseOpacity: 0.03,
      amplitude: 0.01,
      speed: 1.57, // 2*PI / 4s
      size: 50,
    };
  }
  if (rate < 60) {
    return {
      color: "45, 212, 191",
      baseOpacity: 0.04,
      amplitude: 0.015,
      speed: 2.09, // 2*PI / 3s
      size: 57,
    };
  }
  if (rate < 80) {
    return {
      color: "163, 230, 53",
      baseOpacity: 0.05,
      amplitude: 0.02,
      speed: 2.51, // 2*PI / 2.5s
      size: 63,
    };
  }
  return {
    color: "250, 204, 21",
    baseOpacity: 0.06,
    amplitude: 0.02,
    speed: 3.14, // 2*PI / 2s
    size: 70,
  };
}

export default function MomentumPulse({ completionRate }: MomentumPulseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const config = getConfig(completionRate);

  useAnimationFrame((time) => {
    if (!ref.current) return;

    const t = time / 1000; // convert ms to seconds
    const opacity =
      Math.sin(t * config.speed) * config.amplitude + config.baseOpacity;

    ref.current.style.background = `radial-gradient(circle at 50% 50%, rgba(${config.color}, ${opacity.toFixed(4)}) 0%, transparent ${config.size}%)`;
  });

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
