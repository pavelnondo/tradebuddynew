/**
 * Emotion Chart Component - Refactored with Opacity Hierarchy
 * 
 * Dominant emotion: 100% opacity
 * Secondary: ~60% opacity
 * Minor: ~30% opacity
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartTooltip } from './ChartTooltip';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  getTickCount,
  getTooltipOffset
} from '@/utils/chartConfig';

interface EmotionChartProps {
  data: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
  title: string;
}

export const EmotionChart: React.FC<EmotionChartProps> = ({ data, title }) => {
  const { themeConfig } = useTheme();

  // Emotion color mapping
  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      'Confident': '#10b981', // Green
      'Calm': '#3b82f6', // Blue
      'Excited': '#f59e0b', // Amber
      'Nervous': '#ef4444', // Red
      'Frustrated': '#dc2626', // Dark Red
      'Greedy': '#7c3aed', // Purple
      'Fearful': '#6b7280', // Gray
      'FOMO': '#ec4899', // Pink
      'Satisfied': '#059669', // Dark Green
      'Disappointed': '#f97316' // Orange
    };
    return emotionColors[emotion] || '#6b7280';
  };

  // Sort data by count and assign opacity based on hierarchy
  const processedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const maxCount = sorted[0]?.count || 1;
    
    return sorted.map((item, index) => {
      const ratio = item.count / maxCount;
      let opacity = 1.0;
      
      if (ratio >= 0.7) {
        opacity = 1.0; // Dominant
      } else if (ratio >= 0.4) {
        opacity = 0.6; // Secondary
      } else {
        opacity = 0.3; // Minor
      }
      
      return {
        ...item,
        opacity,
        color: getEmotionColor(item.emotion)
      };
    });
  }, [data]);

  const margins = getChartMargins();
  const axisConfig = getAxisConfig(themeConfig, 11);
  const gridConfig = getGridConfig(themeConfig, false);
  const tickCount = getTickCount(400);
  const tooltipOffset = getTooltipOffset();

  return (
    <div className="w-full min-h-[400px]" style={{ minWidth: 0 }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: themeConfig.foreground }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={400} minHeight={400}>
        <BarChart data={processedData} margin={margins}>
          <CartesianGrid
            stroke={gridConfig.stroke}
            strokeOpacity={gridConfig.strokeOpacity}
            strokeDasharray={gridConfig.strokeDasharray}
          />
          <XAxis 
            dataKey="emotion" 
            tickCount={Math.min(tickCount, processedData.length)}
            tick={axisConfig.tick}
            stroke={axisConfig.axisLineStroke}
            axisLine={{ stroke: axisConfig.axisLineStroke, strokeWidth: 1 }}
            tickLine={{ stroke: axisConfig.tickLineStroke, strokeWidth: 1 }}
            angle={-45}
            textAnchor="end"
            height={80}
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
          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
            animationDuration={500}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                fillOpacity={entry.opacity}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
