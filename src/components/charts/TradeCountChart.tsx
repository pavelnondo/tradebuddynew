
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
import { ChartContainer } from "@/components/ChartContainer";
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
  const chartConfig = {
    count: { label: "Number of Trades", color: "#60a5fa" }
  };

  return (
    <ChartContainer 
      title="Trade Frequency"
      icon={<BarChart3 className="h-5 w-5 text-primary" />}
      config={chartConfig}
      isEmpty={isEmpty || data.length === 0}
      isLoading={isLoading}
      emptyMessage="No trading frequency data available yet."
    >
      <ResponsiveContainer width="99%" height={180}>
        <BarChart 
          data={data}
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
            fill={chartConfig.count.color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
