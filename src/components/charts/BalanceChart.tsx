import React, { useState, useEffect } from 'react';

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number }>;
}

export function BalanceChart({ balanceOverTime }: BalanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [animatedData, setAnimatedData] = useState<Array<{ date: string; balance: number }>>([]);
  
  const data = Array.isArray(balanceOverTime) ? balanceOverTime.filter(item => 
    item && 
    typeof item.date === 'string' && 
    typeof item.balance === 'number' && 
    !isNaN(item.balance)
  ) : [];
  
  // Animate data appearance
  useEffect(() => {
    if (data.length > 0) {
      setAnimatedData([]);
      data.forEach((point, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, point]);
        }, index * 50);
      });
    }
  }, [data]);
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold mb-2 text-foreground">No Data Available</div>
          <div className="text-sm text-muted-foreground">Add trades to see your balance progression</div>
        </div>
      </div>
    );
  }

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const range = maxBalance - minBalance;
  const padding = range * 0.15;
  const yMin = minBalance - padding;
  const yMax = maxBalance + padding;

  // Create smooth curve path
  const createSmoothPath = (points: Array<{ date: string; balance: number }>) => {
    if (points.length < 2) return '';
    
    let path = '';
    points.forEach((point, index) => {
      const x = (index / (points.length - 1)) * 380 + 10;
      const y = 190 - ((point.balance - yMin) / (yMax - yMin)) * 180;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevX = ((index - 1) / (points.length - 1)) * 380 + 10;
        const prevY = 190 - ((points[index - 1].balance - yMin) / (yMax - yMin)) * 180;
        const cp1x = prevX + (x - prevX) / 3;
        const cp1y = prevY;
        const cp2x = x - (x - prevX) / 3;
        const cp2y = y;
        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`;
      }
    });
    return path;
  };

  // Create area path
  const createAreaPath = (points: Array<{ date: string; balance: number }>) => {
    const linePath = createSmoothPath(points);
    if (!linePath) return '';
    
    const firstX = 10;
    const lastX = 390;
    return `${linePath} L ${lastX} 190 L ${firstX} 190 Z`;
  };

  const currentBalance = data[data.length - 1]?.balance || 0;
  const initialBalance = data[0]?.balance || 0;
  const profitLoss = currentBalance - initialBalance;
  const percentageChange = initialBalance > 0 ? (profitLoss / initialBalance) * 100 : 0;

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Balance Progression</h3>
          <p className="text-sm text-muted-foreground">Your account growth over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">${currentBalance.toLocaleString()}</div>
          <div className={`text-sm font-medium ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()} ({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="50%" stopColor="#8b5cf6"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="10" y1={10 + ratio * 180}
              x2="390" y2={10 + ratio * 180}
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
              className="text-foreground"
            />
          ))}

          {/* Area fill */}
          <path
            d={createAreaPath(animatedData)}
            fill="url(#balanceGradient)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Main line */}
          <path
            d={createSmoothPath(animatedData)}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Data points */}
          {animatedData.map((point, index) => {
            const x = (index / (data.length - 1)) * 380 + 10;
            const y = 190 - ((point.balance - yMin) / (yMax - yMin)) * 180;
            const isHovered = hoveredPoint === index;
            
            return (
              <g key={index}>
                {/* Point glow */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "8" : "4"}
                  fill="currentColor"
                  opacity={isHovered ? "0.2" : "0.1"}
                  className="text-primary transition-all duration-200"
                />
                {/* Main point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "6" : "3"}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={isHovered ? "3" : "2"}
                  className="text-primary cursor-pointer transition-all duration-200 hover:scale-110"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg z-10 pointer-events-none"
            style={{
              left: `${(hoveredPoint / (data.length - 1)) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-sm font-semibold text-foreground">
              {new Date(data[hoveredPoint].date).toLocaleDateString()}
            </div>
            <div className="text-lg font-bold text-primary">
              ${data[hoveredPoint].balance.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span className="bg-white dark:bg-slate-800 px-1 rounded">${yMax.toLocaleString()}</span>
        <span className="bg-white dark:bg-slate-800 px-1 rounded">${((yMax + yMin) / 2).toLocaleString()}</span>
        <span className="bg-white dark:bg-slate-800 px-1 rounded">${yMin.toLocaleString()}</span>
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-2 left-12 right-2 flex justify-between text-xs text-muted-foreground">
        {data.filter((_, index) => index % Math.ceil(data.length / 4) === 0).map((point, index) => (
          <span key={index} className="bg-white dark:bg-slate-800 px-1 rounded">
            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
}
