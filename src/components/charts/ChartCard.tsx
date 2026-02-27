/**
 * Universal Chart Card Component
 * 
 * Mandatory structure:
 * - Header (fixed height): Title and subtitle only
 * - Body (elastic height): Chart canvas, centered horizontally
 * - Footer (optional, fixed height): Summary metrics only
 * 
 * Enforces consistent spacing, centering, and alignment across all charts
 */

import React, { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  minHeight?: number;
  className?: string;
  /** Animated shine border on hover (Magic UI style) */
  shineBorder?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  footer,
  minHeight = 320,
  className = '',
  shineBorder = false,
}) => {
  const { themeConfig } = useTheme();

  return (
    <Card 
      shineBorder={shineBorder}
      className={`rounded-2xl transition-all duration-200 outline-none focus:outline-none focus:ring-0 select-none ${className}`}
      tabIndex={-1}
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: `${minHeight + 120}px`,
        height: '100%',
        overflow: 'hidden',
        backgroundColor: themeConfig.card,
        borderColor: themeConfig.border,
        border: `1px solid ${themeConfig.border}`,
      }}
    >
      {/* Header */}
      <div 
        className="px-6 pt-6 pb-4"
        style={{
          minHeight: '80px',
          flexShrink: 0,
        }}
      >
        <h3 
          className="text-lg font-semibold mb-1"
          style={{ color: themeConfig.foreground }}
        >
          {title}
        </h3>
        {subtitle && (
          <p 
            className="text-xs"
            style={{ color: themeConfig.mutedForeground }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div
        className="flex-1 px-6 pb-6 outline-none focus:outline-none min-w-0 overflow-hidden"
        tabIndex={-1}
        style={{
          minHeight: `${minHeight}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
      >
        {children}
      </div>

      {/* Footer - Fixed height, optional */}
      {footer && (
        <div
          className="px-6 pt-4 pb-6 border-t"
          style={{
            minHeight: '60px',
            flexShrink: 0,
            borderColor: themeConfig.border,
          }}
        >
          {footer}
        </div>
      )}
    </Card>
  );
};
