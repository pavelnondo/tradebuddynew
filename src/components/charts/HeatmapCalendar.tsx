import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapData {
  date: string;
  trades: number;
  profitLoss: number;
  winRate: number;
  activity: 'high' | 'medium' | 'low' | 'none';
}

interface HeatmapCalendarProps {
  data: HeatmapData[];
  year?: number;
  isLoading?: boolean;
}

export function HeatmapCalendar({ data, year = new Date().getFullYear(), isLoading = false }: HeatmapCalendarProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Check for leap year
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      daysInMonth[1] = 29;
    }

    const grid = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = [];
      
      // Add month header
      monthData.push(
        <div key={`month-${month}`} className="text-xs font-medium text-muted-foreground mb-1">
          {months[month]}
        </div>
      );
      
      // Add days
      for (let day = 1; day <= daysInMonth[month]; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = data.find(d => d.date === dateStr);
        
        const getIntensity = (activity: string, profitLoss: number) => {
          if (activity === 'none') return 'bg-muted/20';
          if (activity === 'low') return profitLoss >= 0 ? 'bg-green-200 dark:bg-green-900/30' : 'bg-red-200 dark:bg-red-900/30';
          if (activity === 'medium') return profitLoss >= 0 ? 'bg-green-400 dark:bg-green-800/50' : 'bg-red-400 dark:bg-red-800/50';
          return profitLoss >= 0 ? 'bg-green-600 dark:bg-green-700' : 'bg-red-600 dark:bg-red-700';
        };

        const intensity = dayData ? getIntensity(dayData.activity, dayData.profitLoss) : 'bg-muted/20';
        
        monthData.push(
          <TooltipProvider key={`${month}-${day}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-ring transition-all",
                    intensity
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {dayData ? (
                  <div className="space-y-1">
                    <p className="font-medium">{dateStr}</p>
                    <p className="text-sm">Trades: {dayData.trades}</p>
                    <p className={`text-sm ${dayData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      P&L: ${dayData.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-sm">Win Rate: {dayData.winRate.toFixed(1)}%</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No trading activity</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      
      grid.push(
        <div key={month} className="flex flex-col gap-1">
          {monthData}
        </div>
      );
    }
    
    return grid;
  };

  // Calculate summary stats
  const totalTrades = data.reduce((sum, d) => sum + d.trades, 0);
  const totalPnL = data.reduce((sum, d) => sum + d.profitLoss, 0);
  const activeDays = data.filter(d => d.trades > 0).length;
  const avgWinRate = data.length > 0 ? data.reduce((sum, d) => sum + d.winRate, 0) / data.length : 0;

  // Get best and worst days
  const bestDay = data.reduce((best, current) => 
    current.profitLoss > best.profitLoss ? current : best, 
    { date: '', trades: 0, profitLoss: -Infinity, winRate: 0, activity: 'none' as const }
  );
  
  const worstDay = data.reduce((worst, current) => 
    current.profitLoss < worst.profitLoss ? current : worst, 
    { date: '', trades: 0, profitLoss: Infinity, winRate: 0, activity: 'none' as const }
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalPnL.toFixed(2)}
                </p>
              </div>
              {totalPnL >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">{activeDays}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{avgWinRate.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Calendar */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trading Activity Heatmap - {year}
          </CardTitle>
          <CardDescription>
            Visual representation of your trading activity throughout the year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/20"></div>
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/30"></div>
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-800/50"></div>
                <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-700"></div>
              </div>
              <span className="text-muted-foreground">More</span>
              <div className="ml-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                <span className="text-sm">Profitable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                <span className="text-sm">Loss</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {generateCalendarGrid()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best & Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              Best Trading Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestDay.date ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold">{bestDay.date}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trades:</span>
                    <span className="ml-2 font-medium">{bestDay.trades}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">P&L:</span>
                    <span className="ml-2 font-medium text-green-600">${bestDay.profitLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="ml-2 font-medium">{bestDay.winRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Activity:</span>
                    <Badge variant="secondary" className="ml-2 capitalize">{bestDay.activity}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No trading data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              Worst Trading Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {worstDay.date ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold">{worstDay.date}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trades:</span>
                    <span className="ml-2 font-medium">{worstDay.trades}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">P&L:</span>
                    <span className="ml-2 font-medium text-red-600">${worstDay.profitLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="ml-2 font-medium">{worstDay.winRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Activity:</span>
                    <Badge variant="secondary" className="ml-2 capitalize">{worstDay.activity}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No trading data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
