import React from 'react';
import { Clock, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface BestTradingHour {
  hourFormatted: string;
  winRate: number;
  profitLoss: number;
}

interface BestTradingHoursChartProps {
  data: BestTradingHour[];
}

export function BestTradingHoursChart({ data }: BestTradingHoursChartProps) {
  // Ensure data is always an array and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    item.hourFormatted &&
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    typeof item.profitLoss === 'number' && 
    !isNaN(item.profitLoss)
  ) : [];
  
  if (safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <Clock className="icon" />
          <div>No trading hours data available yet.</div>
        </div>
      </div>
    );
  }

  // Sort by win rate for better visualization
  const sortedData = [...safeData].sort((a, b) => b.winRate - a.winRate);
  const maxWinRate = Math.max(...sortedData.map(item => item.winRate));
  const totalProfit = sortedData.reduce((sum, item) => sum + item.profitLoss, 0);
  const bestHour = sortedData[0];

  return (
    <div className="chart-container">
      <div className="chart-title">Best Trading Hours</div>
      <div className="chart-subtitle">
        Total P&L: 
        <span className={`ml-1 font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalProfit.toLocaleString()}
        </span>
      </div>
      
      <table className="charts-css bar" role="chart">
        <tbody>
          {sortedData.map((item, index) => {
            const percentage = maxWinRate > 0 ? (item.winRate / maxWinRate) * 100 : 0;
            const isProfit = item.profitLoss >= 0;
            const colorClass = isProfit ? 'profit' : 'loss';
            
            return (
              <tr key={index}>
                <td 
                  className={colorClass}
                  style={{ 
                    '--size': `${percentage}%`,
                    '--color-chart-1': isProfit ? 'var(--color-profit)' : 'var(--color-loss)'
                  } as React.CSSProperties}
                >
                  <span className="data">{item.winRate.toFixed(1)}%</span>
                  <span className="label">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {item.hourFormatted}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Best Hour Highlight */}
      {bestHour && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Best Trading Hour</div>
                <div className="text-sm text-muted-foreground">
                  {bestHour.hourFormatted} • {bestHour.winRate.toFixed(1)}% win rate
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${bestHour.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bestHour.profitLoss >= 0 ? '+' : ''}${bestHour.profitLoss.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                P&L
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hour Performance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        {sortedData.slice(0, 8).map((item, index) => {
          const isProfit = item.profitLoss >= 0;
          return (
            <div key={index} className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-medium">{item.hourFormatted}</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {item.winRate.toFixed(1)}%
              </div>
              <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? '+' : ''}${item.profitLoss.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Performance Summary */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-muted-foreground">Best Hour:</span>
              <span className="ml-1 font-medium">{bestHour?.hourFormatted}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Win Rate:</span>
              <span className="ml-1 font-medium">
                {(sortedData.reduce((sum, item) => sum + item.winRate, 0) / sortedData.length).toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Hours:</span>
            <span className="ml-1 font-medium">{sortedData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}