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
  // Ensure data is always an array to prevent map errors
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = {
    labels: safeData.map((d) => d.emotion),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: safeData.map((d) => d.winRate),
        backgroundColor: '#4ade80',
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
      x: { title: { display: true, text: 'Emotion' } },
      y: { title: { display: true, text: 'Win Rate (%)' }, min: 0, max: 100 },
    },
  };
  return <Bar data={chartData} options={options} />;
} 