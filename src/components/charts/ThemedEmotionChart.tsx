import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from 'lucide-react';

interface ThemedEmotionChartProps {
  data: Array<{ emotion: string; avgProfitLoss: number; tradeCount: number; winRate: number }>;
  loading?: boolean;
  error?: string;
}

export function ThemedEmotionChart({ data, loading, error }: ThemedEmotionChartProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data.filter(item => 
      item && 
      typeof item.emotion === 'string' && 
      typeof item.avgProfitLoss === 'number' && 
      !isNaN(item.avgProfitLoss) &&
      typeof item.tradeCount === 'number' &&
      !isNaN(item.tradeCount)
    );
  }, [data]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades with emotions to see patterns';

  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 200;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate profit/loss range
  const minPnl = hasData ? Math.min(...validData.map(d => d.avgProfitLoss)) : 0;
  const maxPnl = hasData ? Math.max(...validData.map(d => d.avgProfitLoss)) : 1000;
  const pnlRange = maxPnl - minPnl;
  const yMin = minPnl - pnlRange * 0.1;
  const yMax = maxPnl + pnlRange * 0.1;

  const xScale = (index: number) => margin.left + (index / (validData.length - 1)) * plotWidth;
  const yScale = (value: number) => margin.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

  // Y-axis labels
  const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
    const value = yMin + (i / 4) * (yMax - yMin);
    const y = yScale(value);
    return { value, y };
  });

  // X-axis labels (emotions)
  const xAxisLabels = validData.map((item, index) => ({
    label: item.emotion.substring(0, 4), // Shorten emotion names
    x: xScale(index)
  }));

  const bestEmotion = hasData ? validData.reduce((best, current) => 
    current.avgProfitLoss > best.avgProfitLoss ? current : best
  ) : null;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5" />
          <span>Emotion Impact</span>
        </CardTitle>
        <CardDescription>
          How emotions correlate with trading performance
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
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No data available</p>
              <p className="text-sm">{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Best emotion display */}
            {bestEmotion && (
              <div className="mb-4 text-center">
                <div className="text-lg font-semibold text-foreground capitalize">
                  Best Emotion: {bestEmotion.emotion}
                </div>
                <div className={`text-sm ${bestEmotion.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {bestEmotion.avgProfitLoss >= 0 ? '+' : ''}${bestEmotion.avgProfitLoss.toFixed(2)} avg
                  ({bestEmotion.tradeCount} trades, {bestEmotion.winRate.toFixed(0)}% win rate)
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

                {/* Bars */}
                {validData.map((item, index) => {
                  const barHeight = Math.abs(yScale(item.avgProfitLoss) - yScale(0));
                  const barY = item.avgProfitLoss >= 0 ? yScale(item.avgProfitLoss) : yScale(0);
                  const barWidth = Math.max(plotWidth / validData.length - 2, 2);
                  const barX = xScale(index) - barWidth / 2;
                  
                  return (
                    <g key={index}>
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={item.avgProfitLoss >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                        opacity="0.8"
                        className="transition-all duration-300 ease-out hover:opacity-100"
                      />
                      {/* Win rate indicator */}
                      {item.winRate >= 50 && (
                        <rect
                          x={barX + 1}
                          y={barY - 4}
                          width={barWidth - 2}
                          height="2"
                          fill="hsl(var(--primary))"
                          opacity="0.9"
                        />
                      )}
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
                    ${label.value.toFixed(0)}
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

            {/* Legend */}
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-xs text-muted-foreground">Profit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded"></div>
                <span className="text-xs text-muted-foreground">Loss</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-primary rounded"></div>
                <span className="text-xs text-muted-foreground">Win Rate ≥50%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
