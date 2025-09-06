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
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    typeof item.trades === 'number' && 
    !isNaN(item.trades) &&
    item.emotion
  ) : [];
  
  const chartData = {
    labels: safeData.map((d) => d.emotion),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: safeData.map((d) => d.winRate),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 101, 101)',
          'rgb(251, 191, 36)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
        borderRadius: 6,
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
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Emotion Data Available</h3>
          <p className="text-muted-foreground">No valid emotion performance data to display</p>
        </div>
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
} 