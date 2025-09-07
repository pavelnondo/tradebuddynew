import React, { useState, useEffect } from 'react';

interface PsychologyDashboardProps {
  data: {
    emotionTrends: Array<any>;
    emotionPerformance: Array<any>;
    confidenceAnalysis: Array<any>;
    stressIndicators: {
      consecutiveLosses: number;
      recentDrawdown: number;
      emotionalVolatility: number;
      overtradingScore: number;
    };
  };
  isLoading?: boolean;
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

export function PsychologyDashboard({ data, isLoading }: PsychologyDashboardProps) {
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">Loading Psychology Data...</div>
        </div>
      </div>
    );
  }

  const safeEmotionData = Array.isArray(data?.emotionPerformance) ? data.emotionPerformance.filter(item => 
    item && 
    typeof item.avgProfitLoss === 'number' && 
    typeof item.winRate === 'number' && 
    typeof item.tradeCount === 'number' &&
    !isNaN(item.avgProfitLoss) && 
    !isNaN(item.winRate) && 
    !isNaN(item.tradeCount)
  ) : [];
  
  if (!data || safeEmotionData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades with emotions to see psychology analysis</div>
        </div>
      </div>
    );
  }

  // Animate cards on load
  useEffect(() => {
    const totalCards = safeEmotionData.length + 3; // emotions + 3 stress indicators
    setAnimatedCards([]);
    for (let i = 0; i < totalCards; i++) {
      setTimeout(() => {
        setAnimatedCards(prev => [...prev, i]);
      }, i * 100);
    }
  }, [safeEmotionData.length]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Trading Psychology</h3>
        <p className="text-sm text-muted-foreground">Emotional patterns and stress indicators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Emotion Performance</h3>
          {safeEmotionData.slice(0, 4).map((item, index) => {
            const isAnimated = animatedCards.includes(index);
            const isHovered = hoveredCard === index;
            const emotion = item.emotion.toLowerCase();
            const icon = emotionIcons[emotion] || '😐';
            
            return (
              <div 
                key={index} 
                className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 ${
                  isHovered ? 'transform scale-105 shadow-xl' : ''
                } ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{icon}</span>
                    <span className="font-semibold text-foreground capitalize">{item.emotion}</span>
                  </div>
                  <span className={`font-bold text-lg ${item.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.avgProfitLoss >= 0 ? '+' : ''}${item.avgProfitLoss.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{item.tradeCount} trades</span>
                  <span className={`font-medium ${item.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.winRate.toFixed(0)}% win rate
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stress Indicators */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Stress Indicators</h3>
          <div className="space-y-3">
            <div 
              className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📉</span>
                  <span className="font-semibold text-foreground">Consecutive Losses</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{data.stressIndicators.consecutiveLosses}</span>
              </div>
            </div>
            
            <div 
              className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length + 1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📊</span>
                  <span className="font-semibold text-foreground">Recent Drawdown</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">{data.stressIndicators.recentDrawdown.toFixed(1)}%</span>
              </div>
            </div>
            
            <div 
              className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length + 2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-semibold text-foreground">Overtrading Score</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{data.stressIndicators.overtradingScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
