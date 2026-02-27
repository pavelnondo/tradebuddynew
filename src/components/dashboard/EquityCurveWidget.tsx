import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface EquityCurveWidgetProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
  loading?: boolean;
  error?: string;
  showDrawdown?: boolean;
  timeframe?: '7d' | '30d' | '90d' | '1y' | 'all';
  onMaximize?: () => void;
}

export function EquityCurveWidget({ 
  balanceOverTime, 
  loading, 
  error, 
  showDrawdown = true, 
  timeframe = '30d',
  onMaximize 
}: EquityCurveWidgetProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(balanceOverTime) || balanceOverTime.length === 0) {
      return [];
    }
    return balanceOverTime
      .filter(item => item && typeof item.date === 'string' && typeof item.balance === 'number' && !isNaN(item.balance))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [balanceOverTime]);

  const hasData = validData.length > 0;
  const currentBalance = hasData ? validData[validData.length - 1].balance : 0;
  const initialBalance = hasData ? validData[0].balance : 0;
  const totalReturn = currentBalance - initialBalance;
  const totalReturnPercent = initialBalance > 0 ? (totalReturn / initialBalance) * 100 : 0;
  const isProfit = totalReturn >= 0;

  // Calculate max drawdown
  const maxDrawdown = React.useMemo(() => {
    if (!hasData) return 0;
    let peak = initialBalance;
    let maxDD = 0;
    
    validData.forEach(point => {
      if (point.balance > peak) {
        peak = point.balance;
      }
      const drawdown = ((peak - point.balance) / peak) * 100;
      if (drawdown > maxDD) {
        maxDD = drawdown;
      }
    });
    
    return maxDD;
  }, [validData, initialBalance, hasData]);

  // Chart dimensions
  const chartWidth = 300;
  const chartHeight = 120;
  const margin = { top: 10, right: 20, bottom: 20, left: 40 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate scales
  const minBalance = hasData ? Math.min(...validData.map(d => d.balance)) : 0;
  const maxBalance = hasData ? Math.max(...validData.map(d => d.balance)) : 10000;
  const balanceRange = maxBalance - minBalance;
  const yMin = Math.max(0, minBalance - balanceRange * 0.1);
  const yMax = maxBalance + balanceRange * 0.1;

  const xScale = (index: number) => {
    if (validData.length <= 1) return margin.left;
    return margin.left + (index / (validData.length - 1)) * plotWidth;
  };
  
  const yScale = (balance: number) => {
    if (isNaN(balance) || !isFinite(balance)) return margin.top + plotHeight / 2;
    return margin.top + plotHeight - ((balance - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Create smooth line path
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePoints = validData.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.balance),
  }));

  const pathData = createSmoothPath(linePoints);

  if (loading) {
    return (
      <Card shineBorder className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isProfit ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shineBorder className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
            </div>
            {onMaximize && (
              <Button variant="ghost" size="sm" onClick={onMaximize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-red-500">
            <p className="text-sm">Error loading data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isProfit ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
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
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Return</p>
            <p className={`text-lg font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}${totalReturn.toLocaleString()}
            </p>
            <p className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{totalReturnPercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
            <p className="text-lg font-bold text-red-500">
              -{maxDrawdown.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Current: ${currentBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        {hasData ? (
          <div className="relative">
            <svg width="100%" height="80" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
              {/* Area fill */}
              {pathData && (
                <path
                  d={`${pathData} L ${linePoints[linePoints.length - 1].x} ${chartHeight - margin.bottom} L ${linePoints[0].x} ${chartHeight - margin.bottom} Z`}
                  fill="url(#equityGradient)"
                  opacity="0.2"
                />
              )}

              {/* Line path */}
              {pathData && (
                <path
                  d={pathData}
                  fill="none"
                  stroke={isProfit ? "#10B981" : "#EF4444"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {linePoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill={isProfit ? "#10B981" : "#EF4444"}
                  className="opacity-60"
                />
              ))}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <p className="text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
