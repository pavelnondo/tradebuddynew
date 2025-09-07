import React from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface HourlyPerformanceProps {
  data: Array<{
    hourFormatted: string;
    profitLoss: number;
    winRate: number;
  }>;
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function HourlyPerformanceChart({
  data,
  isEmpty = false,
  isLoading = false
}: HourlyPerformanceProps) {
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.profitLoss === 'number' && 
    !isNaN(item.profitLoss) &&
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    item.hourFormatted
  ) : [];

  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="chart-loading">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading hourly performance...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty || safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <Clock className="icon" />
          <div>No time-based analysis data available yet.</div>
        </div>
      </div>
    );
  }

  // Sort by hour for chronological display
  const sortedData = [...safeData].sort((a, b) => {
    const hourA = parseInt(a.hourFormatted.split(':')[0]);
    const hourB = parseInt(b.hourFormatted.split(':')[0]);
    return hourA - hourB;
  });

  const maxProfit = Math.max(...sortedData.map(item => Math.abs(item.profitLoss)));
  const totalProfit = sortedData.reduce((sum, item) => sum + item.profitLoss, 0);
  const bestHour = sortedData.reduce((best, item) => 
    item.profitLoss > best.profitLoss ? item : best, sortedData[0]
  );

  return (
    <div className="chart-container">
      <div className="chart-title">Hourly Performance Analysis</div>
      <div className="chart-subtitle">
        Total P&L: 
        <span className={`ml-1 font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalProfit.toLocaleString()}
        </span>
      </div>
      
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const percentage = maxProfit > 0 ? (Math.abs(item.profitLoss) / maxProfit) * 100 : 0;
          const isProfit = item.profitLoss >= 0;
          const colorClass = isProfit ? 'profit' : 'loss';
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{item.hourFormatted}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="font-semibold">
                      {isProfit ? '+' : ''}${item.profitLoss.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {item.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
              
              <table className="charts-css bar" role="chart">
                <tbody>
                  <tr>
                    <td 
                      className={colorClass}
                      style={{ 
                        '--size': `${percentage}%`,
                        '--color-chart-1': isProfit ? 'var(--color-profit)' : 'var(--color-loss)'
                      } as React.CSSProperties}
                    >
                      <span className="data">
                        {isProfit ? '+' : ''}${item.profitLoss.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      
      {bestHour && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium">Best Trading Hour</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                {bestHour.hourFormatted}
              </div>
              <div className="text-sm text-muted-foreground">
                +${bestHour.profitLoss.toLocaleString()} • {bestHour.winRate.toFixed(1)}% win rate
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}