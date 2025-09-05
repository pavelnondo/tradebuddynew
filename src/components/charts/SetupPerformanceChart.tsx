import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from "lucide-react";

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

  // Sort data by total P&L for better visualization
  const sortedData = [...data].sort((a, b) => b.totalPnL - a.totalPnL);

  // Prepare clean chart data
  const pnlChartData = sortedData.map(d => ({
    setup: d.setup || 'Unknown',
    pnl: d.totalPnL,
    trades: d.totalTrades,
  }));

  const winRateChartData = sortedData.map(d => ({
    setup: d.setup || 'Unknown',
    winRate: Math.min(d.winRate, 100), // Cap at 100% to prevent overflow
    trades: d.totalTrades,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].dataKey === 'pnl' ? (
              <>
                P&L: <span className={`font-medium ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${data.pnl.toFixed(2)}
                </span>
                <br />
                Trades: <span className="font-medium">{data.trades}</span>
              </>
            ) : (
              <>
                Win Rate: <span className="font-medium text-blue-600">{data.winRate.toFixed(1)}%</span>
                <br />
                Trades: <span className="font-medium">{data.trades}</span>
              </>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate summary stats
  const totalTrades = data.reduce((sum, d) => sum + d.totalTrades, 0);
  const totalPnL = data.reduce((sum, d) => sum + d.totalPnL, 0);
  const avgWinRate = data.length > 0 ? data.reduce((sum, d) => sum + d.winRate, 0) / data.length : 0;
  const bestSetup = data.reduce((best, current) => 
    current.totalPnL > best.totalPnL ? current : best, 
    { setup: 'None', totalPnL: -Infinity, winRate: 0, totalTrades: 0, avgPnL: 0, profitFactor: 0, maxDrawdown: 0, winningTrades: 0, losingTrades: 0, avgDuration: 0 }
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
              <Target className="w-8 h-8 text-muted-foreground" />
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
                <p className="text-sm font-medium text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{avgWinRate.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Setup</p>
                <p className="text-lg font-bold">{bestSetup.setup}</p>
                <p className="text-sm text-muted-foreground">${bestSetup.totalPnL.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Setup P&L Performance</CardTitle>
          <CardDescription>
            Total profit/loss by trading setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="setup" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]}
                >
                  {pnlChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Setup Win Rate</CardTitle>
          <CardDescription>
            Win rate percentage by trading setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="setup" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="winRate" 
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Setup Analysis */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Setup Performance Details</CardTitle>
          <CardDescription>Detailed breakdown of each trading setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.map((setup, index) => (
              <div key={setup.setup} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {setup.setup || 'Unknown'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {setup.totalTrades} trades
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total P&L:</span>
                    <span className={setup.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${setup.totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg P&L:</span>
                    <span className={setup.avgPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${setup.avgPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Win Rate:</span>
                    <span>{setup.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Factor:</span>
                    <span className={setup.profitFactor >= 1 ? "text-green-600" : "text-red-600"}>
                      {setup.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Duration:</span>
                    <span>{setup.avgDuration.toFixed(0)}min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Drawdown:</span>
                    <span className="text-red-600">{setup.maxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
