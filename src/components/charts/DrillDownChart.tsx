import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Bar, 
  Line, 
  Pie 
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
  ArcElement,
} from 'chart.js';
import { 
  ZoomIn, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Calendar
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
  Filler,
  ArcElement
);

interface DrillDownData {
  label: string;
  value: number;
  trades: any[];
  subData?: DrillDownData[];
}

interface DrillDownChartProps {
  title: string;
  description: string;
  data: DrillDownData[];
  chartType: 'bar' | 'line' | 'pie';
  onDrillDown: (data: DrillDownData) => void;
  isLoading?: boolean;
}

export function DrillDownChart({ 
  title, 
  description, 
  data, 
  chartType, 
  onDrillDown,
  isLoading = false 
}: DrillDownChartProps) {
  const [selectedData, setSelectedData] = useState<DrillDownData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDataClick = (dataPoint: DrillDownData) => {
    setSelectedData(dataPoint);
    setIsDialogOpen(true);
    onDrillDown(dataPoint);
  };

  const getChartData = () => {
    return {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: title,
          data: data.map(d => d.value),
          backgroundColor: data.map((_, index) => {
            const colors = [
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(245, 101, 101, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ];
            return colors[index % colors.length];
          }),
          borderColor: data.map((_, index) => {
            const colors = [
              'rgb(16, 185, 129)',
              'rgb(59, 130, 246)',
              'rgb(245, 101, 101)',
              'rgb(251, 191, 36)',
              'rgb(139, 92, 246)',
              'rgb(236, 72, 153)',
            ];
            return colors[index % colors.length];
          }),
          borderWidth: 2,
          borderRadius: 4,
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
        title: { display: true, text: title },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const dataPoint = data[context.dataIndex];
              return [
                `${dataPoint.label}: ${dataPoint.value}`,
                `Trades: ${dataPoint.trades.length}`,
                'Click to drill down',
              ];
            },
          },
        },
      },
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          handleDataClick(data[index]);
        }
      },
      scales: chartType === 'pie' ? {} : {
        x: { 
          title: { display: true, text: 'Category' },
          ticks: { font: { size: 11 } },
        },
        y: {
          title: { display: true, text: 'Value' },
          ticks: { font: { size: 11 } },
        },
      },
    };
  };

  const renderChart = () => {
    const chartData = getChartData();
    const options = getChartOptions();

    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
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
    <>
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            {title}
            <ZoomIn className="w-4 h-4 ml-2 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            {description} - Click on any data point to drill down
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Drill Down Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Drill Down: {selectedData?.label}
            </DialogTitle>
            <DialogDescription>
              Detailed view of {selectedData?.trades.length} trades
            </DialogDescription>
          </DialogHeader>
          
          {selectedData && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                        <p className="text-2xl font-bold">{selectedData.trades.length}</p>
                      </div>
                      <Target className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                        <p className={`text-2xl font-bold ${
                          selectedData.value >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${selectedData.value.toFixed(2)}
                        </p>
                      </div>
                      {selectedData.value >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold">
                          {selectedData.trades.length > 0 
                            ? ((selectedData.trades.filter(t => (t.profitLoss || 0) > 0).length / selectedData.trades.length) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {selectedData.trades.length > 0 
                            ? ((selectedData.trades.filter(t => (t.profitLoss || 0) > 0).length / selectedData.trades.length) * 100).toFixed(0)
                            : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                        <p className="text-2xl font-bold">
                          {selectedData.trades.length > 0 
                            ? (selectedData.trades.reduce((sum, t) => sum + (t.duration || 0), 0) / selectedData.trades.length).toFixed(0)
                            : 0}min
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trades List */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Trades</CardTitle>
                  <CardDescription>
                    Detailed breakdown of each trade in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedData.trades.map((trade, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {typeof trade.date === 'string' 
                                ? new Date(trade.date).toLocaleDateString()
                                : trade.date.toLocaleDateString()}
                            </span>
                          </div>
                          <Badge variant="outline">{trade.asset}</Badge>
                          <Badge variant={trade.tradeType === 'Buy' ? 'default' : 'secondary'}>
                            {trade.tradeType}
                          </Badge>
                          {trade.emotion && (
                            <Badge variant="outline" className="capitalize">
                              {trade.emotion}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`font-medium ${
                              (trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${(trade.profitLoss || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trade.duration || 0}min
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {trade.entryPrice} → {trade.exitPrice}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trade.positionSize || 1} units
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
