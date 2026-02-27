import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface WorkingChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  type?: 'line' | 'bar';
  loading?: boolean;
  error?: string | null;
}

export const WorkingChart: React.FC<WorkingChartProps> = ({ 
  data, 
  title, 
  type = 'line', 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div className="chart-container flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container flex items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
      <div className="h-[300px] w-full min-h-[200px]" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
