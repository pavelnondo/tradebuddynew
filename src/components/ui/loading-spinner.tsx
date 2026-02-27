/**
 * Loading Spinner - Magic UI style spinner with gradient
 * Smooth rotating spinner with accent color
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ className, size = 'md', color }: LoadingSpinnerProps) {
  const { themeConfig } = useTheme();
  const spinnerColor = color || themeConfig.accent;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.div
      className={cn('relative', sizes[size], className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: spinnerColor,
          borderRightColor: spinnerColor,
          opacity: 0.3,
        }}
      />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: spinnerColor,
          borderRightColor: spinnerColor,
          clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)',
        }}
      />
    </motion.div>
  );
}
