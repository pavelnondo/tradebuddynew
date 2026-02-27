/**
 * R-Multiple Outcome Buckets
 * 
 * Buckets: ≤-1R, -1R to 0, 0 to +1R, +1R to +2R, >+2R
 * Horizontal bars
 * Percent of total trades labeled
 * Purpose: Show where profits actually come from
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
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

interface RMultipleBucketData {
  bucket: string;
  count: number;
  percentage: number;
  avgR: number;
  totalPnL: number;
}

interface RMultipleBucketsProps {
  data: RMultipleBucketData[];
}

export const RMultipleBuckets: React.FC<RMultipleBucketsProps> = ({ data }) => {
  const { themeConfig } = useTheme();

  // Sort buckets in order
  const bucketOrder = ['≤-1R', '-1R to 0', '0 to +1R', '+1R to +2R', '>+2R'];
  const sortedData = [...data].sort((a, b) => {
    return bucketOrder.indexOf(a.bucket) - bucketOrder.indexOf(b.bucket);
  });

  const margins = getChartMargins();
  const axisConfig = getAxisConfig(themeConfig, 11);
  const gridConfig = getGridConfig(themeConfig, false);
  const tickCount = getTickCount(400);
  const tooltipOffset = getTooltipOffset();

  // Get color for each bucket
  const getBucketColor = (bucket: string) => {
    if (bucket.includes('≤-1R') || bucket.includes('-1R to 0')) {
      return themeConfig.destructive;
    } else if (bucket.includes('0 to +1R')) {
      return themeConfig.muted;
    } else {
      return themeConfig.success;
    }
  };

  // Custom label component
  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    return (
      <text
        x={x + width + 8}
        y={y + 12}
        fill={themeConfig.foreground}
        fontSize="11"
        fontWeight="500"
      >
        {value.toFixed(1)}%
      </text>
    );
  };

  return (
    <ChartContainer minHeight={400} className="w-full">
      <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
        <BarChart 
          data={sortedData} 
          layout="vertical"
          margin={{ ...margins, left: 80, right: 100 }}
        >
          <CartesianGrid
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            type="number"
            tickCount={tickCount}
            tick={{ ...axisConfig.tick, fill: axisConfig.tickFill }}
            stroke={axisConfig.axisLineStroke}
            axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
            tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
          />
          <YAxis 
            type="category"
            dataKey="bucket"
            tickCount={sortedData.length}
            tick={axisConfig.tick}
            stroke={axisConfig.axisLineStroke}
            axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
            tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
            width={70}
          />
          <Tooltip 
            content={<ChartTooltip valueFormatter={(v, name) => {
              if (name === 'percentage') return `${Number(v).toFixed(1)}%`;
              if (name === 'avgR') return `${Number(v).toFixed(2)}R`;
              if (name === 'totalPnL') return formatChartValue(Number(v), true);
              return String(v);
            }} />}
            cursor={{ fill: themeConfig.border, fillOpacity: 0.1 }}
            offset={tooltipOffset.x}
          />
          
          <Bar 
            dataKey="count" 
            radius={[0, 8, 8, 0]}
            isAnimationActive={true}
            animationDuration={500}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBucketColor(entry.bucket)} />
            ))}
            <LabelList content={<CustomLabel />} dataKey="percentage" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
