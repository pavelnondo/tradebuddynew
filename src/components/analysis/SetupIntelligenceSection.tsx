import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SetupPerformanceRow } from '@/services/advancedAnalyticsEngine';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortKey = keyof SetupPerformanceRow;

interface SetupIntelligenceSectionProps {
  rows: SetupPerformanceRow[];
  themeConfig: {
    foreground: string;
    mutedForeground: string;
    border: string;
    card: string;
    accent: string;
    success: string;
    destructive: string;
  };
}

function formatVal(
  v: number | null | undefined,
  decimals = 2,
  suffix = '',
  fallback = '—'
): string {
  if (v == null || !Number.isFinite(v)) return fallback;
  return `${v.toFixed(decimals)}${suffix}`;
}

export function SetupIntelligenceSection({ rows, themeConfig }: SetupIntelligenceSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>('expectancyR');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const numA = typeof av === 'number' ? av : av == null ? -Infinity : 0;
      const numB = typeof bv === 'number' ? bv : bv == null ? -Infinity : 0;
      const cmp = numA - numB;
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc]);

  const bestExpectancy = rows.length
    ? Math.max(...rows.map((r) => r.expectancyR ?? -Infinity).filter(Number.isFinite), -Infinity)
    : -Infinity;
  const worstExpectancy = rows.length
    ? Math.min(...rows.map((r) => r.expectancyR ?? Infinity).filter(Number.isFinite), Infinity)
    : Infinity;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <th
      className="text-right p-2 cursor-pointer hover:opacity-80 select-none"
      onClick={() => toggleSort(sk)}
      style={{ color: themeConfig.mutedForeground }}
    >
      <span className="flex items-center justify-end gap-1">
        {label}
        {sortKey === sk ? (
          sortAsc ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
        )}
      </span>
    </th>
  );

  const reliabilityColor = (r: SetupPerformanceRow) => {
    if (r.reliability === 'High') return themeConfig.success;
    if (r.reliability === 'Moderate') return themeConfig.accent;
    return themeConfig.mutedForeground;
  };

  if (rows.length === 0) {
    return (
      <Card shineBorder className="p-6" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: themeConfig.foreground }}>
          Setup Intelligence
        </h2>
        <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
          No setup data available for current filters.
        </p>
      </Card>
    );
  }

  return (
    <Card shineBorder className="p-6" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: themeConfig.foreground }}>
        Setup Intelligence
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: themeConfig.border }}>
              <th className="text-left p-2" style={{ color: themeConfig.mutedForeground }}>
                Setup
              </th>
              <SortHeader label="Trades" sortKey="totalTrades" />
              <SortHeader label="Win %" sortKey="winRate" />
              <SortHeader label="Avg R" sortKey="avgR" />
              <SortHeader label="Expectancy R" sortKey="expectancyR" />
              <SortHeader label="Profit Factor" sortKey="profitFactor" />
              <SortHeader label="Max DD R" sortKey="maxDrawdownR" />
              <th className="text-right p-2" style={{ color: themeConfig.mutedForeground }}>
                Reliability
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isBest =
                row.expectancyR != null &&
                Number.isFinite(row.expectancyR) &&
                row.expectancyR === bestExpectancy &&
                bestExpectancy > -Infinity;
              const isWorst =
                row.expectancyR != null &&
                Number.isFinite(row.expectancyR) &&
                row.expectancyR === worstExpectancy &&
                worstExpectancy < Infinity &&
                rows.length > 1;
              return (
                <tr
                  key={row.setupName}
                  className="border-b"
                  style={{
                    borderColor: themeConfig.border,
                    backgroundColor: isBest ? `${themeConfig.success}15` : isWorst ? `${themeConfig.destructive}10` : undefined,
                  }}
                >
                  <td className="p-2 font-medium" style={{ color: themeConfig.foreground }}>
                    {row.setupName}
                  </td>
                  <td className="p-2 text-right" style={{ color: themeConfig.foreground }}>
                    {row.totalTrades}
                  </td>
                  <td className="p-2 text-right" style={{ color: (row.winRate ?? 0) >= 50 ? themeConfig.success : themeConfig.destructive }}>
                    {formatVal(row.winRate, 1, '%')}
                  </td>
                  <td className="p-2 text-right" style={{ color: (row.avgR ?? 0) >= 1 ? themeConfig.success : themeConfig.destructive }}>
                    {formatVal(row.avgR)}
                  </td>
                  <td className="p-2 text-right" style={{ color: (row.expectancyR ?? 0) >= 0 ? themeConfig.success : themeConfig.destructive }}>
                    {formatVal(row.expectancyR)}
                  </td>
                  <td className="p-2 text-right" style={{ color: (row.profitFactor ?? 0) >= 1 ? themeConfig.success : themeConfig.destructive }}>
                    {formatVal(row.profitFactor)}
                  </td>
                  <td className="p-2 text-right" style={{ color: themeConfig.foreground }}>
                    {formatVal(row.maxDrawdownR)}
                  </td>
                  <td className="p-2 text-right">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: reliabilityColor(row),
                        color: reliabilityColor(row),
                        fontSize: '0.7rem',
                      }}
                    >
                      {row.reliability}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
