import React from 'react';
import { BarChart3 } from 'lucide-react';

interface TradeCountChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function TradeCountChart({ data, isEmpty = false, isLoading = false }: TradeCountChartProps) {
  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="chart-loading">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading trading frequency...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.count === 'number' && 
    !isNaN(item.count) && 
    item.count >= 0 &&
    item.date
  ) : [];
  
  if (isEmpty || safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <BarChart3 className="icon" />
          <div>No trading frequency data available yet.</div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...safeData.map(item => item.count));
  const totalTrades = safeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="chart-container">
      <div className="chart-title">Trading Frequency (Last 14 Days)</div>
      <div className="chart-subtitle">Total: {totalTrades} trades</div>
      
      <table className="charts-css bar" role="chart">
        <tbody>
          {safeData.map((item, index) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            
            return (
              <tr key={index}>
                <td 
                  className="primary"
                  style={{ 
                    '--size': `${percentage}%`,
                    '--color-chart-1': item.count > 0 ? 'var(--color-primary)' : 'var(--color-axis)'
                  } as React.CSSProperties}
                >
                  <span className="data">{item.count}</span>
                  <span className="label">{formattedDate}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
        <div>Most active: {safeData.reduce((max, item) => item.count > max.count ? item : max, safeData[0])?.date}</div>
        <div>Avg: {(totalTrades / safeData.length).toFixed(1)} trades/day</div>
      </div>
    </div>
  );
}