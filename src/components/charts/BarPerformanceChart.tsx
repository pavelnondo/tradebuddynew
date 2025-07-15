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
import { useEffect, useState } from 'react';

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
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-muted-foreground">No asset performance data available.</div>;
  }
  const positiveColor = isDark ? '#22c55e' : '#4ade80';
  const negativeColor = isDark ? '#ef4444' : '#f87171';
  const chartData = {
    labels: data.map((d) => d.asset),
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
      x: { title: { display: true, text: 'Asset' } },
      y: { title: { display: true, text: 'Profit/Loss' } },
    },
  };
  return <Bar data={chartData} options={options} />;
}
