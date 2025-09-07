import React from 'react';

interface EmotionsWinRateChartProps {
  data: Array<{ emotion: string; winRate: number; totalTrades: number; totalPnL: number }>;
}

export function EmotionsWinRateChart({ data }: EmotionsWinRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades with emotions to see analysis</div>
        </div>
      </div>
    );
  }

  const maxWinRate = Math.max(...data.map(d => d.winRate));
  const maxTrades = Math.max(...data.map(d => d.totalTrades));

  return (
    <div className="w-full h-full p-4">
      <div className="space-y-4">
        {data.slice(0, 6).map((item, index) => {
          const winRateWidth = maxWinRate > 0 ? (item.winRate / maxWinRate) * 100 : 0;
          const tradesWidth = maxTrades > 0 ? (item.totalTrades / maxTrades) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{item.emotion}</span>
                <span className="text-sm font-medium">{item.winRate.toFixed(0)}%</span>
              </div>
              
              {/* Win rate bar */}
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${winRateWidth}%` }}
                />
              </div>
              
              {/* Stats */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.totalTrades} trades</span>
                <span className={item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${item.totalPnL.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
