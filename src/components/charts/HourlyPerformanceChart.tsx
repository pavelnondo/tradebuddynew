
import React from 'react';
import { Clock } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartTooltipContent } from "@/components/ui/chart";

interface HourlyPerformanceProps {
  data: Array<{
    hourFormatted: string;
    profitLoss: number;
    winRate: number;
  }>;
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function HourlyPerformanceChart({ 
  data, 
  isEmpty = false, 
  isLoading = false 
}: HourlyPerformanceProps) {
  return (
    <ChartContainer 
      title="Best Trading Hours"
      icon={<Clock className="h-5 w-5 text-primary" />}
      isEmpty={isEmpty || data.length === 0}
      isLoading={isLoading}
      emptyMessage="No time-based analysis data available yet."
    >
      <ResponsiveContainer width="99%" height="99%">
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hourFormatted"
            tick={{ fontSize: 10 }}
            tickMargin={5}
            height={25}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left"
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={30}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={30}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar
            yAxisId="left"
            dataKey="profitLoss"
            name="P&L ($)"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="winRate"
            name="Win Rate (%)"
            fill="#4ade80"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
