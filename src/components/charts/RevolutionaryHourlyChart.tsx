import React, { useState, useEffect, useRef } from 'react';

interface RevolutionaryHourlyChartProps {
  data: Array<{
    hour: string;
    totalPnL: number;
    totalTrades: number;
    winRate: number;
  }>;
}

export function RevolutionaryHourlyChart({ data }: RevolutionaryHourlyChartProps) {
  const [animatedBars, setAnimatedBars] = useState<number[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStats, setCurrentStats] = useState({ bestHour: '', worstHour: '', totalPnL: 0 });
  const animationRef = useRef<number>();

  // Bulletproof data validation with real-time accuracy
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(item => 
        item && 
        typeof item.totalPnL === 'number' && 
        typeof item.totalTrades === 'number' && 
        typeof item.winRate === 'number' &&
        !isNaN(item.totalPnL) && 
        !isNaN(item.totalTrades) && 
        !isNaN(item.winRate)
      )
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [data]);

  // Revolutionary animation system
  useEffect(() => {
    if (safeData.length === 0) return;

    setIsAnimating(true);
    setAnimatedBars([]);

    // Calculate stats
    const bestHour = safeData.reduce((best, current) => 
      current.totalPnL > best.totalPnL ? current : best
    );
    const worstHour = safeData.reduce((worst, current) => 
      current.totalPnL < worst.totalPnL ? current : worst
    );
    const totalPnL = safeData.reduce((sum, item) => sum + item.totalPnL, 0);

    setCurrentStats({
      bestHour: bestHour.hour,
      worstHour: worstHour.hour,
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
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">No Data Available</div>
          <div className="text-sm text-orange-200">Start trading to see hourly patterns</div>
        </div>
      </div>
    );
  }

  const maxPnL = Math.max(...safeData.map(d => Math.abs(d.totalPnL)));
  const maxTrades = Math.max(...safeData.map(d => d.totalTrades));

  return (
    <div className="relative h-80 bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 rounded-3xl overflow-hidden">
      {/* Revolutionary Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-light text-white mb-2">Hourly Performance</h3>
            <div className="text-sm text-orange-200">Your trading patterns by hour</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-light text-white">
              ${currentStats.totalPnL.toFixed(0)}
            </div>
            <div className="text-xs text-orange-200">Total P&L</div>
          </div>
        </div>
      </div>

      {/* Revolutionary Chart Area */}
      <div className="absolute inset-0 pt-20 pb-20 px-6">
        <div className="h-full flex items-end justify-between space-x-2">
          {safeData.map((item, index) => {
            const pnlWidth = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
            const tradesHeight = maxTrades > 0 ? (item.totalTrades / maxTrades) * 100 : 0;
            const isAnimated = animatedBars.includes(index);
            const isHovered = hoveredBar === index;
            const isBestHour = item.hour === currentStats.bestHour;
            const isWorstHour = item.hour === currentStats.worstHour;
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center space-y-2"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Revolutionary Bar Container */}
                <div className="relative w-full h-32 flex items-end justify-center">
                  {/* Revolutionary P&L Bar */}
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 ease-out ${
                      item.totalPnL >= 0 
                        ? 'bg-gradient-to-t from-green-500 to-emerald-400' 
                        : 'bg-gradient-to-t from-red-500 to-pink-400'
                    } ${isHovered ? 'shadow-lg' : ''}`}
                    style={{ 
                      height: isAnimated ? `${Math.max(pnlWidth * 0.8, 10)}%` : '0%',
                      boxShadow: isHovered ? `0 0 20px ${item.totalPnL >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` : 'none'
                    }}
                  />
                  
                  {/* Revolutionary Trades Indicator */}
                  <div 
                    className={`absolute top-0 w-2 h-2 rounded-full transition-all duration-1000 ease-out ${
                      item.winRate >= 50 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ 
                      opacity: isAnimated ? 1 : 0,
                      transform: isAnimated ? 'scale(1)' : 'scale(0)'
                    }}
                  />
                  
                  {/* Revolutionary Glow Effect */}
                  {isHovered && (
                    <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>

                {/* Revolutionary Hour Label */}
                <div className="text-xs text-orange-200 font-light">
                  {item.hour}:00
                </div>

                {/* Revolutionary Stats */}
                <div className={`text-xs text-center transition-all duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className={`font-medium ${item.totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ${item.totalPnL.toFixed(0)}
                  </div>
                  <div className="text-orange-200">
                    {item.totalTrades} trades
                  </div>
                  <div className={`font-medium ${item.winRate >= 50 ? 'text-green-300' : 'text-red-300'}`}>
                    {item.winRate.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revolutionary Stats Cards */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Best Hour */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-green-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-light text-white">{currentStats.bestHour}:00</div>
                <div className="text-xs text-green-200">Best Hour</div>
              </div>
            </div>
          </div>

          {/* Worst Hour */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-light text-white">{currentStats.worstHour}:00</div>
                <div className="text-xs text-red-200">Worst Hour</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Loading Indicator */}
      {isAnimating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
