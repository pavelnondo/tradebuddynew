import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';

interface ThemedBalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number; drawdown?: number }>;
  loading?: boolean;
  error?: string;
}

export function ThemedBalanceChart({ balanceOverTime, loading, error }: ThemedBalanceChartProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(balanceOverTime) || balanceOverTime.length === 0) {
      return [];
    }
    return balanceOverTime
      .filter(item => item && typeof item.date === 'string' && typeof item.balance === 'number' && !isNaN(item.balance))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [balanceOverTime]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades to see your balance progression over time';

  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 200;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Calculate balance range and Y-scale
  const minBalance = hasData ? Math.min(...validData.map(d => d.balance)) : 0;
  const maxBalance = hasData ? Math.max(...validData.map(d => d.balance)) : 10000;
  const balanceRange = maxBalance - minBalance;
  const yMin = Math.max(0, minBalance - balanceRange * 0.1);
  const yMax = maxBalance + balanceRange * 0.1;

  const xScale = (index: number) => margin.left + (index / (validData.length - 1)) * plotWidth;
  const yScale = (balance: number) => margin.top + plotHeight - ((balance - yMin) / (yMax - yMin)) * plotHeight;

  // Create smooth line path
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePoints = validData.map((d, i) => ({ x: xScale(i), y: yScale(d.balance) }));
  const pathData = createSmoothPath(linePoints);

  // Y-axis labels
  const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
    const value = yMin + (i / 4) * (yMax - yMin);
    const y = yScale(value);
    return { value, y };
  });

  // X-axis labels (dates)
  const xAxisLabels = Array.from({ length: Math.min(validData.length, 5) }).map((_, i) => {
    const dataIndex = Math.floor(i * (validData.length - 1) / 4);
    const date = new Date(validData[dataIndex].date);
    const x = xScale(dataIndex);
    return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x };
  });

  const currentBalanceValue = hasData ? validData[validData.length - 1].balance : 0;
  const initialBalanceValue = hasData ? validData[0].balance : 0;
  const totalChange = currentBalanceValue - initialBalanceValue;
  const isProfit = totalChange >= 0;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Balance Over Time</span>
        </CardTitle>
        <CardDescription>
          Your account balance progression
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
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No data available</p>
              <p className="text-sm">{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Current balance display */}
            {hasData && (
              <div className="mb-4 flex justify-between items-center px-2">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-foreground">
                    ${currentBalanceValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Current Balance</div>
                </div>
                <div className="text-center flex-1">
                  <div className={`text-xl font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '+' : ''}${totalChange.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Total Change</div>
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
                {xAxisLabels.map((label, index) => (
                  <line
                    key={index}
                    x1={label.x}
                    y1={margin.top}
                    x2={label.x}
                    y2={chartHeight - margin.bottom}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    opacity="0.2"
                  />
                ))}

                {/* Area fill */}
                {pathData && (
                  <path
                    d={`${pathData} L ${linePoints[linePoints.length - 1].x} ${chartHeight - margin.bottom} L ${linePoints[0].x} ${chartHeight - margin.bottom} Z`}
                    fill="url(#balanceGradient)"
                    className="transition-all duration-500 ease-out"
                    opacity="0.15"
                  />
                )}

                {/* Line path */}
                {pathData && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isProfit ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 ease-out"
                  />
                )}

                {/* Data points */}
                {validData.map((d, i) => (
                  <circle
                    key={i}
                    cx={xScale(i)}
                    cy={yScale(d.balance)}
                    r="3"
                    fill={isProfit ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                    stroke="hsl(var(--background))"
                    strokeWidth="1.5"
                    className="transition-all duration-300 ease-out hover:scale-125"
                  />
                ))}

                {/* Y-axis labels */}
                {yAxisLabels.map((label, index) => (
                  <text
                    key={index}
                    x={margin.left - 10}
                    y={label.y + 5}
                    textAnchor="end"
                    className="text-xs fill-muted-foreground font-medium"
                  >
                    ${label.value.toLocaleString()}
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

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isProfit ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={isProfit ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
