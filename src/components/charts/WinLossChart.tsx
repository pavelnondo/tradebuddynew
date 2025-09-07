import React, { useState, useEffect } from 'react';

interface WinLossChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
}

export function WinLossChart({ data }: WinLossChartProps) {
  const [animatedWinPercentage, setAnimatedWinPercentage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value)
  ) : [];
  
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  
  const winData = safeData.find(item => item.label.toLowerCase().includes('win')) || { value: 0 };
  const lossData = safeData.find(item => item.label.toLowerCase().includes('loss')) || { value: 0 };
  
  const winPercentage = total > 0 ? (winData.value / total) * 100 : 0;
  const lossPercentage = total > 0 ? (lossData.value / total) * 100 : 0;

  // Animate the win percentage
  useEffect(() => {
    if (total > 0) {
      setIsAnimating(true);
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      const stepSize = winPercentage / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedWinPercentage(Math.min(stepSize * currentStep, winPercentage));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }
  }, [winPercentage, total]);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades to see win/loss breakdown</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Win/Loss Ratio</h3>
        <p className="text-sm text-muted-foreground">Your trading performance breakdown</p>
      </div>

      {/* Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700 p-2">
            {/* Inner chart */}
            <div 
              className="w-full h-full rounded-full relative overflow-hidden"
              style={{
                background: `conic-gradient(
                  #10b981 0deg ${animatedWinPercentage * 3.6}deg,
                  #ef4444 ${animatedWinPercentage * 3.6}deg 360deg
                )`
              }}
            >
              {/* Center circle */}
              <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {animatedWinPercentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated pulse */}
          {isAnimating && (
            <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping"></div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-foreground">Wins</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{winData.value}</div>
          <div className="text-xs text-muted-foreground">{winPercentage.toFixed(1)}%</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm font-medium text-foreground">Losses</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{lossData.value}</div>
          <div className="text-xs text-muted-foreground">{lossPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="mt-4 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          winPercentage >= 60 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : winPercentage >= 40
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {winPercentage >= 60 ? '🎯 Excellent' : winPercentage >= 40 ? '📈 Good' : '📉 Needs Improvement'}
        </div>
      </div>
    </div>
  );
}
