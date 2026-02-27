import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RollingMetricsResult } from '@/services/advancedAnalyticsEngine';
import { getChartMargins, getAxisConfig, getGridConfig } from '@/utils/chartConfig';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RollingPerformanceSectionProps {
  data: RollingMetricsResult;
  themeConfig: {
    foreground: string;
    mutedForeground: string;
    border: string;
    card: string;
    accent: string;
    success: string;
    destructive: string;
    chartLine: string;
  };
}

export function RollingPerformanceSection({ data, themeConfig }: RollingPerformanceSectionProps) {
  const { rollingSeries, trendDirection, windowSize } = data;

  const chartData = rollingSeries.map((s) => ({
    index: s.index,
    label: `Trade #${s.index + 1}`,
    rollingExpectancy: s.rollingExpectancy ?? 0,
    rollingWinRate: s.rollingWinRate != null ? s.rollingWinRate / 100 : null,
  }));

  const trendIcon =
    trendDirection === 'Improving' ? (
      <TrendingUp className="w-4 h-4" style={{ color: themeConfig.success }} />
    ) : trendDirection === 'Deteriorating' ? (
      <TrendingDown className="w-4 h-4" style={{ color: themeConfig.destructive }} />
    ) : (
      <Minus className="w-4 h-4" style={{ color: themeConfig.mutedForeground }} />
    );

  const trendColor =
    trendDirection === 'Improving'
      ? themeConfig.success
      : trendDirection === 'Deteriorating'
      ? themeConfig.destructive
      : themeConfig.mutedForeground;

  if (rollingSeries.length === 0) {
    return (
      <Card shineBorder className="p-6" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: themeConfig.foreground }}>
          Rolling Performance
        </h2>
        <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
          Need at least {windowSize} trades to compute rolling metrics.
        </p>
      </Card>
    );
  }

  return (
    <Card shineBorder className="p-6" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold" style={{ color: themeConfig.foreground }}>
          Rolling Performance
        </h2>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            style={{
              borderColor: trendColor,
              color: trendColor,
              fontSize: '0.8rem',
            }}
          >
            {trendIcon}
            <span className="ml-1">{trendDirection}</span>
          </Badge>
          <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
            Window: {windowSize} trades
          </span>
        </div>
      </div>

      <div className="w-full min-h-[360px]" style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height={360} minHeight={360} minWidth={0}>
          <ComposedChart data={chartData} margin={getChartMargins()}>
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke={getGridConfig(themeConfig, true).stroke}
              strokeOpacity={getGridConfig(themeConfig, true).strokeOpacity}
              strokeDasharray={getGridConfig(themeConfig, true).strokeDasharray}
            />
            <XAxis
              dataKey="index"
              tickFormatter={(v) => `#${v + 1}`}
              {...getAxisConfig(themeConfig, 10)}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(2) : v)}
              {...getAxisConfig(themeConfig, 10)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => (typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : v)}
              {...getAxisConfig(themeConfig, 10)}
            />
            <Tooltip
              content={
                <ChartTooltip
                  labelFormatter={(l) => (typeof l === 'number' ? `Trade #${l + 1}` : String(l))}
                  valueFormatter={(v, name) => {
                    if ((name === 'rollingWinRate' || name === 'Win Rate %') && typeof v === 'number')
                      return `${(v * 100).toFixed(1)}%`;
                    if (typeof v === 'number') return v.toFixed(2) + 'R';
                    return String(v);
                  }}
                />
              }
              cursor={{ stroke: themeConfig.border, strokeWidth: 1, strokeDasharray: '2 2' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rollingExpectancy"
              stroke={themeConfig.chartLine}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Expectancy (R)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rollingWinRate"
              stroke={themeConfig.accent}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4 }}
              name="Win Rate %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
