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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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

// Recharts doesn't need registration

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
    const colors = [
      '#10b981', // emerald-500
      '#3b82f6', // blue-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
    ];

    return data.map((d, index) => ({
      name: d.label,
      value: d.value,
      trades: d.trades.length,
      fill: colors[index % colors.length],
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Trades: <span className="font-medium">{data.trades}</span>
          </p>
          <p className="text-xs text-blue-600 mt-1">Click to drill down</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartData = getChartData();
    
    // Ensure chartData is valid and filter out invalid entries
    const safeChartData = Array.isArray(chartData) ? chartData.filter(item => 
      item && 
      typeof item.value === 'number' && 
      !isNaN(item.value) &&
      item.name
    ) : [];
    
    // If no valid data, return empty state
    if (safeChartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">No valid data to display</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  const originalData = data.find(d => d.name === data.name);
                  if (originalData) {
                    handleDataClick(originalData);
                  }
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                onClick={(data) => {
                  const originalData = data.find(d => d.name === data.name);
                  if (originalData) {
                    handleDataClick(originalData);
                  }
                }}
                className="cursor-pointer"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  const originalData = data.find(d => d.name === data.name);
                  if (originalData) {
                    handleDataClick(originalData);
                  }
                }}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  const originalData = data.find(d => d.name === data.name);
                  if (originalData) {
                    handleDataClick(originalData);
                  }
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        );
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
