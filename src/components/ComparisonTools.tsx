import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  GitCompare,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  BarChart3,
  Activity
} from "lucide-react";

// Recharts doesn't need registration

interface ComparisonData {
  period: string;
  trades: any[];
  metrics: {
    totalTrades: number;
    totalPnL: number;
    winRate: number;
    avgPnL: number;
    profitFactor: number;
    maxDrawdown: number;
    avgDuration: number;
    bestTrade: number;
    worstTrade: number;
  };
}

interface ComparisonToolsProps {
  onCompare: (periods: string[]) => void;
  comparisonData?: ComparisonData[];
  isLoading?: boolean;
}

export function ComparisonTools({ 
  onCompare, 
  comparisonData = [],
  isLoading = false 
}: ComparisonToolsProps) {
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [comparisonType, setComparisonType] = useState<'performance' | 'trends'>('performance');

  const availablePeriods = [
    'Last 7 Days',
    'Last 30 Days', 
    'Last 90 Days',
    'This Month',
    'Last Month',
    'This Quarter',
    'Last Quarter',
    'This Year',
    'Last Year'
  ];

  const handlePeriodToggle = (period: string) => {
    if (selectedPeriods.includes(period)) {
      setSelectedPeriods(selectedPeriods.filter(p => p !== period));
    } else if (selectedPeriods.length < 3) {
      setSelectedPeriods([...selectedPeriods, period]);
    }
  };

  const handleCompare = () => {
    if (selectedPeriods.length >= 2) {
      onCompare(selectedPeriods);
    }
  };

  const getPerformanceChartData = () => {
    const filteredData = comparisonData.filter(d => selectedPeriods.includes(d.period));
    
    return filteredData
      .filter(d => 
        d && 
        d.metrics &&
        typeof d.metrics.totalPnL === 'number' && !isNaN(d.metrics.totalPnL) &&
        typeof d.metrics.winRate === 'number' && !isNaN(d.metrics.winRate) &&
        typeof d.metrics.totalTrades === 'number' && !isNaN(d.metrics.totalTrades) &&
        typeof d.metrics.profitFactor === 'number' && !isNaN(d.metrics.profitFactor) &&
        d.period
      )
      .map(d => ({
        period: d.period,
        totalPnL: d.metrics.totalPnL,
        winRate: d.metrics.winRate,
        totalTrades: d.metrics.totalTrades,
        profitFactor: d.metrics.profitFactor,
      }));
  };

  const getTrendsChartData = () => {
    const filteredData = comparisonData.filter(d => selectedPeriods.includes(d.period));
    
    return filteredData
      .filter(d => 
        d && 
        d.metrics &&
        typeof d.metrics.totalTrades === 'number' && !isNaN(d.metrics.totalTrades) &&
        typeof d.metrics.avgDuration === 'number' && !isNaN(d.metrics.avgDuration) &&
        typeof d.metrics.winRate === 'number' && !isNaN(d.metrics.winRate) &&
        d.period
      )
      .map(d => ({
        period: d.period,
        totalTrades: d.metrics.totalTrades,
        avgDuration: d.metrics.avgDuration,
        winRate: d.metrics.winRate,
      }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {comparisonType === 'performance' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Total P&L: <span className="font-medium">${data.totalPnL?.toFixed(2)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Win Rate: <span className="font-medium">{data.winRate?.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total Trades: <span className="font-medium">{data.totalTrades}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Profit Factor: <span className="font-medium">{data.profitFactor?.toFixed(2)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Total Trades: <span className="font-medium">{data.totalTrades}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Avg Duration: <span className="font-medium">{data.avgDuration?.toFixed(0)}min</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Win Rate: <span className="font-medium">{data.winRate?.toFixed(1)}%</span>
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitCompare className="w-5 h-5 mr-2" />
            Period Comparison
          </CardTitle>
          <CardDescription>
            Compare performance across different time periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Periods to Compare (max 3)</Label>
              <Badge variant="outline">
                {selectedPeriods.length}/3 selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availablePeriods.map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriods.includes(period) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodToggle(period)}
                  disabled={!selectedPeriods.includes(period) && selectedPeriods.length >= 3}
                  className="justify-start"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label>Comparison Type:</Label>
              <Select
                value={comparisonType}
                onValueChange={(value: 'performance' | 'trends') => setComparisonType(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleCompare}
              disabled={selectedPeriods.length < 2}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare Periods
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedPeriods.length >= 2 && comparisonData.length > 0 && (
        <>
          {/* Chart */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Comparison Chart</CardTitle>
              <CardDescription>
                Visual comparison of selected periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 min-h-[200px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  {comparisonType === 'performance' ? (
                    <BarChart data={getPerformanceChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="totalPnL" 
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name="Total P&L ($)"
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="winRate" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Win Rate (%)"
                      />
                    </BarChart>
                  ) : (
                    <BarChart data={getTrendsChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="totalTrades" 
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Total Trades"
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="avgDuration" 
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Avg Duration (min)"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
              <CardDescription>
                Side-by-side metrics comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      {selectedPeriods.map(period => (
                        <th key={period} className="text-center p-2">{period}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'totalTrades', label: 'Total Trades', icon: Target, format: (v: number) => v.toString() },
                      { key: 'totalPnL', label: 'Total P&L', icon: DollarSign, format: (v: number) => `$${v.toFixed(2)}` },
                      { key: 'winRate', label: 'Win Rate', icon: TrendingUp, format: (v: number) => `${v.toFixed(1)}%` },
                      { key: 'avgPnL', label: 'Avg P&L', icon: DollarSign, format: (v: number) => `$${v.toFixed(2)}` },
                      { key: 'profitFactor', label: 'Profit Factor', icon: BarChart3, format: (v: number) => v.toFixed(2) },
                      { key: 'maxDrawdown', label: 'Max Drawdown', icon: TrendingDown, format: (v: number) => `${v.toFixed(1)}%` },
                      { key: 'avgDuration', label: 'Avg Duration', icon: Clock, format: (v: number) => `${v.toFixed(0)}min` },
                      { key: 'bestTrade', label: 'Best Trade', icon: TrendingUp, format: (v: number) => `$${v.toFixed(2)}` },
                      { key: 'worstTrade', label: 'Worst Trade', icon: TrendingDown, format: (v: number) => `$${v.toFixed(2)}` },
                    ].map(({ key, label, icon: Icon, format }) => (
                      <tr key={key} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{label}</span>
                          </div>
                        </td>
                        {selectedPeriods.map(period => {
                          const data = comparisonData.find(d => d.period === period);
                          const value = data?.metrics[key as keyof typeof data.metrics] || 0;
                          return (
                            <td key={period} className="text-center p-2">
                              <span className={`font-medium ${
                                key === 'totalPnL' || key === 'avgPnL' || key === 'bestTrade' 
                                  ? (value >= 0 ? 'text-green-600' : 'text-red-600')
                                  : key === 'worstTrade' || key === 'maxDrawdown'
                                  ? (value <= 0 ? 'text-green-600' : 'text-red-600')
                                  : ''
                              }`}>
                                {format(value)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
