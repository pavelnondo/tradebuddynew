import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
  trades?: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function HeatmapChart({ 
  data, 
  title = "Trading Activity Heatmap",
  description = "Visualize trading activity by day and hour",
  isLoading = false 
}: HeatmapChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  // Create a 7x24 grid for days of week and hours
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Find min/max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const getColorIntensity = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = (value - minValue) / (maxValue - minValue);
    if (intensity < 0.2) return 'bg-blue-200';
    if (intensity < 0.4) return 'bg-blue-300';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  const getValue = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.value || 0;
  };

  const getTrades = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.trades || 0;
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="grid grid-cols-25 gap-1">
            {/* Header row with hours */}
            <div></div>
            {hours.map(hour => (
              <div key={hour} className="text-xs text-center text-muted-foreground font-medium">
                {hour}
              </div>
            ))}
            
            {/* Data rows */}
            {days.map(day => (
              <React.Fragment key={day}>
                <div className="text-xs text-muted-foreground font-medium flex items-center">
                  {day}
                </div>
                {hours.map(hour => {
                  const value = getValue(day, hour);
                  const trades = getTrades(day, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-4 h-4 rounded-sm ${getColorIntensity(value)} cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${day} ${hour}:00 - Value: ${value}, Trades: ${trades}`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Less</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-100 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-200 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-300 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
            </div>
            <span className="text-muted-foreground">More</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">Peak Hour</div>
              <div className="text-muted-foreground">
                {(() => {
                  const peakData = data.reduce((max, current) => 
                    current.value > max.value ? current : max
                  );
                  return `${peakData.day} ${peakData.hour}:00`;
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Total Activity</div>
              <div className="text-muted-foreground">
                {data.reduce((sum, d) => sum + d.value, 0).toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Avg per Hour</div>
              <div className="text-muted-foreground">
                {(data.reduce((sum, d) => sum + d.value, 0) / 168).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
