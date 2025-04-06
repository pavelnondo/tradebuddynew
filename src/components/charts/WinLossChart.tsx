
import React from 'react';
import { PieChart } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartTooltipContent } from "@/components/ui/chart";

interface WinLossChartProps {
  data: {
    wins: number;
    losses: number;
  };
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function WinLossChart({ data, isEmpty = false, isLoading = false }: WinLossChartProps) {
  const chartConfig = {
    wins: { label: "Wins", color: "#4ade80" },
    losses: { label: "Losses", color: "#f87171" },
  };

  const chartData = [
    { name: "Wins", value: data.wins },
    { name: "Losses", value: data.losses }
  ];

  const hasData = data.wins > 0 || data.losses > 0;

  return (
    <ChartContainer 
      title="Win/Loss Ratio"
      icon={<PieChart className="h-5 w-5 text-primary" />}
      config={chartConfig}
      isEmpty={isEmpty || !hasData}
      isLoading={isLoading}
      emptyMessage="No win/loss data available yet."
    >
      <ResponsiveContainer width="99%" height={180}>
        <RechartPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={65}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            <Cell key="win-cell" fill={chartConfig.wins.color} />
            <Cell key="loss-cell" fill={chartConfig.losses.color} />
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </RechartPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
