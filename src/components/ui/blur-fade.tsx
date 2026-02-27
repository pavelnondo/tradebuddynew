/**
 * Blur fade - content fades in with blur effect
 * Use for section/page reveals
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  blur?: number;
  y?: number;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  blur = 6,
  y = 8,
}: BlurFadeProps) {
  const Comp = motion.div;

  return (
    <Comp
      initial={{
        opacity: 0,
        filter: `blur(${blur}px)`,
        y,
      }}
      animate={{
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(className)}
    >
      {children}
    </Comp>
  );
}
