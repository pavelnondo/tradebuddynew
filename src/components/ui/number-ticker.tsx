/**
 * Animated number ticker - counts up/down when value changes
 * Uses framer-motion springs for smooth animation
 */

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface NumberTickerProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  direction?: 'up' | 'down';
  delay?: number;
}

export function NumberTicker({
  value = 0,
  decimals = 0,
  duration = 1,
  className = '',
  prefix = '',
  suffix = '',
  direction = 'up',
  delay = 0,
}: NumberTickerProps) {
  const spring = useSpring(direction === 'up' ? 0 : value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) =>
    current.toFixed(decimals)
  );

  const [displayValue, setDisplayValue] = React.useState(() =>
    (direction === 'up' ? 0 : value).toFixed(decimals)
  );

  useMotionValueEvent(display, 'change', (latest) => {
    setDisplayValue(typeof latest === 'string' ? latest : String(latest));
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [spring, value, delay]);

  return (
    <span className={cn('tabular-nums inline-block', className)}>
      {prefix}
      <motion.span layout transition={{ duration: duration * 0.3 }}>
        {displayValue}
      </motion.span>
      {suffix}
    </span>
  );
}
