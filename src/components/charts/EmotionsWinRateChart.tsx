import React, { useState, useEffect } from 'react';

interface EmotionsWinRateChartProps {
  data: Array<{ emotion: string; winRate: number; totalTrades: number; totalPnL: number }>;
}

const emotionIcons: { [key: string]: string } = {
  'confident': '😎',
  'calm': '😌',
  'excited': '🤩',
  'nervous': '😰',
  'fearful': '😨',
  'greedy': '🤤',
  'frustrated': '😤',
  'neutral': '😐'
};

const emotionColors: { [key: string]: string } = {
  'confident': 'from-green-400 to-green-600',
  'calm': 'from-blue-400 to-blue-600',
  'excited': 'from-yellow-400 to-yellow-600',
  'nervous': 'from-orange-400 to-orange-600',
  'fearful': 'from-red-400 to-red-600',
  'greedy': 'from-purple-400 to-purple-600',
  'frustrated': 'from-pink-400 to-pink-600',
  'neutral': 'from-gray-400 to-gray-600'
};

export function EmotionsWinRateChart({ data }: EmotionsWinRateChartProps) {
  const [animatedBars, setAnimatedBars] = useState<number[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.winRate === 'number' && 
    typeof item.totalTrades === 'number' && 
    typeof item.totalPnL === 'number' &&
    !isNaN(item.winRate) && 
    !isNaN(item.totalTrades) && 
    !isNaN(item.totalPnL)
  ) : [];
  
  const maxWinRate = safeData.length > 0 ? Math.max(...safeData.map(d => d.winRate)) : 0;
  const maxTrades = safeData.length > 0 ? Math.max(...safeData.map(d => d.totalTrades)) : 0;

  // Animate bars on load
  useEffect(() => {
    if (safeData.length > 0) {
      setAnimatedBars([]);
      safeData.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedBars(prev => [...prev, index]);
        }, index * 200);
      });
    }
  }, [safeData]);
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades with emotions to see analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Emotion Impact</h3>
        <p className="text-sm text-muted-foreground">How emotions correlate with win rate</p>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {safeData.slice(0, 6).map((item, index) => {
          const winRateWidth = maxWinRate > 0 ? (item.winRate / maxWinRate) * 100 : 0;
          const isAnimated = animatedBars.includes(index);
          const isHovered = hoveredBar === index;
          const emotion = item.emotion.toLowerCase();
          const icon = emotionIcons[emotion] || '😐';
          const colorClass = emotionColors[emotion] || 'from-gray-400 to-gray-600';
          
          return (
            <div 
              key={index} 
              className={`group transition-all duration-300 ${isHovered ? 'transform scale-105' : ''}`}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{icon}</div>
                  <div>
                    <div className="font-semibold text-foreground capitalize">{item.emotion}</div>
                    <div className="text-xs text-muted-foreground">{item.totalTrades} trades</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{item.winRate.toFixed(0)}%</div>
                  <div className={`text-sm font-medium ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toFixed(0)}
                  </div>
                </div>
              </div>
              
              {/* Win Rate Bar */}
              <div className="relative mb-2">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out ${
                      isAnimated ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ 
                      width: isAnimated ? `${winRateWidth}%` : '0%',
                      boxShadow: isHovered ? '0 0 20px rgba(139, 92, 246, 0.5)' : 'none'
                    }}
                  />
                </div>
                
                {/* Animated glow effect */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>
                )}
              </div>
              
              {/* Performance indicator */}
              <div className="flex justify-between items-center text-xs">
                <div className={`px-2 py-1 rounded-full font-medium ${
                  item.winRate >= 60 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : item.winRate >= 40
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.winRate >= 60 ? '🎯 Excellent' : item.winRate >= 40 ? '📈 Good' : '📉 Poor'}
                </div>
                
                <div className="text-muted-foreground">
                  Avg: ${(item.totalPnL / item.totalTrades).toFixed(0)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Best Performing Emotion</div>
          <div className="text-lg font-bold text-foreground">
            {safeData.length > 0 ? safeData.reduce((best, current) => 
              current.winRate > best.winRate ? current : best
            ).emotion : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}