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
import { useEffect, useState } from 'react';
import { getChartConfig } from '../../lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface HourlyPerformance {
  hour: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface HourlyPerformanceChartProps {
  data: HourlyPerformance[];
}

export function HourlyPerformanceChart({ data }: HourlyPerformanceChartProps) {
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

  // Create gradient colors based on performance
  const getBarColor = (profitLoss: number) => {
    if (profitLoss > 0) return colors.success;
    if (profitLoss === 0) return colors.neutral;
    return colors.danger;
  };

  const chartData = {
    labels: data.map((d) => d.hour),
    datasets: [
      {
        label: 'P&L ($)',
        data: data.map((d) => d.profitLoss),
        backgroundColor: data.map((d) => getBarColor(d.profitLoss)),
        borderColor: data.map((d) => getBarColor(d.profitLoss)),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: data.map((d) => getBarColor(d.profitLoss)),
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
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
          title: function(context: any) {
            return `${context[0].label}:00`;
          },
          label: function(context: any) {
            const hourData = data[context.dataIndex];
            return [
              `P&L: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(context.parsed.y)}`,
              `Win Rate: ${hourData.winRate.toFixed(1)}%`,
              `Trades: ${hourData.trades}`,
              `Wins: ${hourData.wins}`,
              `Losses: ${hourData.losses}`,
            ];
          },
        },
      },
    },
    scales: {
      ...config.chartJsDefaults.scales,
      x: {
        ...config.chartJsDefaults.scales.x,
        title: {
          display: true,
          text: 'Hour of Day',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500',
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { top: 10 },
        },
      },
      y: {
        ...config.chartJsDefaults.scales.y,
        title: {
          display: true,
          text: 'Profit/Loss ($)',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500',
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { bottom: 10 },
        },
      },
    },
    elements: {
      ...config.chartJsDefaults.elements,
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Hourly Performance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          P&L by trading hour
        </p>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Profit</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Loss</span>
          </div>
        </div>
      </div>
      <Bar data={chartData} options={options} />
    </div>
  );
}
