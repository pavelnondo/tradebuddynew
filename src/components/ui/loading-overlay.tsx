/**
 * Loading Overlay - Magic UI style loading overlay with animation
 * Uses the new LoadingAnimation component with particles
 */

"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadingAnimation } from './loading-animation';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ isLoading, message, className }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <div className={cn('absolute inset-0 rounded-xl z-10', className)}>
          <LoadingAnimation
            message={message}
            showParticles={true}
            particleCount={20}
            overlay={false}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
