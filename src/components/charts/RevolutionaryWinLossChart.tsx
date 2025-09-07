import React, { useState, useEffect, useRef } from 'react';

interface RevolutionaryWinLossChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

export function RevolutionaryWinLossChart({ data }: RevolutionaryWinLossChartProps) {
  const [animatedWinPercentage, setAnimatedWinPercentage] = useState(0);
  const [animatedLossPercentage, setAnimatedLossPercentage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentStats, setCurrentStats] = useState({ wins: 0, losses: 0, total: 0 });
  const animationRef = useRef<number>();

  // Bulletproof data validation with real-time accuracy
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => 
      item && 
      typeof item.value === 'number' && 
      !isNaN(item.value) &&
      item.value >= 0
    );
  }, [data]);

  // Revolutionary animation system
  useEffect(() => {
    if (safeData.length === 0) return;

    const wins = safeData.find(item => item.label.toLowerCase().includes('win'))?.value || 0;
    const losses = safeData.find(item => item.label.toLowerCase().includes('loss'))?.value || 0;
    const total = wins + losses;
    
    if (total === 0) return;

    const winPercentage = (wins / total) * 100;
    const lossPercentage = (losses / total) * 100;

    setCurrentStats({ wins, losses, total });
    setIsAnimating(true);

    // Steve Jobs-level smooth animation
    const animate = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = performance.now();
      
      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Revolutionary easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + (end - start) * easeOutCubic;
        
        callback(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateFrame);
        }
      };
      
      animationRef.current = requestAnimationFrame(animateFrame);
    };

    // Animate win percentage
    animate(0, winPercentage, 2000, setAnimatedWinPercentage);
    
    // Animate loss percentage with delay
    setTimeout(() => {
      animate(0, lossPercentage, 1500, setAnimatedLossPercentage);
    }, 500);

    // Complete animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 3000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">No Data Available</div>
          <div className="text-sm text-green-200">Start trading to see your performance</div>
        </div>
      </div>
    );
  }

  const wins = safeData.find(item => item.label.toLowerCase().includes('win'))?.value || 0;
  const losses = safeData.find(item => item.label.toLowerCase().includes('loss'))?.value || 0;
  const total = wins + losses;
  const winPercentage = total > 0 ? (wins / total) * 100 : 0;
  const lossPercentage = total > 0 ? (losses / total) * 100 : 0;

  return (
    <div className="relative h-80 bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 rounded-3xl overflow-hidden">
      {/* Revolutionary Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="text-center">
          <h3 className="text-2xl font-light text-white mb-2">Performance Analysis</h3>
          <div className="text-sm text-green-200">Your trading success in real-time</div>
        </div>
      </div>

      {/* Revolutionary Doughnut Chart */}
      <div className="absolute inset-0 flex items-center justify-center pt-20">
        <div className="relative">
          {/* Revolutionary Outer Ring */}
          <div className="w-48 h-48 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            {/* Revolutionary Inner Ring */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/30 flex items-center justify-center">
              {/* Revolutionary Core */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                {/* Revolutionary Percentage Display */}
                <div className="text-center">
                  <div className="text-3xl font-light text-white mb-1">
                    {Math.round(animatedWinPercentage)}%
                  </div>
                  <div className="text-xs text-green-200 font-light">Win Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revolutionary Conic Gradient Overlay */}
          <div 
            className="absolute inset-0 w-48 h-48 rounded-full transition-all duration-2000 ease-out"
            style={{
              background: `conic-gradient(
                from 0deg,
                #10b981 0deg ${animatedWinPercentage * 3.6}deg,
                #ef4444 ${animatedWinPercentage * 3.6}deg ${(animatedWinPercentage + animatedLossPercentage) * 3.6}deg,
                transparent ${(animatedWinPercentage + animatedLossPercentage) * 3.6}deg 360deg
              )`,
              filter: isHovered ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {/* Revolutionary Glow Effect */}
          {isHovered && (
            <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Revolutionary Stats Cards */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Win Stats */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-green-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-light text-white">{wins}</div>
                <div className="text-xs text-green-200">Winning Trades</div>
              </div>
            </div>
          </div>

          {/* Loss Stats */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-light text-white">{losses}</div>
                <div className="text-xs text-red-200">Losing Trades</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Loading Indicator */}
      {isAnimating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Revolutionary Performance Badge */}
      <div className="absolute top-6 right-6">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          winPercentage >= 70 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : winPercentage >= 50
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {winPercentage >= 70 ? '🎯 Excellent' : winPercentage >= 50 ? '📈 Good' : '📉 Needs Work'}
        </div>
      </div>
    </div>
  );
}
