import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface EmotionPerformance {
  emotion: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface EmotionsWinRateChartProps {
  data: EmotionPerformance[];
}

export function EmotionsWinRateChart({ data }: EmotionsWinRateChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = {
    labels: safeData.map((d) => d.emotion),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: safeData.map((d) => d.winRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
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
      x: { title: { display: true, text: 'Emotion' }, grid: { display: false } },
      y: { title: { display: true, text: 'Win Rate (%)' }, min: 0, max: 100, grid: { color: 'rgba(156,163,175,0.1)' } },
    },
  };
  return <Line data={chartData} options={options} />;
} 