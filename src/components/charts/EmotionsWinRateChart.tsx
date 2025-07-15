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
  console.log('Rendering EmotionsWinRateChart');
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-muted-foreground">No emotion win rate data available.</div>;
  }

  const config = getChartConfig(isDark);
  const { colors } = config;

  // Create gradient colors based on win rate performance
  const getBarColor = (winRate: number) => {
    if (winRate >= 70) return colors.success;
    if (winRate >= 50) return colors.secondary;
    if (winRate >= 30) return colors.accent;
    return colors.danger;
  };

  const chartData = {
    labels: data.map((d) => d.emotion),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: data.map((d) => d.winRate),
        backgroundColor: data.map((d) => getBarColor(d.winRate)),
        borderColor: data.map((d) => getBarColor(d.winRate)),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: data.map((d) => getBarColor(d.winRate)),
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
          title: function(context: any) {
            return `Emotion: ${context[0].label}`;
          },
          label: function(context: any) {
            const emotionData = data[context.dataIndex];
            return [
              `Win Rate: ${context.parsed.y.toFixed(1)}%`,
              `Total Trades: ${emotionData.trades}`,
              `Wins: ${emotionData.wins}`,
              `Losses: ${emotionData.losses}`,
              `P&L: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(emotionData.profitLoss)}`,
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
          text: 'Emotion',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 500, // Use number instead of string
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { top: 10 },
        },
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
        title: {
          display: true,
          text: 'Win Rate (%)',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 500, // Use number instead of string
          },
          color: isDark ? '#9ca3af' : '#6b7280',
          padding: { bottom: 10 },
        },
        min: 0,
        max: 100,
        ticks: {
          ...config.chartJsDefaults.scales.y.ticks,
          callback: function(value: any) {
            return `${value}%`;
          },
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
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-header flex items-center justify-between">
        <div>
          <h3 className="chart-title">Emotional Performance</h3>
          <p className="chart-subtitle">Win rate by trading emotion</p>
        </div>
        <div className="chart-legend flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">70%+</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">50-69%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">30-49%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">&lt;30%</span>
          </div>
        </div>
      </div>
      <div className="chart-body">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
} 