/**
 * PageContainer - Consistent page layout wrapper
 * Provides: max-width, centering, vertical rhythm, subtle entrance
 * Use PageFullBleed for full-width sections (e.g. charts)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Skip entrance animation (e.g. for instant navigation) */
  noAnimation?: boolean;
}

export function PageContainer({ children, className, noAnimation }: PageContainerProps) {
  const Wrapper = noAnimation ? 'div' : motion.div;
  const wrapperProps = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      };

  return (
    <Wrapper
      className={cn('max-w-7xl mx-auto w-full space-y-8', className)}
      {...wrapperProps}
    >
      {children}
    </Wrapper>
  );
}

interface PageFullBleedProps {
  children: React.ReactNode;
  className?: string;
}

/** Full-width section that breaks out of PageContainer padding (e.g. charts) */
export function PageFullBleed({ children, className }: PageFullBleedProps) {
  return (
    <div className={cn('-mx-8 w-[calc(100%+4rem)]', className)}>
      {children}
    </div>
  );
}
