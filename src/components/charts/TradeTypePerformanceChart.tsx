import React, { useEffect, useState } from 'react';
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

interface TradeTypePerformance {
  type: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface TradeTypePerformanceChartProps {
  data: TradeTypePerformance[];
}

export function TradeTypePerformanceChart({ data }: TradeTypePerformanceChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-muted-foreground">No trade type performance data available.</div>;
  }
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const positiveColor = isDark ? '#22c55e' : '#4ade80';
  const negativeColor = isDark ? '#ef4444' : '#f87171';
  const chartData = {
    labels: data.map((d) => d.type),
    datasets: [
      {
        label: 'Profit/Loss',
        data: data.map((d) => d.profitLoss),
        backgroundColor: data.map((d) => d.profitLoss >= 0 ? positiveColor : negativeColor),
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
      x: { title: { display: true, text: 'Trade Type' } },
      y: { title: { display: true, text: 'Profit/Loss' } },
    },
  };
  return <Bar data={chartData} options={options} />;
} 