import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TradeTypePerformance {
  type: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface TradeTypePerformanceChartProps {
  data: TradeTypePerformance[];
}

const typeIcons = {
  'long': ArrowUp,
  'short': ArrowDown,
  'buy': TrendingUp,
  'sell': TrendingDown,
};

const typeColors = {
  'long': 'var(--color-profit)',
  'short': 'var(--color-loss)',
  'buy': 'var(--color-profit)',
  'sell': 'var(--color-loss)',
};

export function TradeTypePerformanceChart({ data }: TradeTypePerformanceChartProps) {
  // Ensure data is always an array and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    item.type &&
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
          <TrendingUp className="icon" />
          <div>No trade type performance data available yet.</div>
        </div>
      </div>
    );
  }

  // Sort by profit/loss for better visualization
  const sortedData = [...safeData].sort((a, b) => b.profitLoss - a.profitLoss);
  const maxProfit = Math.max(...sortedData.map(item => Math.abs(item.profitLoss)));
  const totalProfit = sortedData.reduce((sum, item) => sum + item.profitLoss, 0);
  const totalTrades = sortedData.reduce((sum, item) => sum + item.trades, 0);

  return (
    <div className="chart-container">
      <div className="chart-title">Trade Type Performance</div>
      <div className="chart-subtitle">
        Total P&L: 
        <span className={`ml-1 font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalProfit.toLocaleString()}
        </span>
        • Total Trades: <span className="font-medium">{totalTrades}</span>
      </div>
      
      <table className="charts-css bar" role="chart">
        <tbody>
          {sortedData.map((item, index) => {
            const percentage = maxProfit > 0 ? (Math.abs(item.profitLoss) / maxProfit) * 100 : 0;
            const isProfit = item.profitLoss >= 0;
            const colorClass = isProfit ? 'profit' : 'loss';
            const IconComponent = typeIcons[item.type.toLowerCase() as keyof typeof typeIcons] || TrendingUp;
            const color = typeColors[item.type.toLowerCase() as keyof typeof typeColors] || 'var(--color-primary)';
            
            return (
              <tr key={index}>
                <td 
                  className={colorClass}
                  style={{ 
                    '--size': `${percentage}%`,
                    '--color-chart-1': color
                  } as React.CSSProperties}
                >
                  <span className="data">
                    {isProfit ? '+' : ''}${item.profitLoss.toLocaleString()}
                  </span>
                  <span className="label">
                    <IconComponent className="w-3 h-3 inline mr-1" />
                    {item.type}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Trade Type Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {sortedData.map((item, index) => {
          const IconComponent = typeIcons[item.type.toLowerCase() as keyof typeof typeIcons] || TrendingUp;
          const color = typeColors[item.type.toLowerCase() as keyof typeof typeColors] || 'var(--color-primary)';
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
                  <IconComponent className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="font-medium">{item.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.trades} trades • {item.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.profitLoss >= 0 ? '+' : ''}${item.profitLoss.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.wins}W / {item.losses}L
                </div>
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
              <span className="text-muted-foreground">Best Type:</span>
              <span className="ml-1 font-medium">{sortedData[0]?.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg P&L:</span>
              <span className={`ml-1 font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? '+' : ''}${(totalProfit / sortedData.length).toFixed(2)}
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Overall Win Rate:</span>
            <span className="ml-1 font-medium">
              {((sortedData.reduce((sum, item) => sum + item.wins, 0) / totalTrades) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}