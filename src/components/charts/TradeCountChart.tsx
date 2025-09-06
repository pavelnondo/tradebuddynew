
import React from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";

interface TradeCountChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function TradeCountChart({ data, isEmpty = false, isLoading = false }: TradeCountChartProps) {
  if (isLoading) {
    return <div className="chart-container" style={{ minHeight: 180 }}>Loading...</div>;
  }
  
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.count === 'number' && 
    !isNaN(item.count) && 
    item.count >= 0 &&
    item.date
  ) : [];
  
  if (isEmpty || safeData.length === 0) {
    return <div className="chart-container" style={{ minHeight: 180 }}>No trading frequency data available yet.</div>;
  }

  return (
    <div className="chart-container" style={{ minHeight: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={safeData}
          margin={{ top: 15, right: 30, left: 10, bottom: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickMargin={5}
            height={40}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={40}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            name="Trades"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
