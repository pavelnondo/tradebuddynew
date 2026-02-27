/**
 * Loading Shimmer - Magic UI style shimmer effect for loading states
 * Use for skeleton loaders or loading overlays
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function LoadingShimmer({
  className,
  width = '100%',
  height = '1rem',
  rounded = true,
}: LoadingShimmerProps) {
  return (
    <div
      className={cn('relative overflow-hidden', rounded && 'rounded-md', className)}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
