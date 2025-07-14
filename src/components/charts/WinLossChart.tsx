import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { getChartConfig } from '../../lib/chartConfig';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WinLossData {
  wins: number;
  losses: number;
  totalTrades: number;
  winRate: number;
}

interface WinLossChartProps {
  data: WinLossData;
}

export function WinLossChart({ data }: WinLossChartProps) {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const config = getChartConfig(isDark);
  const { colors } = config;

  const chartData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [data.wins, data.losses],
        backgroundColor: [colors.success, colors.danger],
        borderColor: [colors.success, colors.danger],
        borderWidth: 2,
        hoverBackgroundColor: [colors.success, colors.danger],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 3,
        cutout: '65%',
      },
    ],
  };

  const options = {
    ...config.chartJsDefaults,
    plugins: {
      ...config.chartJsDefaults.plugins,
      legend: {
        ...config.chartJsDefaults.plugins.legend,
        display: false, // Hide legend for cleaner look
      },
      tooltip: {
        ...config.chartJsDefaults.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / data.totalTrades) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      ...config.chartJsDefaults.elements,
      arc: {
        borderWidth: 2,
        borderRadius: 4,
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Win/Loss Ratio
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trading performance breakdown
        </p>
      </div>
      
      {/* Center stats */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Win Rate
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {data.totalTrades} total trades
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Wins: {data.wins}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Losses: {data.losses}</span>
          </div>
        </div>
      </div>

      <Doughnut data={chartData} options={options} />
    </div>
  );
}
