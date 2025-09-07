import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number }>;
}

export function BalanceChart({ balanceOverTime }: BalanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // Ensure balanceOverTime is always an array to prevent map errors
  const safeBalanceData = Array.isArray(balanceOverTime) ? balanceOverTime : [];
  console.log('BalanceChart received data:', balanceOverTime);
  console.log('BalanceChart safe data:', safeBalanceData);
  
  const data = safeBalanceData.map(item => {
    const date = new Date(item.date);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found:', item.date);
      return null;
    }
    return {
      date: date.toISOString().split('T')[0], // Use ISO date format for proper sorting
      displayDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      }),
      balance: typeof item.balance === 'number' && !isNaN(item.balance) ? item.balance : 0,
      timestamp: date.getTime(), // Add timestamp for proper ordering
    };
  }).filter(item => item !== null).sort((a, b) => a.timestamp - b.timestamp); // Ensure proper chronological order
  
  console.log('BalanceChart processed data:', data);

  // Calculate dynamic Y-axis range based on actual data
  const minBalance = data.length > 0 ? Math.min(...data.map(d => d.balance)) : 0;
  const maxBalance = data.length > 0 ? Math.max(...data.map(d => d.balance)) : 6000;
  const balanceRange = maxBalance - minBalance;
  const padding = balanceRange * 0.1; // 10% padding
  const yAxisMin = Math.max(0, minBalance - padding);
  const yAxisMax = maxBalance + padding;

  console.log('Balance range:', { minBalance, maxBalance, yAxisMin, yAxisMax });

  if (balanceOverTime.length === 0 || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <DollarSign className="icon" />
          <div>Add some trades to see your balance progression</div>
        </div>
      </div>
    );
  }

  const totalChange = data.length > 1 ? data[data.length - 1].balance - data[0].balance : 0;
  const percentageChange = data.length > 1 && data[0].balance > 0 ? (totalChange / data[0].balance) * 100 : 0;
  const isPositive = totalChange >= 0;

  // Calculate positions for data points
  const chartWidth = 100; // percentage
  const chartHeight = 100; // percentage
  const pointPositions = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((point.balance - yAxisMin) / (yAxisMax - yAxisMin)) * chartHeight;
    return { ...point, x, y };
  });

  // Create SVG path for the area
  const createAreaPath = () => {
    if (pointPositions.length === 0) return '';
    
    let path = `M ${pointPositions[0].x}% ${chartHeight}%`;
    path += ` L ${pointPositions[0].x}% ${pointPositions[0].y}%`;
    
    for (let i = 1; i < pointPositions.length; i++) {
      path += ` L ${pointPositions[i].x}% ${pointPositions[i].y}%`;
    }
    
    path += ` L ${pointPositions[pointPositions.length - 1].x}% ${chartHeight}% Z`;
    return path;
  };

  // Create SVG path for the line
  const createLinePath = () => {
    if (pointPositions.length === 0) return '';
    
    let path = `M ${pointPositions[0].x}% ${pointPositions[0].y}%`;
    
    for (let i = 1; i < pointPositions.length; i++) {
      path += ` L ${pointPositions[i].x}% ${pointPositions[i].y}%`;
    }
    
    return path;
  };

  // Create smooth curve path for better line appearance
  const createSmoothLinePath = () => {
    if (pointPositions.length < 2) return '';
    
    let path = `M ${pointPositions[0].x}% ${pointPositions[0].y}%`;
    
    for (let i = 1; i < pointPositions.length; i++) {
      const prevPoint = pointPositions[i - 1];
      const currentPoint = pointPositions[i];
      const controlPoint1X = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const controlPoint1Y = prevPoint.y;
      const controlPoint2X = currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      const controlPoint2Y = currentPoint.y;
      
      path += ` C ${controlPoint1X}% ${controlPoint1Y}%, ${controlPoint2X}% ${controlPoint2Y}%, ${currentPoint.x}% ${currentPoint.y}%`;
    }
    
    return path;
  };

  return (
    <div className="chart-container">
      <div className="chart-title">Balance Over Time</div>
      <div className="chart-subtitle">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {data.length > 0 && `${data[0].displayDate} - ${data[data.length - 1].displayDate}`}
            </span>
          </div>
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isPositive ? '+' : ''}${totalChange.toLocaleString()} ({percentageChange.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative bg-muted/20 rounded-lg p-4" style={{ height: '300px' }}>
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 h-full flex flex-col justify-between text-xs text-muted-foreground pr-2 z-10">
          <span className="bg-background/80 px-1 rounded">${yAxisMax.toLocaleString()}</span>
          <span className="bg-background/80 px-1 rounded">${((yAxisMax + yAxisMin) / 2).toLocaleString()}</span>
          <span className="bg-background/80 px-1 rounded">${yAxisMin.toLocaleString()}</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-12 mr-4 h-full relative">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" opacity="0.2"/>
              </pattern>
              <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"/>
              </linearGradient>
            </defs>
            
            {/* Grid */}
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Area */}
            <path
              d={createAreaPath()}
              fill="url(#balanceGradient)"
              className="transition-all duration-300"
            />
            
            {/* Line */}
            <path
              d={createSmoothLinePath()}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 3px hsl(var(--primary)))'
              }}
            />
            
            {/* Data points */}
            {pointPositions.map((point, index) => (
              <circle
                key={index}
                cx={`${point.x}%`}
                cy={`${point.y}%`}
                r={hoveredPoint === index ? "3" : "2"}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: hoveredPoint === index 
                    ? 'drop-shadow(0 0 8px hsl(var(--primary)))' 
                    : 'drop-shadow(0 0 3px hsl(var(--primary)))'
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>
          
          {/* Tooltip */}
          {hoveredPoint !== null && (
            <div 
              className="absolute bg-background border border-border rounded-lg p-3 shadow-lg z-20 pointer-events-none"
              style={{
                left: `${pointPositions[hoveredPoint].x}%`,
                top: `${pointPositions[hoveredPoint].y}%`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px'
              }}
            >
              <div className="text-sm font-medium text-foreground">
                {pointPositions[hoveredPoint].displayDate}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">
                  ${pointPositions[hoveredPoint].balance.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-2 left-12 right-4 flex justify-between text-xs text-muted-foreground">
          {pointPositions.filter((_, index) => index % Math.ceil(pointPositions.length / 5) === 0).map((point, index) => (
            <span key={index} className="bg-background/80 px-1 rounded">{point.displayDate}</span>
          ))}
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="p-2 bg-muted/30 rounded">
          <div className="text-xs text-muted-foreground">Current</div>
          <div className="font-semibold">${data[data.length - 1]?.balance.toLocaleString()}</div>
        </div>
        <div className="p-2 bg-muted/30 rounded">
          <div className="text-xs text-muted-foreground">Peak</div>
          <div className="font-semibold">${maxBalance.toLocaleString()}</div>
        </div>
        <div className="p-2 bg-muted/30 rounded">
          <div className="text-xs text-muted-foreground">Low</div>
          <div className="font-semibold">${minBalance.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}