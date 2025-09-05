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
  Bar, 
  Line 
} from 'react-chartjs-2';
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
    
    return {
      labels: filteredData.map(d => d.period),
      datasets: [
        {
          label: 'Total P&L ($)',
          data: filteredData.map(d => d.metrics.totalPnL),
          backgroundColor: filteredData.map(d => 
            d.metrics.totalPnL >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
          ),
          borderColor: filteredData.map(d => 
            d.metrics.totalPnL >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
          ),
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          label: 'Win Rate (%)',
          data: filteredData.map(d => d.metrics.winRate),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getTrendsChartData = () => {
    const filteredData = comparisonData.filter(d => selectedPeriods.includes(d.period));
    
    return {
      labels: filteredData.map(d => d.period),
      datasets: [
        {
          label: 'Total Trades',
          data: filteredData.map(d => d.metrics.totalTrades),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          label: 'Avg Duration (min)',
          data: filteredData.map(d => d.metrics.avgDuration),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const },
        title: { display: true, text: `Period Comparison - ${comparisonType}` },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const period = comparisonData.find(d => selectedPeriods.includes(d.period));
              if (context.datasetIndex === 0) {
                return [
                  `Total P&L: $${period?.metrics.totalPnL.toFixed(2)}`,
                  `Win Rate: ${period?.metrics.winRate.toFixed(1)}%`,
                  `Total Trades: ${period?.metrics.totalTrades}`,
                  `Profit Factor: ${period?.metrics.profitFactor.toFixed(2)}`,
                ];
              }
              return `Win Rate: ${period?.metrics.winRate.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: { 
          title: { display: true, text: 'Period' },
          ticks: { font: { size: 11 } },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: { display: true, text: comparisonType === 'performance' ? 'P&L ($)' : 'Count' },
          ticks: { font: { size: 11 } },
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: { display: true, text: comparisonType === 'performance' ? 'Win Rate (%)' : 'Duration (min)' },
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 11 } },
        },
      },
    };
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
              <div className="h-96">
                <Bar 
                  data={comparisonType === 'performance' ? getPerformanceChartData() : getTrendsChartData()} 
                  options={getChartOptions()} 
                />
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
