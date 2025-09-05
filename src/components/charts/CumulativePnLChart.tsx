import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CumulativeData {
  date: string;
  cumulativePnL: number;
  tradePnL: number;
  drawdown: number;
  peak: number;
  tradeCount: number;
}

interface CumulativePnLChartProps {
  data: CumulativeData[];
  initialBalance: number;
  isLoading?: boolean;
}

export function CumulativePnLChart({ data, initialBalance, isLoading = false }: CumulativePnLChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate current balance
  const currentBalance = initialBalance + (data.length > 0 ? data[data.length - 1].cumulativePnL : 0);
  const totalReturn = data.length > 0 ? data[data.length - 1].cumulativePnL : 0;
  const returnPercentage = (totalReturn / initialBalance) * 100;
  
  // Calculate max drawdown
  const maxDrawdown = data.length > 0 ? Math.max(...data.map(d => d.drawdown)) : 0;
  
  // Calculate win streak and loss streak
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  
  data.forEach(d => {
    if (d.tradePnL >= 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  });

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Cumulative P&L',
        data: data.map(d => d.cumulativePnL),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: data.map(d => d.tradePnL >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'),
        pointBorderColor: data.map(d => d.tradePnL >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'),
      },
      {
        label: 'Peak',
        data: data.map(d => d.peak),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Cumulative P&L with Drawdown Analysis' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = data[context.dataIndex];
            if (context.datasetIndex === 0) {
              return [
                `Cumulative P&L: $${point.cumulativePnL.toFixed(2)}`,
                `Trade P&L: $${point.tradePnL.toFixed(2)}`,
                `Drawdown: ${point.drawdown.toFixed(1)}%`,
                `Peak: $${point.peak.toFixed(2)}`,
                `Trade #${point.tradeCount}`,
              ];
            }
            return `Peak: $${point.peak.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date' },
        grid: { color: 'rgba(156,163,175,0.1)' },
      },
      y: {
        title: { display: true, text: 'P&L ($)' },
        grid: { color: 'rgba(156,163,175,0.1)' },
        beginAtZero: false,
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">${currentBalance.toFixed(2)}</p>
              </div>
              <div className={`p-2 rounded-full ${
                totalReturn >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {totalReturn >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Return</p>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalReturn.toFixed(2)}
                </p>
                <p className={`text-sm ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {returnPercentage.toFixed(2)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-600">{maxDrawdown.toFixed(1)}%</p>
              </div>
              <div className={`p-2 rounded-full ${
                maxDrawdown >= 20 ? 'bg-red-100 text-red-600' : 
                maxDrawdown >= 10 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Win Streak</p>
                <p className="text-2xl font-bold text-green-600">{maxWinStreak}</p>
                <p className="text-sm text-muted-foreground">Current: {currentWinStreak}</p>
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
          <CardTitle>Cumulative P&L with Drawdown Analysis</CardTitle>
          <CardDescription>
            Track your account growth and identify periods of drawdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <Badge variant={maxDrawdown >= 20 ? "destructive" : maxDrawdown >= 10 ? "secondary" : "default"}>
                  {maxDrawdown.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Drawdown</span>
                <Badge variant={data.length > 0 && data[data.length - 1].drawdown >= 10 ? "destructive" : "default"}>
                  {data.length > 0 ? data[data.length - 1].drawdown.toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <Badge variant={
                  maxDrawdown >= 20 ? "destructive" : 
                  maxDrawdown >= 10 ? "secondary" : "default"
                }>
                  {maxDrawdown >= 20 ? "High" : maxDrawdown >= 10 ? "Medium" : "Low"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Streak Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Best Win Streak</span>
                <Badge variant="default">{maxWinStreak} trades</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Worst Loss Streak</span>
                <Badge variant="destructive">{maxLossStreak} trades</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <Badge variant={currentWinStreak > 0 ? "default" : "destructive"}>
                  {currentWinStreak > 0 ? `${currentWinStreak} wins` : `${currentLossStreak} losses`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
