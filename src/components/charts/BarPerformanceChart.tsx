import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface AssetPerformance {
  asset: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface BarPerformanceChartProps {
  data: AssetPerformance[];
}

export function BarPerformanceChart({ data }: BarPerformanceChartProps) {
  // Ensure data is always an array and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    item.asset &&
    typeof item.profitLoss === 'number' && 
    !isNaN(item.profitLoss) &&
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    typeof item.trades === 'number' && 
    !isNaN(item.trades)
  ) : [];
  
  if (safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <Target className="icon" />
          <div>No asset performance data available yet.</div>
        </div>
      </div>
    );
  }

  // Sort by profit/loss for better visualization
  const sortedData = [...safeData].sort((a, b) => b.profitLoss - a.profitLoss);
  const maxProfit = Math.max(...sortedData.map(item => Math.abs(item.profitLoss)));
  const totalProfit = sortedData.reduce((sum, item) => sum + item.profitLoss, 0);

  return (
    <div className="chart-container">
      <div className="chart-title">Asset Performance</div>
      <div className="chart-subtitle">
        Total P&L: 
        <span className={`ml-1 font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalProfit.toLocaleString()}
        </span>
      </div>
      
      <table className="charts-css bar" role="chart">
        <tbody>
          {sortedData.map((item, index) => {
            const percentage = maxProfit > 0 ? (Math.abs(item.profitLoss) / maxProfit) * 100 : 0;
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
                  <span className="data">
                    {isProfit ? '+' : ''}${item.profitLoss.toLocaleString()}
                  </span>
                  <span className="label">{item.asset}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        {sortedData.slice(0, 2).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {item.profitLoss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium">{item.asset}</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.profitLoss >= 0 ? '+' : ''}${item.profitLoss.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.winRate.toFixed(1)}% win rate
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}