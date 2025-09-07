import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Cloud, Sun, CloudRain } from "lucide-react";

interface MarketConditionData {
  condition: string;
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

interface MarketConditionAnalysisProps {
  data: MarketConditionData[];
  isLoading?: boolean;
}

const conditionIcons = {
  'bullish': Sun,
  'bearish': CloudRain,
  'sideways': Cloud,
  'volatile': Activity,
  'trending': TrendingUp,
  'ranging': BarChart3,
};

const conditionColors = {
  'bullish': 'var(--color-profit)',
  'bearish': 'var(--color-loss)',
  'sideways': 'var(--color-primary)',
  'volatile': 'var(--color-warning)',
  'trending': 'var(--color-profit)',
  'ranging': 'var(--color-primary)',
};

export function MarketConditionAnalysis({ data, isLoading = false }: MarketConditionAnalysisProps) {
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
    typeof item.avgPnL === 'number' && 
    !isNaN(item.avgPnL) &&
    typeof item.profitFactor === 'number' && 
    !isNaN(item.profitFactor) &&
    typeof item.maxDrawdown === 'number' && 
    !isNaN(item.maxDrawdown) &&
    typeof item.avgDuration === 'number' && 
    !isNaN(item.avgDuration) &&
    typeof item.winningTrades === 'number' && 
    !isNaN(item.winningTrades) &&
    typeof item.losingTrades === 'number' && 
    !isNaN(item.losingTrades) &&
    item.condition
  ) : [];

  if (safeData.length === 0) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="chart-empty">
            <Activity className="icon" />
            <div>No market condition data available yet.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by total P&L for better visualization
  const sortedData = [...safeData].sort((a, b) => b.totalPnL - a.totalPnL);
  const maxPnL = Math.max(...sortedData.map(item => Math.abs(item.totalPnL)));
  const totalPnL = sortedData.reduce((sum, item) => sum + item.totalPnL, 0);
  const totalTrades = sortedData.reduce((sum, item) => sum + item.totalTrades, 0);
  const bestCondition = sortedData[0];

  // Calculate pie chart data
  const pieData = sortedData.map(item => ({
    condition: item.condition,
    trades: item.totalTrades,
    percentage: (item.totalTrades / totalTrades) * 100
  }));

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Condition Analysis
        </CardTitle>
        <CardDescription>
          Performance analysis across different market conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <div className="chart-title">Performance by Market Condition</div>
          <div className="chart-subtitle">
            Total P&L: 
            <span className={`ml-1 font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toLocaleString()}
            </span>
            • Total Trades: <span className="font-medium">{totalTrades}</span>
          </div>
          
          <table className="charts-css bar" role="chart">
            <tbody>
              {sortedData.map((item, index) => {
                const percentage = maxPnL > 0 ? (Math.abs(item.totalPnL) / maxPnL) * 100 : 0;
                const isProfit = item.totalPnL >= 0;
                const colorClass = isProfit ? 'profit' : 'loss';
                const IconComponent = conditionIcons[item.condition.toLowerCase() as keyof typeof conditionIcons] || Activity;
                const color = conditionColors[item.condition.toLowerCase() as keyof typeof conditionColors] || 'var(--color-primary)';
                
                return (
                  <tr key={index}>
                    <td 
                      className={colorClass}
                      style={{ 
                        '--size': `${percentage}%`,
                        '--color-chart-1': color
                      } as React.CSSProperties}
                    >
                      <span className="data">
                        {isProfit ? '+' : ''}${item.totalPnL.toLocaleString()}
                      </span>
                      <span className="label">
                        <IconComponent className="w-3 h-3 inline mr-1" />
                        {item.condition}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Best Condition Highlight */}
          {bestCondition && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Best Market Condition</div>
                    <div className="text-sm text-muted-foreground">
                      {bestCondition.condition} • {bestCondition.totalTrades} trades
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    +${bestCondition.totalPnL.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bestCondition.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Trade Distribution Pie Chart */}
          <div className="mt-6">
            <div className="chart-title">Trade Distribution by Condition</div>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="doughnut-chart w-full h-full" style={{
                  background: `conic-gradient(${pieData.map((item, index) => {
                    const startAngle = pieData.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
                    const endAngle = startAngle + item.percentage;
                    const color = conditionColors[item.condition.toLowerCase() as keyof typeof conditionColors] || 'var(--color-primary)';
                    return `${color} ${startAngle}% ${endAngle}%`;
                  }).join(', ')})`
                }}>
                  <div className="doughnut-center">
                    <div className="percentage">{totalTrades}</div>
                    <div className="label">Total Trades</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((item, index) => {
                const IconComponent = conditionIcons[item.condition.toLowerCase() as keyof typeof conditionIcons] || Activity;
                const color = conditionColors[item.condition.toLowerCase() as keyof typeof conditionColors] || 'var(--color-primary)';
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <IconComponent className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.condition}: {item.trades} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Condition Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {sortedData.map((item, index) => {
              const IconComponent = conditionIcons[item.condition.toLowerCase() as keyof typeof conditionIcons] || Activity;
              const color = conditionColors[item.condition.toLowerCase() as keyof typeof conditionColors] || 'var(--color-primary)';
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" style={{ color }} />
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {item.condition}
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
                    <div className="flex justify-between text-sm">
                      <span>Max Drawdown:</span>
                      <span className="text-red-600">
                        {item.maxDrawdown.toFixed(1)}%
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