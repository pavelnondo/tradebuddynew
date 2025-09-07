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
  ZoomIn, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

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

const chartIcons = {
  'bar': BarChart3,
  'line': LineChart,
  'pie': PieChart,
};

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
    item.label &&
    typeof item.value === 'number' && 
    !isNaN(item.value) &&
    Array.isArray(item.trades)
  ) : [];

  if (safeData.length === 0) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="chart-empty">
            <Target className="icon" />
            <div>No drill-down data available yet.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by value for better visualization
  const sortedData = [...safeData].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...sortedData.map(item => Math.abs(item.value)));
  const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);
  const totalTrades = sortedData.reduce((sum, item) => sum + item.trades.length, 0);

  const IconComponent = chartIcons[chartType] || BarChart3;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <table className="charts-css bar" role="chart">
            <tbody>
              {sortedData.map((item, index) => {
                const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
                const isPositive = item.value >= 0;
                const colorClass = isPositive ? 'profit' : 'loss';
                
                return (
                  <tr key={index}>
                    <td 
                      className={colorClass}
                      style={{ 
                        '--size': `${percentage}%`,
                        '--color-chart-1': isPositive ? 'var(--color-profit)' : 'var(--color-loss)'
                      } as React.CSSProperties}
                      onClick={() => handleDataClick(item)}
                    >
                      <span className="data">
                        {isPositive ? '+' : ''}{item.value.toLocaleString()}
                      </span>
                      <span className="label">
                        <Target className="w-3 h-3 inline mr-1" />
                        {item.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'pie':
        const pieData = sortedData.map((item, index) => ({
          ...item,
          percentage: (item.value / totalValue) * 100,
          startAngle: sortedData.slice(0, index).reduce((sum, d) => sum + (d.value / totalValue) * 100, 0)
        }));

        return (
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="doughnut-chart w-full h-full" style={{
                background: `conic-gradient(${pieData.map((item, index) => {
                  const startAngle = item.startAngle;
                  const endAngle = startAngle + item.percentage;
                  const colors = ['var(--color-profit)', 'var(--color-primary)', 'var(--color-warning)', 'var(--color-loss)', 'var(--color-chart-5)', 'var(--color-chart-6)'];
                  return `${colors[index % colors.length]} ${startAngle}% ${endAngle}%`;
                }).join(', ')})`
              }}>
                <div className="doughnut-center">
                  <div className="percentage">{totalValue.toLocaleString()}</div>
                  <div className="label">Total Value</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="space-y-3">
            {sortedData.map((item, index) => {
              const isPositive = item.value >= 0;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full" style={{ 
                      backgroundColor: isPositive ? 'var(--color-profit)' : 'var(--color-loss)',
                      opacity: 0.2 
                    }}>
                      <TrendingUp className="w-4 h-4" style={{ 
                        color: isPositive ? 'var(--color-profit)' : 'var(--color-loss)' 
                      }} />
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.trades.length} trades
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{item.value.toLocaleString()}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDataClick(item)}
                      className="text-xs"
                    >
                      <ZoomIn className="w-3 h-3 mr-1" />
                      Drill Down
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">
            Total Value: 
            <span className={`ml-1 font-medium ${totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalValue >= 0 ? '+' : ''}{totalValue.toLocaleString()}
            </span>
            • Total Trades: <span className="font-medium">{totalTrades}</span>
          </div>
          
          {renderChart()}
          
          {/* Legend for pie chart */}
          {chartType === 'pie' && (
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {sortedData.map((item, index) => {
                const colors = ['var(--color-profit)', 'var(--color-primary)', 'var(--color-warning)', 'var(--color-loss)', 'var(--color-chart-5)', 'var(--color-chart-6)'];
                const color = colors[index % colors.length];
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.label}: {item.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-muted/30 rounded text-center">
              <div className="text-xs text-muted-foreground">Total Value</div>
              <div className={`font-semibold ${totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalValue >= 0 ? '+' : ''}{totalValue.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded text-center">
              <div className="text-xs text-muted-foreground">Total Trades</div>
              <div className="font-semibold">{totalTrades}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded text-center">
              <div className="text-xs text-muted-foreground">Categories</div>
              <div className="font-semibold">{sortedData.length}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded text-center">
              <div className="text-xs text-muted-foreground">Best Category</div>
              <div className="font-semibold text-sm">{sortedData[0]?.label}</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Drill Down Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZoomIn className="w-5 h-5" />
              Drill Down: {selectedData?.label}
            </DialogTitle>
            <DialogDescription>
              Detailed view of {selectedData?.trades.length} trades
            </DialogDescription>
          </DialogHeader>
          
          {selectedData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{selectedData.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedData.trades.length} trades • Value: {selectedData.value.toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {chartType.toUpperCase()} Chart
                  </Badge>
                </div>
              </div>
              
              {/* Trades List */}
              <div className="space-y-2">
                <h4 className="font-medium">Trades</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedData.trades.map((trade, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{trade.asset || trade.symbol || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.date ? new Date(trade.date).toLocaleDateString() : 'No date'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trade.tradeType || trade.type || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}