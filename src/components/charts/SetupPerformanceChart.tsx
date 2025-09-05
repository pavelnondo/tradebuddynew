import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

  const chartData = {
    labels: sortedData.map(d => d.setup || 'Unknown'),
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Setup Performance Analysis' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const setup = sortedData[context.dataIndex];
            if (context.datasetIndex === 0) {
              return [
                `Total P&L: $${setup.totalPnL.toFixed(2)}`,
                `Avg P&L: $${setup.avgPnL.toFixed(2)}`,
                `Trades: ${setup.totalTrades}`,
                `Win Rate: ${setup.winRate.toFixed(1)}%`,
                `Profit Factor: ${setup.profitFactor.toFixed(2)}`,
              ];
            }
            return `Win Rate: ${setup.winRate.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Trading Setup' },
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

      {/* Main Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Setup Performance Analysis</CardTitle>
          <CardDescription>
            Compare the performance of different trading setups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Bar data={chartData} options={chartOptions} />
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
