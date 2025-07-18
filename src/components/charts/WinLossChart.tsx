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
  console.log('Rendering WinLossChart');
  const [isDark, setIsDark] = useState(false);
  if (!data || typeof data !== 'object' || data.totalTrades === 0) {
    return <div className="text-center text-muted-foreground">No win/loss data available.</div>;
  }
  
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
        labels: {
          ...config.chartJsDefaults.plugins.legend?.labels,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 500, // Use number instead of string
          },
        },
      },
      tooltip: {
        ...config.chartJsDefaults.plugins.tooltip,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 14,
          weight: 600, // Use number instead of string
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: 400, // Use number instead of string
        },
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
    scales: {
      ...config.chartJsDefaults.scales,
      x: {
        ...config.chartJsDefaults.scales.x,
        ticks: {
          ...config.chartJsDefaults.scales.x?.ticks,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 400, // Use number instead of string
          },
        },
      },
      y: {
        ...config.chartJsDefaults.scales.y,
        ticks: {
          ...config.chartJsDefaults.scales.y?.ticks,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 400, // Use number instead of string
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
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Win/Loss Ratio</h3>
        <p className="chart-subtitle">Trading performance breakdown</p>
      </div>
      <div className="chart-body flex flex-col items-center justify-center">
        <div className="mb-4 text-center">
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
        <Doughnut data={chartData} options={options} />
        <div className="chart-legend flex justify-center space-x-6 text-sm mt-4">
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
    </div>
  );
}
