import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

interface ThemedTradeCountChartProps {
  data: Array<{ date: string; count: number }>;
  loading?: boolean;
  error?: string;
}

export function ThemedTradeCountChart({ data, loading, error }: ThemedTradeCountChartProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data.filter(item => 
      item && 
      typeof item.date === 'string' && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.count >= 0
    );
  }, [data]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Start trading to see your trading activity patterns';

  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 200;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate count range
  const maxCount = hasData ? Math.max(...validData.map(d => d.count)) : 10;
  const yMax = maxCount + Math.ceil(maxCount * 0.1); // 10% padding

  const xScale = (index: number) => margin.left + (index / (validData.length - 1)) * plotWidth;
  const yScale = (count: number) => margin.top + plotHeight - ((count / yMax) * plotHeight);

  // Y-axis labels
  const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
    const value = (i / 4) * yMax;
    const y = yScale(value);
    return { value, y };
  });

  // X-axis labels (dates)
  const xAxisLabels = validData.map((item, index) => ({
    label: item.date,
    x: xScale(index)
  }));

  const totalTrades = validData.reduce((sum, item) => sum + item.count, 0);
  const avgTradesPerDay = validData.length > 0 ? totalTrades / validData.length : 0;
  const mostActiveDay = hasData ? validData.reduce((max, current) => 
    current.count > max.count ? current : max
  ) : null;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Trading Activity</span>
        </CardTitle>
        <CardDescription>
          Your trading frequency and patterns over time
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            <div className="text-center">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No data available</p>
              <p className="text-sm">{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Key metrics display */}
            {mostActiveDay && (
              <div className="mb-4 flex justify-between items-center px-2">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-foreground">
                    {mostActiveDay.date}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Most Active Day</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-xl font-semibold text-primary">
                    {mostActiveDay.count} trades
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {avgTradesPerDay.toFixed(1)} avg/day
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="flex-1 min-h-0">
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                {/* Grid lines */}
                {yAxisLabels.map((label, index) => (
                  <line
                    key={index}
                    x1={margin.left}
                    y1={label.y}
                    x2={chartWidth - margin.right}
                    y2={label.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    opacity="0.2"
                  />
                ))}

                {/* Bars with enhanced styling */}
                {validData.map((item, index) => {
                  const barHeight = yScale(0) - yScale(item.count);
                  const barY = yScale(item.count);
                  const barWidth = Math.max(plotWidth / validData.length - 2, 2);
                  const barX = xScale(index) - barWidth / 2;
                  
                  return (
                    <g key={index}>
                      {/* Bar shadow */}
                      <rect
                        x={barX + 1}
                        y={barY + 1}
                        width={barWidth}
                        height={barHeight}
                        fill="rgba(0,0,0,0.1)"
                        opacity="0.3"
                      />
                      {/* Main bar */}
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill="hsl(var(--primary))"
                        opacity="0.8"
                        className="transition-all duration-300 ease-out hover:opacity-100"
                        rx="2"
                        ry="2"
                      />
                    </g>
                  );
                })}

                {/* Y-axis labels */}
                {yAxisLabels.map((label, index) => (
                  <text
                    key={index}
                    x={margin.left - 10}
                    y={label.y + 5}
                    textAnchor="end"
                    className="text-xs fill-muted-foreground font-medium"
                  >
                    {label.value.toFixed(0)}
                  </text>
                ))}

                {/* X-axis labels */}
                {xAxisLabels.map((label, index) => (
                  <text
                    key={index}
                    x={label.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground font-medium"
                  >
                    {label.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded shadow-sm"></div>
                <span className="text-xs text-muted-foreground font-medium">Trades per Day</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
