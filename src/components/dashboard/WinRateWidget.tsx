import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface WinRateWidgetProps {
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  loading?: boolean;
  error?: string;
  timeframe?: '7d' | '30d' | '90d' | '1y' | 'all';
  showTrend?: boolean;
  previousWinRate?: number;
  onMaximize?: () => void;
}

export function WinRateWidget({ 
  winRate, 
  totalTrades, 
  winningTrades, 
  losingTrades,
  loading, 
  error, 
  timeframe = '30d',
  showTrend = true,
  previousWinRate,
  onMaximize 
}: WinRateWidgetProps) {
  const isGoodWinRate = winRate >= 60;
  const isExcellentWinRate = winRate >= 75;
  
  // Calculate trend
  const trend = showTrend && previousWinRate ? winRate - previousWinRate : 0;
  const isTrendingUp = trend > 0;
  const isTrendingDown = trend < 0;

  // Calculate win rate color
  const getWinRateColor = () => {
    if (isExcellentWinRate) return 'text-green-500';
    if (isGoodWinRate) return 'text-blue-500';
    if (winRate >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Calculate progress percentage for visual indicator
  const progressPercentage = Math.min(winRate, 100);

  if (loading) {
    return (
      <Card shineBorder className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
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
              <Target className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
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
            <Target className={`h-4 w-4 ${getWinRateColor()}`} />
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
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
        {/* Main Win Rate Display */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getWinRateColor()}`}>
            {winRate.toFixed(1)}%
          </div>
          {showTrend && previousWinRate && (
            <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
              isTrendingUp ? 'text-green-500' : 
              isTrendingDown ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {isTrendingUp && <TrendingUp className="h-3 w-3" />}
              {isTrendingDown && <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}% vs previous
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isExcellentWinRate ? 'bg-green-500' :
                isGoodWinRate ? 'bg-blue-500' :
                winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Trade Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-green-500 font-medium">{winningTrades}</div>
            <div className="text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-red-500 font-medium">{losingTrades}</div>
            <div className="text-muted-foreground">Losses</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="text-center">
          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
            isExcellentWinRate ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            isGoodWinRate ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            winRate >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isExcellentWinRate ? 'Excellent' :
             isGoodWinRate ? 'Good' :
             winRate >= 50 ? 'Average' : 'Needs Improvement'}
          </div>
        </div>

        {/* Total Trades */}
        <div className="text-center text-xs text-muted-foreground">
          {totalTrades} total trades
        </div>
      </CardContent>
    </Card>
  );
}
