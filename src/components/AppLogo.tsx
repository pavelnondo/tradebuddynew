/**
 * App Logo - Professional trading journal branding
 * Magic UI inspired: clean icon, refined typography, subtle accent
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  /** Compact: icon only (for mobile header) */
  compact?: boolean;
  /** Size: sm | md | lg */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Trading chart motif - candlestick / trend line icon */
function ChartIcon({ accent, className }: { accent: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full h-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Candlestick bodies */}
      <rect x="4" y="14" width="4" height="10" rx="1" fill={accent} fillOpacity="0.4" />
      <rect x="10" y="10" width="4" height="14" rx="1" fill="url(#chart-grad)" />
      <rect x="16" y="6" width="4" height="18" rx="1" fill="url(#chart-grad)" />
      <rect x="22" y="12" width="4" height="12" rx="1" fill={accent} fillOpacity="0.5" />
      {/* Trend line */}
      <path
        d="M6 20 L12 14 L18 8 L24 16"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function AppLogo({ compact = false, size = 'md', className }: AppLogoProps) {
  const { themeConfig } = useTheme();

  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base' },
    md: { icon: 'w-10 h-10', text: 'text-lg' },
    lg: { icon: 'w-12 h-12', text: 'text-xl' },
  } as const;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-[1.02]',
          sizes[size].icon
        )}
        style={{
          backgroundColor: `${themeConfig.accent}15`,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: `0 1px 3px ${themeConfig.accent}20`,
        }}
      >
        <div className="w-5/6 h-5/6 flex items-center justify-center">
          <ChartIcon accent={themeConfig.accent} />
        </div>
      </div>
      {!compact && (
        <div className="flex-1 min-w-0">
          <h1
            className={cn('font-semibold tracking-tight', sizes[size].text)}
            style={{ color: themeConfig.foreground }}
          >
            Trade<span style={{ color: themeConfig.accent }}>Buddy</span>
          </h1>
          <p
            className="text-xs mt-0.5 font-medium"
            style={{ color: themeConfig.mutedForeground }}
          >
            Trading Journal
          </p>
        </div>
      )}
    </div>
  );
}
