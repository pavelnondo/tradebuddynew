import React, { useState, useEffect, useRef } from 'react';

interface RevolutionaryBalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
}

export function RevolutionaryBalanceChart({ balanceOverTime }: RevolutionaryBalanceChartProps) {
  const [animatedData, setAnimatedData] = useState<Array<{ date: string; balance: number }>>([]);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceChange, setBalanceChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();

  // Bulletproof data validation with real-time accuracy
  const safeData = React.useMemo(() => {
    console.log('RevolutionaryBalanceChart - balanceOverTime:', balanceOverTime);
    
    if (!Array.isArray(balanceOverTime)) {
      console.log('RevolutionaryBalanceChart - balanceOverTime is not an array');
      return [];
    }
    
    const filtered = balanceOverTime
      .filter(item => {
        const isValid = item && 
          typeof item.date === 'string' && 
          typeof item.balance === 'number' && 
          !isNaN(item.balance) &&
          item.balance >= 0;
        
        if (!isValid) {
          console.log('RevolutionaryBalanceChart - invalid item:', item);
        }
        
        return isValid;
      })
      .map(item => {
        try {
          return {
            date: new Date(item.date).toISOString(),
            balance: Math.round(item.balance * 100) / 100
          };
        } catch (error) {
          console.error('RevolutionaryBalanceChart - error processing item:', item, error);
          return null;
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
    
    console.log('RevolutionaryBalanceChart - safeData:', filtered);
    return filtered;
  }, [balanceOverTime]);

  // Revolutionary animation system
  useEffect(() => {
    if (safeData.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsAnimating(true);
    setAnimatedData([]);
    
    // Steve Jobs-level smooth animation
    const animateData = () => {
      let currentIndex = 0;
      const totalPoints = safeData.length;
      
      const animate = () => {
        if (currentIndex < totalPoints) {
          setAnimatedData(prev => [...prev, safeData[currentIndex]]);
          currentIndex++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setIsLoading(false);
        }
      };
      
      animate();
    };

    // Delay for dramatic effect
    setTimeout(animateData, 300);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safeData]);

  // Real-time balance calculation
  useEffect(() => {
    if (safeData.length > 0) {
      const latest = safeData[safeData.length - 1];
      const previous = safeData.length > 1 ? safeData[safeData.length - 2] : null;
      
      setCurrentBalance(latest.balance);
      setBalanceChange(previous ? latest.balance - previous.balance : 0);
    }
  }, [safeData]);

  // Revolutionary path generation with Bezier curves
  const createRevolutionaryPath = (points: Array<{ date: string; balance: number }>) => {
    if (!points || points.length < 2) return '';
    
    try {
      const minBalance = Math.min(...points.map(p => p.balance));
      const maxBalance = Math.max(...points.map(p => p.balance));
      const range = maxBalance - minBalance;
      const padding = range * 0.1;
      const yMin = Math.max(0, minBalance - padding);
      const yMax = maxBalance + padding;
      
      let path = '';
      points.forEach((point, index) => {
        if (!point || typeof point.balance !== 'number' || isNaN(point.balance)) {
          console.warn('RevolutionaryBalanceChart - invalid point:', point);
          return;
        }
        
        const x = (index / (points.length - 1)) * 380 + 10;
        const y = 190 - ((point.balance - yMin) / (yMax - yMin)) * 180;
        
        if (index === 0) {
          path += `M ${x} ${y}`;
        } else {
          const prevPoint = points[index - 1];
          if (!prevPoint || typeof prevPoint.balance !== 'number' || isNaN(prevPoint.balance)) {
            console.warn('RevolutionaryBalanceChart - invalid previous point:', prevPoint);
            return;
          }
          
          const prevX = ((index - 1) / (points.length - 1)) * 380 + 10;
          const prevY = 190 - ((prevPoint.balance - yMin) / (yMax - yMin)) * 180;
          
          // Revolutionary smooth curves
          const cp1x = prevX + (x - prevX) * 0.3;
          const cp1y = prevY;
          const cp2x = x - (x - prevX) * 0.3;
          const cp2y = y;
          
          path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`;
        }
      });
      return path;
    } catch (error) {
      console.error('RevolutionaryBalanceChart - error creating path:', error);
      return '';
    }
  };

  // Revolutionary area path
  const createRevolutionaryAreaPath = (points: Array<{ date: string; balance: number }>) => {
    const linePath = createRevolutionaryPath(points);
    if (!linePath) return '';
    
    try {
      const validPoints = points.filter(p => p && typeof p.balance === 'number' && !isNaN(p.balance));
      if (validPoints.length === 0) return '';
      
      const minBalance = Math.min(...validPoints.map(p => p.balance));
      const maxBalance = Math.max(...validPoints.map(p => p.balance));
      const range = maxBalance - minBalance;
      const padding = range * 0.1;
      const yMin = Math.max(0, minBalance - padding);
      const yMax = maxBalance + padding;
      
      const firstX = 10;
      const lastX = 390;
      const bottomY = 190 - ((yMin - yMin) / (yMax - yMin)) * 180;
      
      return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    } catch (error) {
      console.error('RevolutionaryBalanceChart - error creating area path:', error);
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">Loading Revolutionary Data...</div>
          <div className="text-sm text-blue-200">Preparing your financial journey</div>
        </div>
      </div>
    );
  }

  const validBalances = safeData.filter(p => p && typeof p.balance === 'number' && !isNaN(p.balance)).map(p => p.balance);
  
  if (safeData.length === 0 || validBalances.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-xl font-light text-white mb-2">No Data Available</div>
          <div className="text-sm text-blue-200">Start trading to see your revolutionary journey</div>
        </div>
      </div>
    );
  }
  const minBalance = validBalances.length > 0 ? Math.min(...validBalances) : 0;
  const maxBalance = validBalances.length > 0 ? Math.max(...validBalances) : 10000;
  const range = maxBalance - minBalance;
  const padding = range * 0.1;
  const yMin = Math.max(0, minBalance - padding);
  const yMax = maxBalance + padding;

  return (
    <div className="relative h-80 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl overflow-hidden">
      {/* Revolutionary Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Header with Real-time Data */}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-light text-white mb-2">Balance Evolution</h3>
            <div className="text-sm text-blue-200">Your financial journey in real-time</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-light text-white mb-1">
              ${currentBalance.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Chart */}
      <div className="absolute inset-0 pt-20">
        <svg 
          ref={svgRef}
          className="w-full h-full" 
          viewBox="0 0 400 200" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Revolutionary Gradients */}
            <linearGradient id="revolutionaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3"/>
            </linearGradient>
            
            <linearGradient id="revolutionaryArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
            </linearGradient>

            {/* Revolutionary Glow Filter */}
            <filter id="revolutionaryGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Revolutionary Pulse Filter */}
            <filter id="revolutionaryPulse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Revolutionary Area Fill */}
          {animatedData.length > 1 && (
            <path
              d={createRevolutionaryAreaPath(animatedData)}
              fill="url(#revolutionaryArea)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Revolutionary Line */}
          {animatedData.length > 1 && (
            <path
              d={createRevolutionaryPath(animatedData)}
              fill="none"
              stroke="url(#revolutionaryGradient)"
              strokeWidth="3"
              filter="url(#revolutionaryGlow)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Revolutionary Data Points */}
          {animatedData.map((point, index) => {
            if (!point || typeof point.balance !== 'number' || isNaN(point.balance)) {
              console.warn('RevolutionaryBalanceChart - invalid animated point:', point);
              return null;
            }
            
            try {
              const x = (index / (animatedData.length - 1)) * 380 + 10;
              const y = 190 - ((point.balance - yMin) / (yMax - yMin)) * 180;
              const isHovered = hoveredPoint === index;
              const isLatest = index === animatedData.length - 1;
              
              return (
                <g key={index}>
                  {/* Revolutionary Point Glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "8" : isLatest ? "6" : "4"}
                    fill="url(#revolutionaryGradient)"
                    filter={isHovered ? "url(#revolutionaryPulse)" : "url(#revolutionaryGlow)"}
                    className="transition-all duration-300 ease-out cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  
                  {/* Revolutionary Point Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "4" : isLatest ? "3" : "2"}
                    fill="white"
                    className="transition-all duration-300 ease-out"
                  />
                </g>
              );
            } catch (error) {
              console.error('RevolutionaryBalanceChart - error rendering point:', point, error);
              return null;
            }
          })}
        </svg>
      </div>

      {/* Revolutionary Tooltip */}
      {hoveredPoint !== null && animatedData[hoveredPoint] && animatedData[hoveredPoint].balance && (
        <div 
          className="absolute z-20 bg-black/80 backdrop-blur-lg rounded-2xl p-4 text-white border border-white/20"
          style={{
            left: `${(hoveredPoint / (animatedData.length - 1)) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-sm font-light text-blue-200 mb-1">
            {new Date(animatedData[hoveredPoint].date).toLocaleDateString()}
          </div>
          <div className="text-lg font-light">
            ${animatedData[hoveredPoint].balance.toLocaleString()}
          </div>
        </div>
      )}

      {/* Revolutionary Loading Indicator */}
      {isAnimating && (
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-xs text-blue-200 ml-2">Loading your journey...</span>
          </div>
        </div>
      )}
    </div>
  );
}
