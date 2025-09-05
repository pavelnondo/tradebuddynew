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
import { Clock, Calendar, TrendingUp, TrendingDown, Target } from "lucide-react";

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

interface TimeBasedData {
  period: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  avgPnL: number;
  winRate: number;
  avgDuration: number;
  profitFactor: number;
}

interface TimeBasedAnalysisProps {
  data: TimeBasedData[];
  analysisType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  isLoading?: boolean;
}

export function TimeBasedAnalysis({ data, analysisType, isLoading = false }: TimeBasedAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  const getChartTitle = () => {
    switch (analysisType) {
      case 'hourly': return 'Hourly Trading Performance';
      case 'daily': return 'Daily Trading Performance';
      case 'weekly': return 'Weekly Trading Performance';
      case 'monthly': return 'Monthly Trading Performance';
      default: return 'Time-Based Performance';
    }
  };

  const getPeriodLabel = () => {
    switch (analysisType) {
      case 'hourly': return 'Hour';
      case 'daily': return 'Day';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      default: return 'Period';
    }
  };

  // Sort data by period for better visualization
  const sortedData = [...data].sort((a, b) => {
    if (analysisType === 'hourly') {
      return parseInt(a.period) - parseInt(b.period);
    }
    return a.period.localeCompare(b.period);
  });

  const chartData = {
    labels: sortedData.map(d => d.period),
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
      title: { display: true, text: getChartTitle() },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const period = sortedData[context.dataIndex];
            if (context.datasetIndex === 0) {
              return [
                `Total P&L: $${period.totalPnL.toFixed(2)}`,
                `Avg P&L: $${period.avgPnL.toFixed(2)}`,
                `Trades: ${period.totalTrades}`,
                `Win Rate: ${period.winRate.toFixed(1)}%`,
                `Profit Factor: ${period.profitFactor.toFixed(2)}`,
              ];
            }
            return `Win Rate: ${period.winRate.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: { 
        title: { display: true, text: getPeriodLabel() },
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
  const bestPeriod = data.reduce((best, current) => 
    current.totalPnL > best.totalPnL ? current : best, 
    { period: 'None', totalPnL: -Infinity, winRate: 0, totalTrades: 0, avgPnL: 0, profitFactor: 0, winningTrades: 0, losingTrades: 0, avgDuration: 0 }
  );

  // Find most active period
  const mostActivePeriod = data.reduce((most, current) => 
    current.totalTrades > most.totalTrades ? current : most, 
    { period: 'None', totalTrades: 0, totalPnL: 0, winRate: 0, avgPnL: 0, profitFactor: 0, winningTrades: 0, losingTrades: 0, avgDuration: 0 }
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
                <p className="text-sm font-medium text-muted-foreground">Best {getPeriodLabel()}</p>
                <p className="text-lg font-bold">{bestPeriod.period}</p>
                <p className="text-sm text-muted-foreground">${bestPeriod.totalPnL.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Most Active</p>
                <p className="text-lg font-bold">{mostActivePeriod.period}</p>
                <p className="text-sm text-muted-foreground">{mostActivePeriod.totalTrades} trades</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>
            Analyze your trading performance across different time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Period Analysis */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>{getPeriodLabel()} Performance Details</CardTitle>
          <CardDescription>Detailed breakdown of each time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.slice(0, 12).map((period, index) => (
              <div key={period.period} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {period.period}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {period.totalTrades} trades
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total P&L:</span>
                    <span className={period.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${period.totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg P&L:</span>
                    <span className={period.avgPnL >= 0 ? "text-green-600" : "text-red-600"}>
                      ${period.avgPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Win Rate:</span>
                    <span>{period.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Factor:</span>
                    <span className={period.profitFactor >= 1 ? "text-green-600" : "text-red-600"}>
                      {period.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Duration:</span>
                    <span>{period.avgDuration.toFixed(0)}min</span>
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
