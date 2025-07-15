import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import React, { useEffect, useState, useRef } from 'react';
import { getChartConfig, createGradient } from '../../lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function BalanceChart({ balanceOverTime }: { balanceOverTime: { date: string; balance: number }[] }) {
  console.log('Rendering BalanceChart');
  const [isDark, setIsDark] = useState(false);
  const chartRef = useRef<ChartJS>(null);
  if (!Array.isArray(balanceOverTime) || balanceOverTime.length === 0) {
    return <div className="text-center text-muted-foreground">No balance data available.</div>;
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
  const { colors, gradients } = config;

  const data = {
    labels: balanceOverTime.map((d) => d.date),
    datasets: [
      {
        label: 'Account Balance',
        data: balanceOverTime.map((d) => d.balance),
        borderColor: colors.primary,
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
        pointHoverRadius: 8,
        pointHoverBackgroundColor: colors.primary,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.primary,
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
            return `Date: ${context[0].label}`;
          },
          label: function(context: any) {
            return `Balance: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(context.parsed.y)}`;
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
        title: {
          display: true,
          text: 'Balance ($)',
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
      point: {
        ...config.chartJsDefaults.elements.point,
        radius: 0,
        hoverRadius: 8,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
        hoverBackgroundColor: colors.primary,
      },
      line: {
        ...config.chartJsDefaults.elements.line,
        tension: 0.4,
        borderWidth: 3,
        fill: true,
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account Balance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Performance over time
        </p>
      </div>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
