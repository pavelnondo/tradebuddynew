
import React from 'react';
import { LineChart } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartTooltipContent } from "@/components/ui/chart";

interface BarPerformanceProps {
  data: Array<Record<string, any>>;
  title: string;
  dataKey: string;
  categoryKey: string;
  nameKey?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function BarPerformanceChart({ 
  data, 
  title, 
  dataKey, 
  categoryKey, 
  nameKey,
  isEmpty = false, 
  isLoading = false,
  emptyMessage = "No data available yet."
}: BarPerformanceProps) {
  const chartConfig = {
    profit: { label: "Profit", color: "hsl(143, 85%, 46%)" },
    loss: { label: "Loss", color: "hsl(0, 84%, 60%)" },
  };

  return (
    <ChartContainer 
      title={title}
      icon={<LineChart className="h-5 w-5 text-primary" />}
      isEmpty={isEmpty || data.length === 0}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      config={chartConfig}
    >
      <ResponsiveContainer width="99%" height={180}>
        <BarChart 
          data={data} 
          margin={{ top: 15, right: 15, left: 10, bottom: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={categoryKey}
            tick={{ fontSize: 10 }}
            tickMargin={5}
            height={40}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={40}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey={dataKey}
            name={nameKey || dataKey}
            radius={[4, 4, 0, 0]}
          >
            {dataKey === "profitLoss" && data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry[dataKey] >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
              />
            ))}
            {dataKey !== "profitLoss" && <Cell fill="#60a5fa" />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
