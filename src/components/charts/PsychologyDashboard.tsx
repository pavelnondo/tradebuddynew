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
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">Loading Psychology Data...</div>
          <div className="text-sm text-purple-200">Analyzing your trading emotions</div>
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
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">No Psychology Data</div>
          <div className="text-sm text-purple-200 mb-4">Add trades with emotions to see psychology analysis</div>
          <div className="text-xs text-purple-300">Track your emotions while trading to gain insights</div>
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
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 rounded-3xl p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <h3 className="text-2xl font-light text-white mb-3">Trading Psychology</h3>
        <p className="text-purple-200">Emotional patterns and stress indicators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Emotion Performance */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white mb-6">Emotion Performance</h3>
          {safeEmotionData.slice(0, 4).map((item, index) => {
            const isAnimated = animatedCards.includes(index);
            const isHovered = hoveredCard === index;
            const emotion = item.emotion.toLowerCase();
            const icon = emotionIcons[emotion] || '😐';
            
            return (
              <div 
                key={index} 
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
                  isHovered ? 'transform scale-105 bg-white/20 shadow-2xl' : ''
                } ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="font-semibold text-white capitalize text-lg">{item.emotion}</span>
                  </div>
                  <span className={`font-bold text-xl ${item.avgProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.avgProfitLoss >= 0 ? '+' : ''}${item.avgProfitLoss.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-purple-200">
                  <span>{item.tradeCount} trades</span>
                  <span className={`font-medium ${item.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.winRate.toFixed(0)}% win rate
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stress Indicators */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white mb-6">Stress Indicators</h3>
          <div className="space-y-4">
            <div 
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📉</span>
                  <span className="font-semibold text-white text-lg">Consecutive Losses</span>
                </div>
                <span className="text-3xl font-bold text-red-400">{data.stressIndicators.consecutiveLosses}</span>
              </div>
            </div>
            
            <div 
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length + 1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <span className="font-semibold text-white text-lg">Recent Drawdown</span>
                </div>
                <span className="text-3xl font-bold text-orange-400">{data.stressIndicators.recentDrawdown.toFixed(1)}%</span>
              </div>
            </div>
            
            <div 
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
                animatedCards.includes(safeEmotionData.length + 2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <span className="font-semibold text-white text-lg">Overtrading Score</span>
                </div>
                <span className="text-3xl font-bold text-yellow-400">{data.stressIndicators.overtradingScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
