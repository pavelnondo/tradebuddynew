import React from 'react';
import { cn } from '@/lib/utils';

interface WinLossChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

export function WinLossChart({ data }: WinLossChartProps) {
  // Ensure data is always an array and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0 &&
    item.label &&
    item.color
  ) : [];

  if (safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <div className="icon">📊</div>
          <div>No win/loss data available yet.</div>
        </div>
      </div>
    );
  }

  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  const winData = safeData.find(item => item.label.toLowerCase().includes('win')) || { value: 0 };
  const lossData = safeData.find(item => item.label.toLowerCase().includes('loss')) || { value: 0 };
  
  const winPercentage = total > 0 ? (winData.value / total) * 100 : 0;
  const lossPercentage = total > 0 ? (lossData.value / total) * 100 : 0;

  return (
    <div className="chart-container">
      <div className="chart-title">Win/Loss Ratio</div>
      <div className="flex flex-col items-center space-y-4">
        <div 
          className="doughnut-chart"
          style={{ '--win-percentage': `${winPercentage}%` } as React.CSSProperties}
        >
          <div className="doughnut-center">
            <div className="percentage">{winPercentage.toFixed(1)}%</div>
            <div className="label">Win Rate</div>
          </div>
        </div>
        
        <div className="flex space-x-6 text-sm">
          {safeData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">
                {item.label}: <span className="font-medium text-foreground">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Total Trades: <span className="font-medium text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}