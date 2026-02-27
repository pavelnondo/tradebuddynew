/**
 * Loading Pulse - Magic UI style pulsing ring animation
 * Great for indicating active processing
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingPulseProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingPulse({ className, size = 'md', color }: LoadingPulseProps) {
  const { themeConfig } = useTheme();
  const pulseColor = color || themeConfig.accent;

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('relative flex items-center justify-center flex-shrink-0', sizes[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: pulseColor,
          opacity: 0.4,
        }}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: pulseColor,
          opacity: 0.8,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: pulseColor,
          width: '40%',
          height: '40%',
          margin: 'auto',
        }}
      />
    </div>
  );
}
