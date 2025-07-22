import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface AssetPerformance {
  asset: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface BarPerformanceChartProps {
  data: AssetPerformance[];
}

export function BarPerformanceChart({ data }: BarPerformanceChartProps) {
  const chartData = {
    labels: data.map((d) => d.asset),
    datasets: [
      {
        label: 'Profit/Loss',
        data: data.map((d) => d.profitLoss),
        backgroundColor: data.map((d) => d.profitLoss >= 0 ? '#4ade80' : '#f87171'),
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: true, text: 'Asset' } },
      y: { title: { display: true, text: 'Profit/Loss' } },
    },
  };
  return <Bar data={chartData} options={options} />;
}
