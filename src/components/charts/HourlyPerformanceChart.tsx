import React, { useState, useEffect } from 'react';

interface HourlyPerformanceChartProps {
  data: Array<{ hour: number; hourFormatted: string; totalPnL: number; winRate: number; totalTrades: number }>;
}

export function HourlyPerformanceChart({ data }: HourlyPerformanceChartProps) {
  const [animatedBars, setAnimatedBars] = useState<number[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.totalPnL === 'number' && 
    typeof item.totalTrades === 'number' && 
    typeof item.winRate === 'number' &&
    !isNaN(item.totalPnL) && 
    !isNaN(item.totalTrades) && 
    !isNaN(item.winRate)
  ) : [];
  
  const maxPnL = safeData.length > 0 ? Math.max(...safeData.map(d => Math.abs(d.totalPnL))) : 0;
  const maxTrades = safeData.length > 0 ? Math.max(...safeData.map(d => d.totalTrades)) : 0;

  // Animate bars on load
  useEffect(() => {
    if (safeData.length > 0) {
      setAnimatedBars([]);
      safeData.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedBars(prev => [...prev, index]);
        }, index * 150);
      });
    }
  }, [safeData]);
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades to see hourly performance</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Hourly Performance</h3>
        <p className="text-sm text-muted-foreground">Profit/Loss and win rate by hour</p>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {safeData.slice(0, 8).map((item, index) => {
          const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
          const isAnimated = animatedBars.includes(index);
          const isHovered = hoveredBar === index;
          
          return (
            <div 
              key={index} 
              className={`group transition-all duration-300 ${isHovered ? 'transform scale-105' : ''}`}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-semibold text-foreground">{item.hourFormatted}</span>
                </div>
                <div className={`text-lg font-bold ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toFixed(0)}
                </div>
              </div>
              
              {/* P&L Bar */}
              <div className="relative mb-2">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      item.totalPnL >= 0 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    } ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
                    style={{ 
                      width: isAnimated ? `${pnlWidth}%` : '0%',
                      boxShadow: isHovered ? `0 0 20px ${item.totalPnL >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` : 'none'
                    }}
                  />
                </div>
                
                {/* Animated glow effect */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-muted-foreground">{item.totalTrades} trades</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-medium ${item.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.winRate.toFixed(0)}% win rate
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {safeData.reduce((sum, item) => sum + item.totalTrades, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${safeData.reduce((sum, item) => sum + item.totalPnL, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {safeData.reduce((sum, item) => sum + item.totalPnL, 0) >= 0 ? '+' : ''}${safeData.reduce((sum, item) => sum + item.totalPnL, 0).toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Total P&L</div>
          </div>
        </div>
      </div>
    </div>
  );
}
