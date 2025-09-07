import React from 'react';

interface HourlyPerformanceChartProps {
  data: Array<{ hour: number; hourFormatted: string; totalPnL: number; winRate: number; totalTrades: number }>;
}

export function HourlyPerformanceChart({ data }: HourlyPerformanceChartProps) {
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.totalPnL === 'number' && 
    typeof item.totalTrades === 'number' && 
    typeof item.winRate === 'number' &&
    !isNaN(item.totalPnL) && 
    !isNaN(item.totalTrades) && 
    !isNaN(item.winRate)
  ) : [];
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades to see hourly performance</div>
        </div>
      </div>
    );
  }

  const maxPnL = safeData.length > 0 ? Math.max(...safeData.map(d => Math.abs(d.totalPnL))) : 0;
  const maxTrades = safeData.length > 0 ? Math.max(...safeData.map(d => d.totalTrades)) : 0;

  return (
    <div className="w-full h-full p-4">
      <div className="space-y-3">
        {safeData.slice(0, 8).map((item, index) => {
          const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
          const tradesWidth = maxTrades > 0 ? (item.totalTrades / maxTrades) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.hourFormatted}</span>
                <span className={`font-medium ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${item.totalPnL.toFixed(0)}
                </span>
              </div>
              
              {/* P&L bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${pnlWidth}%` }}
                />
              </div>
              
              {/* Trades count */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.totalTrades} trades</span>
                <span>{item.winRate.toFixed(0)}% win rate</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
