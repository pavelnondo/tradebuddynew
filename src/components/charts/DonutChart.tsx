import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DonutData {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutData[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  showLegend?: boolean;
}

export function DonutChart({ 
  data, 
  title = "Distribution Analysis",
  description = "Visualize data distribution",
  isLoading = false,
  showLegend = true
}: DonutChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-medium">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Center total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
