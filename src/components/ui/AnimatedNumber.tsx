import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultFormat = (n: number): string => Math.round(n).toLocaleString();

export function AnimatedNumber({
  value,
  duration: _duration = 0.8,
  format = defaultFormat,
  className,
  style,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => format(current));
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      // Jump to value on first render (bypass spring), then animate subsequent changes
      motionValue.jump(value);
      isInitial.current = false;
    } else {
      motionValue.set(value);
    }
  }, [value, motionValue]);

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  );
}

export default AnimatedNumber;
