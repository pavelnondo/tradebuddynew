/**
 * Professional Chart Tooltip Component
 * 
 * UX Rules:
 * - Vertically stacked, not dense blocks
 * - Maximum 5 visible rows
 * - Labels left-aligned, values right-aligned
 * - Numeric values visually emphasized
 * - No glow or neon effects
 * - Soft shadow only
 * - Smooth, stable positioning
 * - Never covers active data point
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
  formatter?: (value: number | string) => string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    stroke?: string;
    fill?: string;
  }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number | string, name?: string) => string;
  maxItems?: number;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  maxItems = 5
}) => {
  const { themeConfig } = useTheme();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Format label
  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label || '';

  // Process and limit entries
  const entries: TooltipEntry[] = payload
    .slice(0, maxItems)
    .map((entry) => {
      const name = entry.name || entry.dataKey || '';
      const value = entry.value ?? '';
      const color = entry.stroke || entry.fill || entry.color || themeConfig.primary;
      
      return {
        name,
        value,
        color,
        formatter: valueFormatter ? (v: number | string) => valueFormatter(v, name) : undefined
      };
    });

  if (entries.length === 0) {
    return null;
  }

  // Format numeric values
  const formatValue = (value: number | string, formatter?: (v: number | string) => string): string => {
    if (formatter) return formatter(value);
    if (typeof value === 'number') {
      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}k`;
      if (value % 1 !== 0) return value.toFixed(2);
      return value.toString();
    }
    return String(value);
  };

  return (
    <div
      className="rounded-lg border shadow-lg p-3 bg-popover"
      style={{
        backgroundColor: themeConfig.popover,
        borderColor: themeConfig.border,
        boxShadow: `0 4px 6px -1px ${themeConfig.shadow}, 0 2px 4px -2px ${themeConfig.shadow}`,
        minWidth: '140px',
        maxWidth: '220px',
      }}
    >
      {/* Label */}
      <div
        className="font-semibold mb-2 pb-2 border-b"
        style={{
          color: themeConfig.foreground,
          borderColor: themeConfig.border,
        }}
      >
        {formattedLabel}
      </div>

      {/* Entries - Vertically stacked */}
      <div className="space-y-1.5">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4"
            style={{ color: themeConfig.foreground }}
          >
            {/* Label with color indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm truncate" style={{ color: themeConfig.mutedForeground }}>
                {entry.name}
              </span>
            </div>

            {/* Value - Right aligned, emphasized */}
            <span
              className="text-sm font-semibold flex-shrink-0"
              style={{ color: themeConfig.foreground }}
            >
              {formatValue(entry.value, entry.formatter)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
