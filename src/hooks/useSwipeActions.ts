import { useRef, useState, useCallback } from 'react';
import type { PanInfo } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseSwipeActionsOptions {
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface UseSwipeActionsReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dragProps: {
    drag: 'x';
    dragConstraints: { left: 0; right: 0 };
    dragElastic: number;
    onDrag: (event: any, info: PanInfo) => void;
    onDragEnd: (event: any, info: PanInfo) => void;
    animate: { x: number };
    transition: object;
  };
  revealState: 'none' | 'complete' | 'defer';
  dragOffset: number;
  isSwiping: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REVEAL_THRESHOLD_PERCENT = 0.15;

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
};

const EXIT_TRANSITION = {
  duration: 0.3,
  ease: 'easeOut' as const,
};

// ---------------------------------------------------------------------------
// Disabled drag props (returned when enabled === false)
// ---------------------------------------------------------------------------

const DISABLED_DRAG_PROPS: UseSwipeActionsReturn['dragProps'] = {
  drag: 'x',
  dragConstraints: { left: 0, right: 0 },
  dragElastic: 0,
  onDrag: () => {},
  onDragEnd: () => {},
  animate: { x: 0 },
  transition: SPRING_TRANSITION,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSwipeActions(
  options: UseSwipeActionsOptions,
): UseSwipeActionsReturn {
  const {
    onSwipeRight,
    onSwipeLeft,
    threshold = 0.35,
    enabled = true,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [revealState, setRevealState] = useState<'none' | 'complete' | 'defer'>(
    'none',
  );
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [animateX, setAnimateX] = useState(0);
  const [transition, setTransition] = useState<object>(SPRING_TRANSITION);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleDrag = useCallback(
    (_event: any, info: PanInfo) => {
      if (!enabled) return;

      const offsetX = info.offset.x;
      setDragOffset(offsetX);
      setIsSwiping(true);

      const containerWidth =
        containerRef.current?.getBoundingClientRect().width ?? 0;
      const ratio =
        containerWidth > 0 ? Math.abs(offsetX) / containerWidth : 0;

      if (offsetX > 0 && ratio > REVEAL_THRESHOLD_PERCENT) {
        setRevealState('complete');
      } else if (offsetX < 0 && ratio > REVEAL_THRESHOLD_PERCENT) {
        setRevealState('defer');
      } else {
        setRevealState('none');
      }
    },
    [enabled],
  );

  const handleDragEnd = useCallback(
    (_event: any, info: PanInfo) => {
      if (!enabled) return;

      const containerWidth =
        containerRef.current?.getBoundingClientRect().width ?? 0;
      const offsetX = info.offset.x;
      const ratio =
        containerWidth > 0 ? Math.abs(offsetX) / containerWidth : 0;

      if (ratio >= threshold) {
        // Fly off-screen in the direction of the swipe
        const direction = offsetX > 0 ? 1 : -1;
        setAnimateX(direction * containerWidth * 1.2);
        setTransition(EXIT_TRANSITION);

        const callback = direction > 0 ? onSwipeRight : onSwipeLeft;
        setTimeout(() => {
          callback();
        }, 300);
      } else {
        // Snap back to center
        setAnimateX(0);
        setTransition(SPRING_TRANSITION);
      }

      setIsSwiping(false);
      setDragOffset(0);
      setRevealState('none');
    },
    [enabled, threshold, onSwipeRight, onSwipeLeft],
  );

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  if (!enabled) {
    return {
      containerRef,
      dragProps: DISABLED_DRAG_PROPS,
      revealState: 'none',
      dragOffset: 0,
      isSwiping: false,
    };
  }

  return {
    containerRef,
    dragProps: {
      drag: 'x',
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.6,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
      animate: { x: animateX },
      transition,
    },
    revealState,
    dragOffset,
    isSwiping,
  };
}

// ---------------------------------------------------------------------------
// SwipeRevealLayer component
// ---------------------------------------------------------------------------

interface SwipeRevealLayerProps {
  direction: 'left' | 'right';
  active: boolean;
  children?: React.ReactNode;
}

export function SwipeRevealLayer({
  direction,
  active,
  children,
}: SwipeRevealLayerProps) {
  const isRight = direction === 'right';

  const icon = isRight
    ? React.createElement(Check, {
        className: `w-6 h-6 transition-transform duration-150 ${
          active ? 'scale-125' : 'scale-100'
        }`,
      })
    : React.createElement(Clock, {
        className: `w-6 h-6 transition-transform duration-150 ${
          active ? 'scale-125' : 'scale-100'
        }`,
      });

  return React.createElement(
    'div',
    {
      className: [
        'absolute inset-0 flex items-center rounded-lg transition-colors duration-150',
        isRight ? 'justify-start pl-4' : 'justify-end pr-4',
        isRight
          ? active
            ? 'bg-[#a3e635]/30 text-lime-400'
            : 'bg-[#a3e635]/20 text-lime-500/70'
          : active
            ? 'bg-[#fbbf24]/30 text-amber-400'
            : 'bg-[#fbbf24]/20 text-amber-500/70',
      ].join(' '),
    },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      icon,
      children,
    ),
  );
}
