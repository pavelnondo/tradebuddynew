
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { getChartConfig, createGradient } from '../../lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface TradeCountData {
  date: string;
  count: number;
  cumulative: number;
}

interface TradeCountChartProps {
  data: TradeCountData[];
}

export function TradeCountChart({ data }: TradeCountChartProps) {
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
  const { colors, gradients } = config;

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Daily Trades',
        data: data.map((d) => d.count),
        borderColor: colors.accent,
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return gradients.primary.light;
          }
          return createGradient(ctx, [
            gradients.primary.light,
            gradients.primary.medium,
            gradients.primary.dark,
          ]);
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: colors.accent,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: colors.accent,
        pointBorderColor: colors.accent,
        yAxisID: 'y',
      },
      {
        label: 'Cumulative Trades',
        data: data.map((d) => d.cumulative),
        borderColor: colors.primary,
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: colors.primary,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.primary,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    ...config.chartJsDefaults,
    plugins: {
      ...config.chartJsDefaults.plugins,
      legend: {
        ...config.chartJsDefaults.plugins.legend,
        display: true,
        position: 'top' as const,
        labels: {
          ...config.chartJsDefaults.plugins.legend.labels,
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        ...config.chartJsDefaults.plugins.tooltip,
        callbacks: {
          title: function(context: any) {
            return `Date: ${context[0].label}`;
          },
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `Daily Trades: ${context.parsed.y}`;
            } else {
              return `Cumulative Trades: ${context.parsed.y}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        ...config.chartJsDefaults.scales.x,
        title: {
          display: true,
          text: 'Date',
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Daily Trades',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500',
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { bottom: 10 },
        },
        grid: {
          ...config.chartJsDefaults.scales.y.grid,
          drawOnChartArea: true,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cumulative Trades',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500',
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { bottom: 10 },
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: '400',
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: 8,
        },
      },
    },
    elements: {
      ...config.chartJsDefaults.elements,
      point: {
        ...config.chartJsDefaults.elements.point,
        radius: 0,
        hoverRadius: 6,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff',
      },
      line: {
        ...config.chartJsDefaults.elements.line,
        tension: 0.4,
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Trading Activity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Daily and cumulative trade counts
        </p>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
}
