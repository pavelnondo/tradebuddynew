/**
 * Emotion vs Outcome Heatmap - Calendar Style
 * 
 * Calendar-style grid layout for better readability
 * Shows which emotions correlate with performance outcomes
 */

import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartContainer } from './ChartContainer';
import { Emotion } from '@/types/trade';

interface EmotionOutcomeData {
  emotion: Emotion;
  outcome: 'Win' | 'Loss' | 'Break-even';
  count: number;
  avgPnL: number;
  winRate: number;
  avgR: number;
}

interface EmotionOutcomeHeatmapProps {
  data: EmotionOutcomeData[];
  metric?: 'winRate' | 'avgR';
}

export const EmotionOutcomeHeatmap: React.FC<EmotionOutcomeHeatmapProps> = ({
  data,
  metric = 'avgR'
}) => {
  const { themeConfig } = useTheme();

  // Get unique emotions and outcomes
  const emotions = useMemo(() => {
    const unique = Array.from(new Set(data.map(d => d.emotion)));
    return unique.sort();
  }, [data]);

  const outcomes = ['Win', 'Loss', 'Break-even'] as const;

  // Create heatmap grid
  const heatmapData = useMemo(() => {
    const grid: Array<{
      emotion: Emotion;
      outcome: 'Win' | 'Loss' | 'Break-even';
      value: number;
      count: number;
      avgPnL: number;
      winRate: number;
      avgR: number;
      x: number;
      y: number;
    }> = [];

    emotions.forEach((emotion, xIdx) => {
      outcomes.forEach((outcome, yIdx) => {
        const cellData = data.find(
          d => d.emotion === emotion && d.outcome === outcome
        );
        
        const value = cellData 
          ? (metric === 'winRate' ? cellData.winRate : cellData.avgR)
          : 0;

        grid.push({
          emotion,
          outcome,
          value,
          count: cellData?.count || 0,
          avgPnL: cellData?.avgPnL || 0,
          winRate: cellData?.winRate || 0,
          avgR: cellData?.avgR || 0,
          x: xIdx,
          y: yIdx,
        });
      });
    });

    return grid;
  }, [data, emotions, outcomes, metric]);

  // Calculate color scale
  const getColor = (value: number, max: number, min: number) => {
    if (max === min) return themeConfig.muted;
    
    const normalized = (value - min) / (max - min);
    
    if (metric === 'winRate') {
      const intensity = Math.max(0, Math.min(1, normalized));
      return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
    } else {
      if (value >= 0) {
        const intensity = Math.max(0, Math.min(1, normalized / Math.max(Math.abs(max), Math.abs(min))));
        return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
      } else {
        const intensity = Math.max(0, Math.min(1, Math.abs(value) / Math.max(Math.abs(max), Math.abs(min))));
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
      }
    }
  };

  const values = heatmapData.map(d => d.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);

  // Calendar-style: larger cells, better spacing
  const cellSize = 100;
  const cellGap = 8;
  const headerHeight = 50;
  const labelWidth = 120;
  const padding = { top: headerHeight, right: 20, bottom: 60, left: labelWidth };
  
  const gridWidth = emotions.length * (cellSize + cellGap);
  const gridHeight = outcomes.length * (cellSize + cellGap);
  const totalWidth = padding.left + gridWidth + padding.right;
  const totalHeight = padding.top + gridHeight + padding.bottom;

  return (
    <ChartContainer minHeight={400} className="w-full">
      <div className="w-full h-full" style={{ minHeight: '400px', padding: '20px' }}>
        {/* Calendar-style grid */}
        <div className="w-full" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: `${totalWidth}px` }}>
            {/* Header row - Emotions */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `${labelWidth}px repeat(${emotions.length}, ${cellSize}px)`,
              gap: `${cellGap}px`,
              marginBottom: `${cellGap}px`
            }}>
              <div></div>
              {emotions.map((emotion) => (
                <div
                  key={emotion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: themeConfig.foreground,
                    textAlign: 'center',
                    padding: '8px 4px',
                    wordBreak: 'break-word'
                  }}
                >
                  {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </div>
              ))}
            </div>

            {/* Data rows - Outcomes */}
            {outcomes.map((outcome, yIdx) => (
              <div
                key={outcome}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `${labelWidth}px repeat(${emotions.length}, ${cellSize}px)`,
                  gap: `${cellGap}px`,
                  marginBottom: `${cellGap}px`
                }}
              >
                {/* Outcome label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: themeConfig.foreground,
                    paddingRight: '12px'
                  }}
                >
                  {outcome}
                </div>

                {/* Cells */}
                {emotions.map((emotion, xIdx) => {
                  const cell = heatmapData.find(
                    d => d.emotion === emotion && d.outcome === outcome
                  );
                  const color = cell ? getColor(cell.value, maxValue, minValue) : themeConfig.muted;

                  return (
                    <div
                      key={`${emotion}-${outcome}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: color,
                        border: `1px solid ${themeConfig.border}`,
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        padding: '8px',
                        boxSizing: 'border-box'
                      }}
                      className="hover:opacity-80"
                      title={`${emotion} - ${outcome}: ${cell?.count || 0} trades, ${metric === 'winRate' ? `${cell?.winRate.toFixed(0)}%` : `${cell?.avgR > 0 ? '+' : ''}${cell?.avgR.toFixed(1)}R`}`}
                    >
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: themeConfig.foreground,
                          marginBottom: '4px'
                        }}
                      >
                        {cell?.count || 0}
                      </div>
                      {cell && cell.count > 0 && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: themeConfig.mutedForeground,
                            textAlign: 'center'
                          }}
                        >
                          {metric === 'winRate' 
                            ? `${cell.winRate.toFixed(0)}%`
                            : `${cell.avgR > 0 ? '+' : ''}${cell.avgR.toFixed(1)}R`
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs" style={{ color: themeConfig.mutedForeground }}>
          <span>Color intensity: {metric === 'winRate' ? 'Win Rate' : 'Avg R-Multiple'}</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(minValue, maxValue, minValue) }} />
            <span>Low</span>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(maxValue, maxValue, minValue) }} />
            <span>High</span>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};
