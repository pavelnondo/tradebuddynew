import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

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

  // Sort data by total P&L for better visualization
  const sortedData = [...data].sort((a, b) => b.totalPnL - a.totalPnL);

  const barChartData = {
    labels: sortedData.map(d => d.condition || 'Unknown'),
    datasets: [
      {
        label: 'Total P&L ($)',
        data: sortedData.map(d => d.totalPnL),
        backgroundColor: sortedData.map(d => 
          d.totalPnL >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: sortedData.map(d => 
          d.totalPnL >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Win Rate (%)',
        data: sortedData.map(d => d.winRate),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y1',
      },
    ],
  };

  const pieChartData = {
    labels: sortedData.map(d => d.condition || 'Unknown'),
    datasets: [
      {
        data: sortedData.map(d => d.totalTrades),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 101, 101)',
          'rgb(251, 191, 36)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Market Condition Performance' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const condition = sortedData[context.dataIndex];
            if (context.datasetIndex === 0) {
              return [
                `Total P&L: $${condition.totalPnL.toFixed(2)}`,
                `Avg P&L: $${condition.avgPnL.toFixed(2)}`,
                `Trades: ${condition.totalTrades}`,
                `Win Rate: ${condition.winRate.toFixed(1)}%`,
                `Profit Factor: ${condition.profitFactor.toFixed(2)}`,
              ];
            }
            return `Win Rate: ${condition.winRate.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Market Condition' },
        ticks: { font: { size: 11 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'P&L ($)' },
        ticks: { font: { size: 11 } },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Win Rate (%)' },
        grid: { drawOnChartArea: false },
        ticks: { font: { size: 11 }, min: 0, max: 100 },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' as const },
      title: { display: true, text: 'Trade Distribution by Market Condition' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const condition = sortedData[context.dataIndex];
            const total = sortedData.reduce((sum, d) => sum + d.totalTrades, 0);
            const percentage = ((condition.totalTrades / total) * 100).toFixed(1);
            return `${condition.condition}: ${condition.totalTrades} trades (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate summary stats
  const totalTrades = data.reduce((sum, d) => sum + d.totalTrades, 0);
  const totalPnL = data.reduce((sum, d) => sum + d.totalPnL, 0);
  const avgWinRate = data.length > 0 ? data.reduce((sum, d) => sum + d.winRate, 0) / data.length : 0;
  const bestCondition = data.reduce((best, current) => 
    current.totalPnL > best.totalPnL ? current : best, 
    { condition: 'None', totalPnL: -Infinity, winRate: 0, totalTrades: 0, avgPnL: 0, profitFactor: 0, maxDrawdown: 0, winningTrades: 0, losingTrades: 0, avgDuration: 0 }
  );

  // Find most traded condition
  const mostTradedCondition = data.reduce((most, current) => 
    current.totalTrades > most.totalTrades ? current : most, 
    { condition: 'None', totalTrades: 0, totalPnL: 0, winRate: 0, avgPnL: 0, profitFactor: 0, maxDrawdown: 0, winningTrades: 0, losingTrades: 0, avgDuration: 0 }
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
                <p className="text-sm font-medium text-muted-foreground">Best Condition</p>
                <p className="text-lg font-bold">{bestCondition.condition}</p>
                <p className="text-sm text-muted-foreground">${bestCondition.totalPnL.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Traded</p>
                <p className="text-lg font-bold">{mostTradedCondition.condition}</p>
                <p className="text-sm text-muted-foreground">{mostTradedCondition.totalTrades} trades</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Market Condition Performance</CardTitle>
            <CardDescription>
              Compare performance across different market conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Trade Distribution</CardTitle>
            <CardDescription>
              How your trades are distributed across market conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Condition Analysis */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Market Condition Analysis</CardTitle>
          <CardDescription>Detailed breakdown of each market condition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.map((condition, index) => (
              <div key={condition.condition} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {condition.condition || 'Unknown'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {condition.totalTrades} trades
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total P&L:</span>
                    <span className={condition.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${condition.totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg P&L:</span>
                    <span className={condition.avgPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${condition.avgPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Win Rate:</span>
                    <span>{condition.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Factor:</span>
                    <span className={condition.profitFactor >= 1 ? "text-green-600" : "text-red-600"}>
                      {condition.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Duration:</span>
                    <span>{condition.avgDuration.toFixed(0)}min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Drawdown:</span>
                    <span className="text-red-600">{condition.maxDrawdown.toFixed(1)}%</span>
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
