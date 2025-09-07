import React from 'react';

interface WinLossChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
}

export function WinLossChart({ data }: WinLossChartProps) {
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value)
  ) : [];
  
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades to see win/loss breakdown</div>
        </div>
      </div>
    );
  }

  const winData = safeData.find(item => item.label.toLowerCase().includes('win')) || { value: 0 };
  const lossData = safeData.find(item => item.label.toLowerCase().includes('loss')) || { value: 0 };
  
  const winPercentage = (winData.value / total) * 100;
  const lossPercentage = (lossData.value / total) * 100;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        {/* Simple circle with conic gradient */}
        <div 
          className="w-32 h-32 rounded-full"
          style={{
            background: `conic-gradient(
              #10b981 0deg ${winPercentage * 3.6}deg,
              #ef4444 ${winPercentage * 3.6}deg 360deg
            )`
          }}
        />
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{winPercentage.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="ml-6 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Wins: {winData.value}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Losses: {lossData.value}</span>
        </div>
      </div>
    </div>
  );
}
