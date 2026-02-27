/**
 * Loading Dots - Magic UI style animated loading indicator
 * Smooth pulsing dots with stagger effect
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingDots({ className, size = 'md', color }: LoadingDotsProps) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const dots = [0, 1, 2];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {dots.map((i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', sizes[size])}
          style={{
            backgroundColor: color || 'currentColor',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
