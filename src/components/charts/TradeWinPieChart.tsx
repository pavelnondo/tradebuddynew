import React, { useRef, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TradeWinPieChartProps {
  winRate: number; // 0-100
  winCount: number;
  lossCount: number;
  totalTrades: number;
}

export function TradeWinPieChart({ winRate, winCount, lossCount, totalTrades }: TradeWinPieChartProps) {
  const chartRef = useRef<any>(null);

  const data = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [winCount, lossCount],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderColor: ['#22c55e', '#ef4444'],
        borderWidth: 2,
        hoverBackgroundColor: ['#16a34a', '#dc2626'],
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
            const percentage = ((value / totalTrades) * 100).toFixed(1);
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
    <div className="relative flex items-center justify-center w-full h-64">
      <Doughnut ref={chartRef} data={data} options={options} />
      {/* Center stats overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {winRate.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Win Rate
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {totalTrades} trades
        </div>
      </div>
      {/* Legend */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Wins: {winCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Losses: {lossCount}</span>
        </div>
      </div>
    </div>
  );
} 