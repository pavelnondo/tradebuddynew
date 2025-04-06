
import React from 'react';
import { LineChart } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartTooltipContent } from "@/components/ui/chart";

interface BalanceChartProps {
  data: Array<{
    date: string;
    balance: number;
    drawdown: number;
  }>;
  isEmpty?: boolean;
  isLoading?: boolean;
}

export function BalanceChart({ data, isEmpty = false, isLoading = false }: BalanceChartProps) {
  const chartConfig = {
    balance: { label: "Balance", color: "#3b82f6" },
    drawdown: { label: "Drawdown", color: "#f87171" }
  };

  return (
    <ChartContainer 
      title="Account Balance & Drawdown"
      icon={<LineChart className="h-5 w-5 text-primary" />}
      config={chartConfig}
      isEmpty={isEmpty || data.length === 0}
      isLoading={isLoading}
      emptyMessage="No balance data available yet."
    >
      <ResponsiveContainer width="99%" height={200}>
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickMargin={5}
            height={25}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke={chartConfig.balance.color}
            label={{ 
              value: 'Balance ($)', 
              angle: -90, 
              position: 'insideLeft', 
              offset: -5,
              style: { textAnchor: 'middle', fontSize: 11 }
            }}
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={40}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke={chartConfig.drawdown.color}
            label={{ 
              value: 'Drawdown (%)', 
              angle: 90, 
              position: 'insideRight', 
              offset: -5,
              style: { textAnchor: 'middle', fontSize: 11 }
            }}
            tick={{ fontSize: 10 }}
            tickMargin={5}
            width={40}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="balance" 
            stroke={chartConfig.balance.color} 
            fill={chartConfig.balance.color}
            fillOpacity={0.2}
            name="Account Balance ($)"
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="drawdown" 
            stroke={chartConfig.drawdown.color} 
            fill={chartConfig.drawdown.color}
            fillOpacity={0.2}
            name="Drawdown (%)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
