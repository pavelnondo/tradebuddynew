import React, { useState, useEffect, useRef } from 'react';

interface RevolutionaryEmotionsChartProps {
  data: Array<{
    emotion: string;
    winRate: number;
    totalTrades: number;
    totalPnL: number;
  }>;
}

export function RevolutionaryEmotionsChart({ data }: RevolutionaryEmotionsChartProps) {
  const [animatedBars, setAnimatedBars] = useState<number[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStats, setCurrentStats] = useState({ bestEmotion: '', worstEmotion: '', totalPnL: 0 });
  const animationRef = useRef<number>();

  // Revolutionary emotion icons and colors
  const emotionConfig: { [key: string]: { icon: string; color: string; gradient: string } } = {
    'confident': { icon: '😎', color: 'from-blue-500 to-cyan-500', gradient: 'from-blue-500/20 to-cyan-500/20' },
    'calm': { icon: '😌', color: 'from-green-500 to-emerald-500', gradient: 'from-green-500/20 to-emerald-500/20' },
    'excited': { icon: '🤩', color: 'from-yellow-500 to-orange-500', gradient: 'from-yellow-500/20 to-orange-500/20' },
    'nervous': { icon: '😰', color: 'from-orange-500 to-red-500', gradient: 'from-orange-500/20 to-red-500/20' },
    'fearful': { icon: '😨', color: 'from-red-500 to-pink-500', gradient: 'from-red-500/20 to-pink-500/20' },
    'greedy': { icon: '🤤', color: 'from-purple-500 to-pink-500', gradient: 'from-purple-500/20 to-pink-500/20' },
    'frustrated': { icon: '😤', color: 'from-red-600 to-orange-600', gradient: 'from-red-600/20 to-orange-600/20' },
    'neutral': { icon: '😐', color: 'from-gray-500 to-slate-500', gradient: 'from-gray-500/20 to-slate-500/20' }
  };

  // Bulletproof data validation with real-time accuracy
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(item => 
        item && 
        typeof item.winRate === 'number' && 
        typeof item.totalTrades === 'number' && 
        typeof item.totalPnL === 'number' &&
        !isNaN(item.winRate) && 
        !isNaN(item.totalTrades) && 
        !isNaN(item.totalPnL)
      )
      .sort((a, b) => b.totalPnL - a.totalPnL);
  }, [data]);

  // Revolutionary animation system
  useEffect(() => {
    if (safeData.length === 0) return;

    setIsAnimating(true);
    setAnimatedBars([]);

    // Calculate stats
    const bestEmotion = safeData.reduce((best, current) => 
      current.totalPnL > best.totalPnL ? current : best
    );
    const worstEmotion = safeData.reduce((worst, current) => 
      current.totalPnL < worst.totalPnL ? current : worst
    );
    const totalPnL = safeData.reduce((sum, item) => sum + item.totalPnL, 0);

    setCurrentStats({
      bestEmotion: bestEmotion.emotion,
      worstEmotion: worstEmotion.emotion,
      totalPnL
    });

    // Steve Jobs-level staggered animation
    const animateBars = () => {
      let currentIndex = 0;
      const totalBars = safeData.length;
      
      const animate = () => {
        if (currentIndex < totalBars) {
          setAnimatedBars(prev => [...prev, currentIndex]);
          currentIndex++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      // Delay for dramatic effect
      setTimeout(animate, 300);
    };

    animateBars();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">No Data Available</div>
          <div className="text-sm text-purple-200">Start trading to see emotional patterns</div>
        </div>
      </div>
    );
  }

  const maxPnL = Math.max(...safeData.map(d => Math.abs(d.totalPnL)));
  const maxTrades = Math.max(...safeData.map(d => d.totalTrades));

  return (
    <div className="relative h-80 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 rounded-3xl overflow-hidden">
      {/* Revolutionary Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-light text-white mb-2">Emotion Impact</h3>
            <div className="text-sm text-purple-200">How emotions affect your trading</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-light text-white">
              ${currentStats.totalPnL.toFixed(0)}
            </div>
            <div className="text-xs text-purple-200">Total P&L</div>
          </div>
        </div>
      </div>

      {/* Revolutionary Chart Area */}
      <div className="absolute inset-0 pt-20 pb-20 px-6">
        {/* Y-Axis Label */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90">
          <div className="text-xs text-purple-200/60 font-light">P&L ($)</div>
        </div>
        <div className="h-full space-y-3">
          {safeData.slice(0, 6).map((item, index) => {
            const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
            const tradesWidth = maxTrades > 0 ? (item.totalTrades / maxTrades) * 100 : 0;
            const isAnimated = animatedBars.includes(index);
            const isHovered = hoveredBar === index;
            const emotion = item.emotion.toLowerCase();
            const config = emotionConfig[emotion] || emotionConfig['neutral'];
            const isBestEmotion = item.emotion === currentStats.bestEmotion;
            const isWorstEmotion = item.emotion === currentStats.worstEmotion;
            
            return (
              <div 
                key={index} 
                className="relative"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Revolutionary Bar Container */}
                <div className="flex items-center space-x-4">
                  {/* Revolutionary Emotion Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center text-2xl">
                    {config.icon}
                  </div>

                  {/* Revolutionary Emotion Name */}
                  <div className="w-20 text-sm font-light text-white capitalize">
                    {item.emotion}
                  </div>

                  {/* Revolutionary Progress Bar */}
                  <div className="flex-1 relative">
                    <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${config.color}`}
                        style={{ 
                          width: isAnimated ? `${Math.max(pnlWidth, 5)}%` : '0%',
                          boxShadow: isHovered ? `0 0 20px ${config.color.split(' ')[1].replace('to-', 'rgba(')}` : 'none'
                        }}
                      />
                      
                      {/* Revolutionary Glow Effect */}
                      {isHovered && (
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`}></div>
                      )}
                    </div>
                  </div>

                  {/* Revolutionary Stats */}
                  <div className="w-24 text-right">
                    <div className={`text-sm font-light ${item.totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      ${item.totalPnL.toFixed(0)}
                    </div>
                    <div className="text-xs text-purple-200">
                      {item.totalTrades} trades
                    </div>
                  </div>
                </div>

                {/* Revolutionary Hover Stats */}
                <div className={`absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-light text-white">{item.totalTrades}</div>
                      <div className="text-xs text-purple-200">Total Trades</div>
                    </div>
                    <div>
                      <div className={`text-lg font-light ${item.winRate >= 50 ? 'text-green-300' : 'text-red-300'}`}>
                        {item.winRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-purple-200">Win Rate</div>
                    </div>
                    <div>
                      <div className={`text-lg font-light ${item.totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        ${item.totalPnL.toFixed(0)}
                      </div>
                      <div className="text-xs text-purple-200">Total P&L</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* X-Axis Label */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-purple-200/60 font-light">Emotions</div>
        </div>
      </div>

      {/* Revolutionary Stats Cards */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Best Emotion */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-green-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-lg">{emotionConfig[currentStats.bestEmotion.toLowerCase()]?.icon || '😎'}</span>
              </div>
              <div>
                <div className="text-lg font-light text-white capitalize">{currentStats.bestEmotion}</div>
                <div className="text-xs text-green-200">Best Emotion</div>
              </div>
            </div>
          </div>

          {/* Worst Emotion */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                <span className="text-lg">{emotionConfig[currentStats.worstEmotion.toLowerCase()]?.icon || '😰'}</span>
              </div>
              <div>
                <div className="text-lg font-light text-white capitalize">{currentStats.worstEmotion}</div>
                <div className="text-xs text-red-200">Worst Emotion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Loading Indicator */}
      {isAnimating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
