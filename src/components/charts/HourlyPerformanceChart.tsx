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
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.profitLoss === 'number' && 
    !isNaN(item.profitLoss) &&
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    item.hourFormatted
  ) : [];
  
  const chartData = {
    labels: safeData.map(d => d.hourFormatted),
    datasets: [
      {
        label: 'P&L ($)',
        data: safeData.map(d => d.profitLoss),
        backgroundColor: safeData.map(d => 
          d.profitLoss >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: safeData.map(d => 
          d.profitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Win Rate (%)',
        data: safeData.map(d => d.winRate),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y1',
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
  if (isEmpty || safeData.length === 0) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No time-based analysis data available yet.</div>;
  }

  return (
    <div className="w-full h-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
