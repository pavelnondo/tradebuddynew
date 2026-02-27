/**
 * Modern StatCard component
 * Clean, minimal design with subtle hover effects
 * Supports animated number ticker for numeric stats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { NumberTicker } from '@/components/ui/number-ticker';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  valueColor?: string;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  /** When set, animates the value with NumberTicker */
  numericValue?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  valueDecimals?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  valueColor,
  glow = false,
  className,
  onClick,
  numericValue,
  valuePrefix = '',
  valueSuffix = '',
  valueDecimals = 0,
}) => {
  const { themeConfig } = useTheme();

  const trendColors = {
    up: themeConfig.success,
    down: themeConfig.destructive,
    neutral: themeConfig.mutedForeground,
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 magic-card',
        'bg-card border border-border',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: themeConfig.card,
        borderColor: themeConfig.border,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { 
        scale: 1.01,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
      } : {}}
      onClick={onClick}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <div 
              className="p-2.5 rounded-xl transition-colors"
              style={{ 
                backgroundColor: `${themeConfig.accent}12`,
                border: `1px solid ${themeConfig.accent}25`
              }}
            >
              <Icon className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
          )}

          {change !== undefined && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ 
                backgroundColor: `${trendColors[trend]}15`,
                color: trendColors[trend]
              }}
            >
              <TrendIcon className="w-3 h-3" />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <p 
            className="text-3xl font-semibold tracking-tight"
            style={{ color: valueColor ?? themeConfig.foreground }}
          >
            {numericValue !== undefined ? (
              <NumberTicker
                value={numericValue}
                decimals={valueDecimals}
                prefix={valuePrefix}
                suffix={valueSuffix}
                direction={trend === 'down' && numericValue < 0 ? 'down' : 'up'}
                duration={0.8}
                className="inline-block"
              />
            ) : (
              value
            )}
          </p>
        </div>

        {/* Title */}
        <p 
          className="text-sm font-medium"
          style={{ color: themeConfig.mutedForeground }}
        >
          {title}
        </p>
      </div>
    </motion.div>
  );
};
