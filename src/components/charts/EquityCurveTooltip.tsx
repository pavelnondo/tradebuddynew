/**
 * Custom tooltip for P&L Over Time / Equity Curve chart
 * Uses payload[0].payload - the raw data point { date, equity, pnl }
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function formatEquityCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface EquityCurveTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; payload?: { date?: string; equity?: number; pnl?: number } }>;
  label?: string;
}

export const EquityCurveTooltip: React.FC<EquityCurveTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  const { themeConfig } = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as { date?: string; dateLabel?: string; equity?: number; pnl?: number } | undefined;
  const equity = point?.equity ?? payload[0]?.value ?? 0;
  // pnl from payload: point.pnl OR second payload entry (invisible pnl Line)
  const pnlEntry = payload.find((p) => p.dataKey === 'pnl');
  const pnl = point?.pnl ?? pnlEntry?.value ?? 0;
  const rawDate = String(label ?? point?.date ?? point?.dateLabel ?? '');
  const date = (() => {
    if (!rawDate || rawDate === 'No Data') return rawDate;
    try {
      const d = new Date(rawDate);
      return isNaN(d.getTime()) ? rawDate : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return rawDate; }
  })();

  return (
    <div
      className="rounded-lg border shadow-lg p-3 bg-popover"
      style={{
        backgroundColor: themeConfig.popover,
        borderColor: themeConfig.border,
        boxShadow: `0 4px 6px -1px ${themeConfig.shadow}, 0 2px 4px -2px ${themeConfig.shadow}`,
        minWidth: '160px',
      }}
    >
      <div
        className="font-semibold mb-2 pb-2 border-b"
        style={{
          color: themeConfig.foreground,
          borderColor: themeConfig.border,
        }}
      >
        {date}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4 items-center">
          <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            Equity
          </span>
          <span className="text-sm font-semibold" style={{ color: themeConfig.foreground }}>
            {formatEquityCurrency(Number(equity))}
          </span>
        </div>
        <div className="flex justify-between gap-4 items-center">
          <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            P&L
          </span>
          <span
            className="text-sm font-semibold"
            style={{
              color: pnl >= 0 ? 'var(--chart-positive, #10b981)' : 'var(--chart-negative, #ef4444)',
            }}
          >
            {pnl >= 0 ? '+' : ''}{formatEquityCurrency(Number(pnl))}
          </span>
        </div>
      </div>
    </div>
  );
};
