import React from 'react';

interface SetupPerformanceChartProps {
  data: Array<{
    setup: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    profitFactor: number;
  }>;
  isLoading?: boolean;
}

export function SetupPerformanceChart({ data, isLoading }: SetupPerformanceChartProps) {
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.totalTrades === 'number' && 
    typeof item.winRate === 'number' && 
    typeof item.totalPnL === 'number' &&
    typeof item.profitFactor === 'number' &&
    !isNaN(item.totalTrades) && 
    !isNaN(item.winRate) && 
    !isNaN(item.totalPnL) &&
    !isNaN(item.profitFactor)
  ) : [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades with setups to see performance analysis</div>
        </div>
      </div>
    );
  }

  const maxPnL = safeData.length > 0 ? Math.max(...safeData.map(d => Math.abs(d.totalPnL))) : 0;
  const maxTrades = safeData.length > 0 ? Math.max(...safeData.map(d => d.totalTrades)) : 0;

  return (
    <div className="w-full">
      <div className="space-y-4">
        {safeData.map((item, index) => {
          const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
          const tradesWidth = maxTrades > 0 ? (item.totalTrades / maxTrades) * 100 : 0;
          
          return (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{item.setup}</h3>
                <div className="flex space-x-4 text-sm">
                  <span className={`font-medium ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.totalPnL.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">
                    {item.winRate.toFixed(0)}% win rate
                  </span>
                </div>
              </div>
              
              {/* P&L bar */}
              <div className="w-full bg-muted rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${item.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${pnlWidth}%` }}
                />
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trades: </span>
                  <span className="font-medium">{item.totalTrades}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Win Rate: </span>
                  <span className="font-medium">{item.winRate.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Profit Factor: </span>
                  <span className="font-medium">{item.profitFactor.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
