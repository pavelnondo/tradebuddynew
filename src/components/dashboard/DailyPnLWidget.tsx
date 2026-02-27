import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DailyPnLWidgetProps {
  dailyPnL: Array<{ date: string; pnl: number; trades: number }>;
  loading?: boolean;
  error?: string;
  timeframe?: '7d' | '30d' | '90d';
  showTarget?: boolean;
  dailyTarget?: number;
  onMaximize?: () => void;
}

export function DailyPnLWidget({ 
  dailyPnL, 
  loading, 
  error, 
  timeframe = '7d',
  showTarget = true,
  dailyTarget = 500,
  onMaximize 
}: DailyPnLWidgetProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(dailyPnL) || dailyPnL.length === 0) {
      return [];
    }
    return dailyPnL
      .filter(item => item && typeof item.date === 'string' && typeof item.pnl === 'number' && !isNaN(item.pnl))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyPnL]);

  const hasData = validData.length > 0;
  const totalPnL = validData.reduce((sum, day) => sum + day.pnl, 0);
  const avgDailyPnL = hasData ? totalPnL / validData.length : 0;
  const winningDays = validData.filter(day => day.pnl > 0).length;
  const winRate = hasData ? (winningDays / validData.length) * 100 : 0;
  const isProfit = totalPnL >= 0;

  // Calculate target achievement
  const targetAchievement = showTarget && dailyTarget > 0 ? (avgDailyPnL / dailyTarget) * 100 : 0;

  // Chart dimensions
  const chartWidth = 200;
  const chartHeight = 80;
  const margin = { top: 5, right: 10, bottom: 15, left: 30 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate scales
  const maxPnL = hasData ? Math.max(...validData.map(d => Math.abs(d.pnl))) : 1000;
  const yMax = Math.max(maxPnL, dailyTarget) * 1.2;
  const yMin = -yMax;

  const xScale = (index: number) => {
    if (validData.length <= 1) return margin.left;
    return margin.left + (index / (validData.length - 1)) * plotWidth;
  };
  
  const yScale = (pnl: number) => {
    if (isNaN(pnl) || !isFinite(pnl)) return margin.top + plotHeight / 2;
    return margin.top + plotHeight - ((pnl - yMin) / (yMax - yMin)) * plotHeight;
  };

  if (loading) {
    return (
      <Card shineBorder className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shineBorder className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16 text-red-500">
            <p className="text-xs">Error loading data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isProfit ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
          </div>
          {onMaximize && (
            <Button variant="ghost" size="sm" onClick={onMaximize}>
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {timeframe === '7d' ? 'Last 7 days' : 
           timeframe === '30d' ? 'Last 30 days' : 'Last 90 days'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total P&L</span>
            <span className={`text-sm font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}${totalPnL.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Avg Daily</span>
            <span className={`text-sm font-medium ${avgDailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {avgDailyPnL >= 0 ? '+' : ''}${avgDailyPnL.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className="text-sm font-medium">{winRate.toFixed(0)}%</span>
          </div>
          {showTarget && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Target
              </span>
              <span className={`text-sm font-medium ${targetAchievement >= 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                {targetAchievement.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Mini Bar Chart */}
        {hasData ? (
          <div className="relative">
            <svg width="100%" height="60" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
              {/* Zero line */}
              <line
                x1={margin.left}
                y1={yScale(0)}
                x2={chartWidth - margin.right}
                y2={yScale(0)}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Target line */}
              {showTarget && (
                <line
                  x1={margin.left}
                  y1={yScale(dailyTarget)}
                  x2={chartWidth - margin.right}
                  y2={yScale(dailyTarget)}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
              )}

              {/* Bars */}
              {validData.map((day, i) => {
                const barWidth = Math.max(2, plotWidth / validData.length - 1);
                const barHeight = Math.abs(yScale(day.pnl) - yScale(0));
                const barX = xScale(i) - barWidth / 2;
                const barY = day.pnl >= 0 ? yScale(day.pnl) : yScale(0);
                
                return (
                  <rect
                    key={i}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={day.pnl >= 0 ? "#10B981" : "#EF4444"}
                    opacity="0.8"
                    className="hover:opacity-100 transition-opacity"
                  />
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 text-muted-foreground">
            <p className="text-xs">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
