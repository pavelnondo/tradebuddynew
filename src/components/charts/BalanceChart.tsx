import React from 'react';

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number }>;
}

export function BalanceChart({ balanceOverTime }: BalanceChartProps) {
  const data = Array.isArray(balanceOverTime) ? balanceOverTime.filter(item => 
    item && 
    typeof item.date === 'string' && 
    typeof item.balance === 'number' && 
    !isNaN(item.balance)
  ) : [];
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades to see balance progression</div>
        </div>
      </div>
    );
  }

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const range = maxBalance - minBalance;
  const padding = range * 0.1;

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* Simple line path */}
        <path
          d={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 380 + 10;
            const y = 190 - ((point.balance - minBalance + padding) / (range + padding * 2)) * 180;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 380 + 10;
          const y = 190 - ((point.balance - minBalance + padding) / (range + padding * 2)) * 180;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="currentColor"
              className="text-primary"
            />
          );
        })}
      </svg>
      
      {/* Simple labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
        <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString() : ''}</span>
        <span>{data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString() : ''}</span>
      </div>
      
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground py-2">
        <span>${maxBalance.toLocaleString()}</span>
        <span>${minBalance.toLocaleString()}</span>
      </div>
    </div>
  );
}
