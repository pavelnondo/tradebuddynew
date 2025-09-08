import React from 'react';

interface ProfessionalWinLossChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

export function ProfessionalWinLossChart({ data }: ProfessionalWinLossChartProps) {
  // Validate data
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.filter(item => 
      item && 
      typeof item.value === 'number' && 
      !isNaN(item.value) && 
      item.value >= 0
    );
  }, [data]);

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-red-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Trading Data</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Start trading to see your win/loss breakdown</div>
        </div>
      </div>
    );
  }

  const totalTrades = validData.reduce((sum, item) => sum + item.value, 0);
  const wins = validData.find(item => item.label.toLowerCase().includes('win'))?.value || 0;
  const losses = validData.find(item => item.label.toLowerCase().includes('loss'))?.value || 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Calculate angles for the donut chart
  let currentAngle = 0;
  const segments = validData.map(item => {
    const percentage = (item.value / totalTrades) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      angle
    };
  });

  // SVG dimensions
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 20;

  // Convert angles to SVG path
  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(center, center, outerRadius, endAngle);
    const end = polarToCartesian(center, center, outerRadius, startAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, endAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="w-full h-full">

      {/* Donut Chart */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArcPath(segment.startAngle, segment.endAngle, radius - strokeWidth, radius)}
                fill={segment.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Win Rate</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3 w-full">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {segment.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {segment.value}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {segment.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Stats */}
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Wins: </span>
            <span className="font-semibold text-green-600">{wins}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Losses: </span>
            <span className="font-semibold text-red-600">{losses}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
