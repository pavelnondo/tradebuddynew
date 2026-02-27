/**
 * Elastic Chart Container Component
 * 
 * Ensures charts never shrink below minimum height
 * Expands to accommodate chart canvas, axes, labels, legends
 * Prevents clipping and overlap
 */

import React, { ReactNode } from 'react';

interface ChartContainerProps {
  children: ReactNode;
  minHeight: number;
  aspectRatio?: number; // width / height
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  minHeight,
  aspectRatio,
  className = ''
}) => {
  return (
    <div 
      className={className}
      style={{
        width: '100%',
        minHeight: `${minHeight}px`,
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      {children}
    </div>
  );
};
