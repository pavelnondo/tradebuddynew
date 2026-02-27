/**
 * Analytics Grid Layout System
 * 
 * Grid-locked layout with:
 * - Consistent row and column gaps
 * - Shared row heights (tallest chart determines row height)
 * - Vertical alignment of titles, plots, and footers
 * - Responsive stacking on smaller screens
 */

import React, { ReactNode } from 'react';

interface AnalyticsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  children,
  columns = 2,
  gap = 24,
  className = ''
}) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    width: '100%',
    alignItems: 'stretch', // Ensures all cards in a row have same height
  };

  return (
    <div
      className={className}
      style={gridStyle}
    >
      {children}
    </div>
  );
};

// Responsive wrapper that stacks on mobile
export const ResponsiveAnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  children,
  columns = 2,
  gap = 24,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Grid layout */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          alignItems: 'stretch',
        }}
      >
        {children}
      </div>
      
      {/* Mobile/Tablet: Stacked layout */}
      <div
        className="grid lg:hidden"
        style={{
          gridTemplateColumns: '1fr',
          gap: `${gap}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
