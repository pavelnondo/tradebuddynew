import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EmotionPerformance {
  emotion: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface EmotionPieChartProps {
  data: EmotionPerformance[];
}

const EMOTION_COLORS: Record<string, string> = {
  Confident: '#4ade80', // Green
  Calm: '#a78bfa', // Purple
  Satisfied: '#22d3ee', // Cyan
  Excited: '#facc15', // Yellow
  Nervous: '#fb923c', // Orange
  Greedy: '#f87171', // Light red
  Fearful: '#3b82f6', // Blue
  Frustrated: '#ea384c', // Bright red
};

export function EmotionPieChart({ data }: EmotionPieChartProps) {
  const chartRef = useRef<any>(null);
  const totalTrades = data.reduce((sum, d) => sum + d.trades, 0);
  const topEmotion = data.length > 0 ? [...data].sort((a, b) => b.trades - a.trades)[0] : null;

  const chartData = {
    labels: data.map((d) => d.emotion),
    datasets: [
      {
        data: data.map((d) => d.trades),
        backgroundColor: data.map((d) => EMOTION_COLORS[d.emotion] || '#a1a1aa'),
        borderColor: data.map((d) => EMOTION_COLORS[d.emotion] || '#a1a1aa'),
        borderWidth: 2,
        hoverBackgroundColor: data.map((d) => EMOTION_COLORS[d.emotion] || '#a1a1aa'),
        hoverBorderColor: '#fff',
        hoverBorderWidth: 3,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = totalTrades ? ((value / totalTrades) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f3f4f6',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
      },
    },
    animation: {
      duration: 900,
      easing: 'easeInOutQuart' as const,
    },
    cutout: '70%',
  };

  return (
    <div className="relative flex flex-col items-center w-full h-64"> {/* Use flex-col for vertical stacking */}
      <div className="w-full h-48 relative flex items-center justify-center"> {/* Chart container, slightly reduced height */}
        <Doughnut ref={chartRef} data={chartData} options={options} />
        {/* Center stats overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {topEmotion ? topEmotion.emotion : 'No Data'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Top Emotion
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {totalTrades} trades
          </div>
        </div>
      </div>
      {/* Legend below chart, not overlapping */}
      <div className="flex flex-wrap justify-center space-x-4 text-xs mt-2">
        {data.map((d) => (
          <div key={d.emotion} className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EMOTION_COLORS[d.emotion] || '#a1a1aa' }}></div>
            <span className="text-gray-700 dark:text-gray-300">{d.emotion}: {d.trades}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 