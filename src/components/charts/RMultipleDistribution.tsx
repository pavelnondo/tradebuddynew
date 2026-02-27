/**
 * R-Multiple Expectancy Distribution
 * 
 * X-axis: R-multiple bins
 * Color-code wins vs losses
 * Vertical reference lines: Break-even, Avg win, Avg loss
 * Annotate expectancy (E)
 * Purpose: Reveal payoff asymmetry and expectancy structure
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { ChartContainer } from './ChartContainer';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  formatChartValue,
  getTickCount,
  getTooltipOffset
} from '../../utils/chartConfig';

interface RMultipleDistributionData {
  bin: string;
  rMultiple: number;
  count: number;
  isWin: boolean;
  avgR: number;
}

interface RMultipleDistributionProps {
  data: RMultipleDistributionData[];
  avgWin?: number;
  avgLoss?: number;
  expectancy?: number;
}

export const RMultipleDistribution: React.FC<RMultipleDistributionProps> = ({
  data,
  avgWin = 0,
  avgLoss = 0,
  expectancy = 0
}) => {
  const { themeConfig } = useTheme();

  // Group by bin and separate wins/losses
  const groupedData = useMemo(() => {
    const bins: Record<string, { wins: number; losses: number; bin: string }> = {};
    
    data.forEach(item => {
      if (!bins[item.bin]) {
        bins[item.bin] = { wins: 0, losses: 0, bin: item.bin };
      }
      if (item.isWin) {
        bins[item.bin].wins += item.count;
      } else {
        bins[item.bin].losses += item.count;
      }
    });

    return Object.values(bins).sort((a, b) => {
      const order = ['≤-2R', '-2R to -1R', '-1R to 0', '0 to +1R', '+1R to +2R', '>+2R'];
      return order.indexOf(a.bin) - order.indexOf(b.bin);
    });
  }, [data]);

  const margins = getChartMargins();
  const axisConfig = getAxisConfig(themeConfig, 11);
  const gridConfig = getGridConfig(themeConfig, false);
  const tickCount = getTickCount(400);
  const tooltipOffset = getTooltipOffset();

  // Calculate reference line positions (in R-multiples)
  const avgWinR = avgWin / Math.abs(avgLoss || 1);
  const avgLossR = avgLoss / Math.abs(avgLoss || 1);

  return (
    <ChartContainer minHeight={420} className="w-full">
      <div style={{ width: '100%', height: '100%', minHeight: '420px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={420}>
        <BarChart data={groupedData} margin={margins}>
          <CartesianGrid
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
          <XAxis 
            dataKey="bin" 
            tickCount={groupedData.length}
            tick={axisConfig.tick}
            stroke={axisConfig.axisLineStroke}
            axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
            tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
          />
          <YAxis 
            tickCount={tickCount}
            tick={{ ...axisConfig.tick, fill: axisConfig.tickFill }}
            stroke={axisConfig.axisLineStroke}
            axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
            tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
          />
          <Tooltip 
            content={<ChartTooltip />}
            cursor={{ fill: themeConfig.border, fillOpacity: 0.1 }}
            offset={tooltipOffset.x}
          />
          <Legend wrapperStyle={{ color: themeConfig.chartText, paddingTop: '12px', fontSize: '11px' }} />
          
          {/* Wins bars */}
          <Bar 
            dataKey="wins" 
            name="Wins"
            fill={themeConfig.success}
            fillOpacity={0.8}
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
            animationDuration={500}
          />
          
          {/* Losses bars (negative) */}
          <Bar 
            dataKey="losses" 
            name="Losses"
            fill={themeConfig.destructive}
            fillOpacity={0.8}
            radius={[0, 0, 8, 8]}
            isAnimationActive={true}
            animationDuration={500}
          />

          {/* Reference lines */}
          {avgWinR !== 0 && (
            <ReferenceLine 
              x={avgWinR > 2 ? '>+2R' : avgWinR > 1 ? '+1R to +2R' : '0 to +1R'}
              stroke={themeConfig.success}
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: `Avg Win: ${avgWinR.toFixed(1)}R`, position: 'top', fill: themeConfig.success }}
            />
          )}
          {avgLossR !== 0 && (
            <ReferenceLine 
              x={avgLossR < -2 ? '≤-2R' : avgLossR < -1 ? '-2R to -1R' : '-1R to 0'}
              stroke={themeConfig.destructive}
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: `Avg Loss: ${avgLossR.toFixed(1)}R`, position: 'bottom', fill: themeConfig.destructive }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      </div>

      {/* Expectancy annotation */}
      {expectancy !== 0 && (
        <div className="mt-4 text-center text-sm" style={{ color: themeConfig.foreground }}>
          <span className="font-semibold">Expectancy (E): </span>
          <span style={{ color: expectancy > 0 ? themeConfig.success : themeConfig.destructive }}>
            {expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)}R
          </span>
        </div>
      )}
    </ChartContainer>
  );
};
