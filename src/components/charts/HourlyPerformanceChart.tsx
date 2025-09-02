import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = {
    labels: safeData.map(d => d.hourFormatted),
    datasets: [
      {
        label: 'P&L ($)',
        data: safeData.map(d => d.profitLoss),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        yAxisID: 'y',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Win Rate (%)',
        data: safeData.map(d => d.winRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        yAxisID: 'y1',
        tension: 0.35,
        fill: false,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: true, text: 'Hour' },
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'P&L ($)' },
        ticks: { font: { size: 11 } },
        grid: { color: 'rgba(156,163,175,0.1)' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Win Rate (%)' },
        grid: { drawOnChartArea: false },
        ticks: { font: { size: 11 }, min: 0, max: 100 },
      },
    },
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }
  if (isEmpty || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No time-based analysis data available yet.</div>;
  }

  return (
    <div className="w-full h-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
