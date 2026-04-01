import { useRef, useState, useCallback } from 'react';

interface Use3DTiltOptions {
  /** Maximum rotation in degrees (default: 5) */
  maxRotation?: number;
  /** CSS perspective value in px (default: 1000) */
  perspective?: number;
  /** Scale factor on hover (default: 1.02) */
  scale?: number;
  /** Transition speed in ms (default: 400) */
  speed?: number;
}

interface Use3DTiltReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  spotlightStyle: React.CSSProperties;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function use3DTilt(options?: Use3DTiltOptions): Use3DTiltReturn {
  const {
    maxRotation = 5,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
  } = options ?? {};

  const ref = useRef<HTMLDivElement | null>(null);

  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovering: false });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const rotateX = ((mouseY - centerY) / (rect.height / 2)) * -maxRotation;
      const rotateY = ((mouseX - centerX) / (rect.width / 2)) * maxRotation;

      setTilt({ rotateX, rotateY, isHovering: true });
      setSpotlight({ x: mouseX - rect.left, y: mouseY - rect.top });
    },
    [maxRotation],
  );

  const onMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, isHovering: false });
  }, []);

  const currentScale = tilt.isHovering ? scale : 1;

  const style: React.CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${currentScale})`,
    transition: `transform ${speed}ms ease-out`,
  };

  const spotlightStyle: React.CSSProperties = tilt.isHovering
    ? {
        background: `radial-gradient(circle at ${spotlight.x}px ${spotlight.y}px, rgba(56,189,248,0.08) 0%, transparent 60%)`,
      }
    : {
        background: 'transparent',
      };

  return { ref, style, spotlightStyle, onMouseMove, onMouseLeave };
}
