import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface SetupPerformance {
  setup: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

interface SetupPerformanceWidgetProps {
  setupPerformance: SetupPerformance[];
  loading?: boolean;
  error?: string;
  timeframe?: '7d' | '30d' | '90d' | '1y' | 'all';
  showCount?: boolean;
  onMaximize?: () => void;
}

export function SetupPerformanceWidget({ 
  setupPerformance, 
  loading, 
  error, 
  timeframe = '30d',
  showCount = true,
  onMaximize 
}: SetupPerformanceWidgetProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(setupPerformance) || setupPerformance.length === 0) {
      return [];
    }
    return setupPerformance
      .filter(item => item && item.setup && item.trades > 0)
      .sort((a, b) => b.totalPnL - a.totalPnL) // Sort by P&L descending
      .slice(0, 5); // Show top 5 setups
  }, [setupPerformance]);

  const hasData = validData.length > 0;
  const totalTrades = validData.reduce((sum, setup) => sum + setup.trades, 0);
  const totalPnL = validData.reduce((sum, setup) => sum + setup.totalPnL, 0);

  // Chart dimensions
  const chartWidth = 250;
  const chartHeight = 100;
  const margin = { top: 10, right: 20, bottom: 30, left: 40 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate scales
  const maxPnL = hasData ? Math.max(...validData.map(s => Math.abs(s.totalPnL))) : 1000;
  const yMax = maxPnL * 1.2;
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
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Setup Performance</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
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
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Setup Performance</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20 text-red-500">
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
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Setup Performance</CardTitle>
          </div>
          {onMaximize && (
            <Button variant="ghost" size="sm" onClick={onMaximize}>
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {timeframe === '7d' ? 'Last 7 days' : 
           timeframe === '30d' ? 'Last 30 days' : 
           timeframe === '90d' ? 'Last 90 days' : 
           timeframe === '1y' ? 'Last year' : 'All time'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Total Trades</div>
            <div className="font-medium">{totalTrades}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total P&L</div>
            <div className={`font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Mini Bar Chart */}
        {hasData ? (
          <div className="relative">
            <svg width="100%" height="80" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
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

              {/* Bars */}
              {validData.map((setup, i) => {
                const barWidth = Math.max(8, plotWidth / validData.length - 2);
                const barHeight = Math.abs(yScale(setup.totalPnL) - yScale(0));
                const barX = xScale(i) - barWidth / 2;
                const barY = setup.totalPnL >= 0 ? yScale(setup.totalPnL) : yScale(0);
                
                return (
                  <g key={setup.setup}>
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={setup.totalPnL >= 0 ? "#10B981" : "#EF4444"}
                      opacity="0.8"
                      className="hover:opacity-100 transition-opacity"
                    />
                    {/* Setup label */}
                    <text
                      x={xScale(i)}
                      y={chartHeight - margin.bottom + 12}
                      textAnchor="middle"
                      className="text-[8px] fill-muted-foreground"
                      transform={`rotate(-45, ${xScale(i)}, ${chartHeight - margin.bottom + 12})`}
                    >
                      {setup.setup.length > 6 ? setup.setup.substring(0, 6) + '...' : setup.setup}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <p className="text-xs">No setup data available</p>
          </div>
        )}

        {/* Top Setup List */}
        {hasData && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Top Setups</div>
            {validData.slice(0, 3).map((setup, i) => (
              <div key={setup.setup} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    setup.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="truncate max-w-[80px]">{setup.setup}</span>
                </div>
                <div className="flex items-center gap-2">
                  {showCount && (
                    <span className="text-muted-foreground">{setup.trades}</span>
                  )}
                  <span className={`font-medium ${
                    setup.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {setup.totalPnL >= 0 ? '+' : ''}${setup.totalPnL.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
