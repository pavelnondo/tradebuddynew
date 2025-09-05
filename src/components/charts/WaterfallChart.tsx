import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface WaterfallData {
  name: string;
  value: number;
  type: 'start' | 'positive' | 'negative' | 'end';
}

interface WaterfallChartProps {
  data: WaterfallData[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function WaterfallChart({ 
  data, 
  title = "P&L Waterfall Analysis",
  description = "Track cumulative profit/loss changes over time",
  isLoading = false 
}: WaterfallChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate cumulative values for waterfall
  const processedData = data.map((item, index) => {
    let cumulative = 0;
    if (index === 0) {
      cumulative = item.value;
    } else {
      cumulative = data.slice(0, index + 1).reduce((sum, d) => sum + d.value, 0);
    }
    
    return {
      ...item,
      cumulative,
      startValue: index === 0 ? 0 : data.slice(0, index).reduce((sum, d) => sum + d.value, 0),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Change: <span className={`font-medium ${data.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.value.toFixed(2)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Cumulative: <span className="font-medium">${data.cumulative.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (type: string, value: number) => {
    switch (type) {
      case 'start':
      case 'end':
        return '#6b7280'; // gray
      case 'positive':
        return '#10b981'; // green
      case 'negative':
        return '#ef4444'; // red
      default:
        return value >= 0 ? '#10b981' : '#ef4444';
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.type, entry.value)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
