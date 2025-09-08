import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from 'lucide-react';

interface ThemedWinLossChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  loading?: boolean;
  error?: string;
}

export function ThemedWinLossChart({ data, loading, error }: ThemedWinLossChartProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data.filter(item => item && typeof item.label === 'string' && typeof item.value === 'number' && !isNaN(item.value) && item.value >= 0);
  }, [data]);

  const hasData = validData.length > 0;
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  const noDataMessage = 'Add trades to see your win/loss distribution';

  // Calculate donut chart dimensions
  const size = 200;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;
  const segments = validData.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercentage;
    cumulativePercentage += (percentage / 100) * circumference;
    return {
      ...item,
      index,
      percentage: parseFloat(percentage.toFixed(1)),
      strokeDasharray,
      strokeDashoffset,
      color: item.color || (item.label === 'Wins' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))')
    };
  });

  const winRate = total > 0 ? (validData.find(d => d.label === 'Wins')?.value || 0) / total * 100 : 0;
  const lossRate = total > 0 ? (validData.find(d => d.label === 'Losses')?.value || 0) / total * 100 : 0;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="h-5 w-5" />
          <span>Win/Loss Distribution</span>
        </CardTitle>
        <CardDescription>
          Your trading performance breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            <div className="text-center">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No data available</p>
              <p className="text-sm">{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
            {/* Donut Chart with enhanced styling */}
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle with shadow */}
                <circle
                  cx={size / 2 + 1}
                  cy={size / 2 + 1}
                  r={radius}
                  fill="transparent"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={strokeWidth}
                  opacity="0.3"
                />
                {/* Main background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="hsl(var(--border))"
                  strokeWidth={strokeWidth}
                  opacity="0.3"
                />
                {/* Segments with enhanced styling */}
                {segments.map((segment) => (
                  <circle
                    key={segment.index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                    strokeLinecap="round"
                  />
                ))}
              </svg>

              {/* Center text with enhanced styling */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-foreground drop-shadow-sm">{winRate.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground font-medium">Win Rate</div>
              </div>
            </div>


            {/* Summary Stats with enhanced styling - serves as chart key */}
            {hasData && (
              <div className="pt-1 border-t border-border w-full">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col items-center flex-1 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className="text-xs text-muted-foreground font-medium">Total Trades</span>
                    <span className="text-sm font-semibold text-primary">{total}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground font-medium">Win Rate</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground font-medium">Loss Rate</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{lossRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
