import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const chartData = {
    labels: data.map(d => d.hourFormatted),
    datasets: [
      {
        label: 'P&L ($)',
        data: data.map(d => d.profitLoss),
        backgroundColor: '#60a5fa',
        yAxisID: 'y',
        borderRadius: 4,
      },
      {
        label: 'Win Rate (%)',
        data: data.map(d => d.winRate),
        backgroundColor: '#4ade80',
        yAxisID: 'y1',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    layout: { padding: 10 },
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: true, text: 'Hour' },
        ticks: { font: { size: 10 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'P&L ($)' },
        ticks: { font: { size: 10 } },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Win Rate (%)' },
        grid: { drawOnChartArea: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  if (isLoading) {
    return <div className="chart-container">Loading...</div>;
  }
  if (isEmpty || data.length === 0) {
    return <div className="chart-container">No time-based analysis data available yet.</div>;
  }

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
}
