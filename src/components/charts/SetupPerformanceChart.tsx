import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Clock, DollarSign, Zap } from "lucide-react";

interface SetupPerformance {
  setup: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  avgPnL: number;
  winRate: number;
  avgDuration: number;
  profitFactor: number;
  maxDrawdown: number;
}

interface SetupPerformanceChartProps {
  data: SetupPerformance[];
  isLoading?: boolean;
}

const setupIcons = {
  'breakout': Zap,
  'pullback': TrendingDown,
  'reversal': TrendingUp,
  'momentum': Target,
  'scalp': Clock,
  'swing': DollarSign,
};

export function SetupPerformanceChart({ data, isLoading = false }: SetupPerformanceChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.totalPnL === 'number' && 
    !isNaN(item.totalPnL) &&
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    typeof item.totalTrades === 'number' && 
    !isNaN(item.totalTrades) &&
    item.setup
  ) : [];

  if (safeData.length === 0) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="chart-empty">
            <Target className="icon" />
            <div>No setup performance data available yet.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by total P&L for better visualization
  const sortedData = [...safeData].sort((a, b) => b.totalPnL - a.totalPnL);
  const maxPnL = Math.max(...sortedData.map(item => Math.abs(item.totalPnL)));
  const totalPnL = sortedData.reduce((sum, item) => sum + item.totalPnL, 0);
  const bestSetup = sortedData[0];

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Setup Performance Analysis
        </CardTitle>
        <CardDescription>
          Performance breakdown by trading setup and strategy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <div className="chart-title">Setup Performance Ranking</div>
          <div className="chart-subtitle">
            Total P&L: 
            <span className={`ml-1 font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toLocaleString()}
            </span>
          </div>
          
          <table className="charts-css bar" role="chart">
            <tbody>
              {sortedData.map((item, index) => {
                const percentage = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
                const isProfit = item.totalPnL >= 0;
                const colorClass = isProfit ? 'profit' : 'loss';
                const IconComponent = setupIcons[item.setup.toLowerCase() as keyof typeof setupIcons] || Target;
                
                return (
                  <tr key={index}>
                    <td 
                      className={colorClass}
                      style={{ 
                        '--size': `${percentage}%`,
                        '--color-chart-1': isProfit ? 'var(--color-profit)' : 'var(--color-loss)'
                      } as React.CSSProperties}
                    >
                      <span className="data">
                        {isProfit ? '+' : ''}${item.totalPnL.toLocaleString()}
                      </span>
                      <span className="label">
                        <IconComponent className="w-3 h-3 inline mr-1" />
                        {item.setup}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Best Setup Highlight */}
          {bestSetup && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Best Performing Setup</div>
                    <div className="text-sm text-muted-foreground">
                      {bestSetup.setup} • {bestSetup.totalTrades} trades
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    +${bestSetup.totalPnL.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bestSetup.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Setup Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {sortedData.slice(0, 6).map((item, index) => {
              const IconComponent = setupIcons[item.setup.toLowerCase() as keyof typeof setupIcons] || Target;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {item.setup}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total P&L:</span>
                      <span className={`font-medium ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Win Rate:</span>
                      <span>{item.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trades:</span>
                      <span>{item.totalTrades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg P&L:</span>
                      <span className={item.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.avgPnL >= 0 ? '+' : ''}${item.avgPnL.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Profit Factor:</span>
                      <span className={item.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}>
                        {item.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}