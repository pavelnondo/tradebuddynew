import React, { useState, useEffect } from 'react';

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

const setupIcons: { [key: string]: string } = {
  'breakout': '🚀',
  'pullback': '📉',
  'reversal': '🔄',
  'scalp': '⚡',
  'swing': '🌊',
  'momentum': '💨',
  'support': '🛡️',
  'resistance': '🔒',
  'unknown': '❓'
};

export function SetupPerformanceChart({ data, isLoading }: SetupPerformanceChartProps) {
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
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
  
  const maxPnL = safeData.length > 0 ? Math.max(...safeData.map(d => Math.abs(d.totalPnL))) : 0;
  const maxTrades = safeData.length > 0 ? Math.max(...safeData.map(d => d.totalTrades)) : 0;

  // Animate cards on load
  useEffect(() => {
    if (safeData.length > 0) {
      setAnimatedCards([]);
      safeData.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedCards(prev => [...prev, index]);
        }, index * 150);
      });
    }
  }, [safeData]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">Loading Performance Data...</div>
        </div>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades with setups to see performance analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Setup Performance</h3>
        <p className="text-sm text-muted-foreground">Performance analysis by trading setup</p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {safeData.map((item, index) => {
          const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
          const isAnimated = animatedCards.includes(index);
          const isHovered = hoveredCard === index;
          const setup = item.setup.toLowerCase();
          const icon = setupIcons[setup] || setupIcons['unknown'];
          
          return (
            <div 
              key={index} 
              className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg transition-all duration-300 ${
                isHovered ? 'transform scale-105 shadow-xl' : ''
              } ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground capitalize">{item.setup}</h3>
                    <div className="text-sm text-muted-foreground">{item.totalTrades} trades</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.winRate.toFixed(0)}% win rate
                  </div>
                </div>
              </div>
              
              {/* P&L Bar */}
              <div className="relative mb-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      item.totalPnL >= 0 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
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
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{item.totalTrades}</div>
                  <div className="text-xs text-muted-foreground">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${item.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.winRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${item.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profitFactor.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Profit Factor</div>
                </div>
              </div>
              
              {/* Performance Badge */}
              <div className="mt-4 text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  item.winRate >= 60 && item.profitFactor >= 1.5
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : item.winRate >= 40 && item.profitFactor >= 1
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.winRate >= 60 && item.profitFactor >= 1.5 ? '🎯 Excellent' : 
                   item.winRate >= 40 && item.profitFactor >= 1 ? '📈 Good' : '📉 Needs Work'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}