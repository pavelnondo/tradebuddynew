import React, { useEffect, useState } from 'react';
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

interface TradeTypePerformance {
  type: string;
  trades: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
}

interface TradeTypePerformanceChartProps {
  data: TradeTypePerformance[];
}

export function TradeTypePerformanceChart({ data }: TradeTypePerformanceChartProps) {
  console.log('Rendering TradeTypePerformanceChart');
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
    return <div className="text-center text-muted-foreground">No trade type performance data available.</div>;
  }
  const positiveColor = isDark ? '#22c55e' : '#4ade80';
  const negativeColor = isDark ? '#ef4444' : '#f87171';
  const chartData = {
    labels: data.map((d) => d.type),
    datasets: [
      {
        label: 'Profit/Loss',
        data: data.map((d) => d.profitLoss),
        backgroundColor: data.map((d) => d.profitLoss >= 0 ? positiveColor : negativeColor),
        barThickness: 18,
        maxBarThickness: 22,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: true, text: 'Trade Type' },
        grid: { color: isDark ? '#fff' : '#000' },
      },
      y: {
        title: { display: true, text: 'Profit/Loss' },
        grid: { color: isDark ? '#fff' : '#000' },
      },
    },
  };
  return (
    <div className="chart-container bg-card border shadow rounded-lg p-6">
      <div className="chart-header">
        <h3 className="chart-title">Trade Type Performance</h3>
        <p className="chart-subtitle">Profit/Loss by trade type</p>
      </div>
      <div className="chart-body">
        <Bar data={chartData} options={options} />
      </div>
      <div className="chart-legend flex justify-center space-x-6 text-sm mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: positiveColor }}></div>
          <span className="text-gray-700 dark:text-gray-300">Profit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: negativeColor }}></div>
          <span className="text-gray-700 dark:text-gray-300">Loss</span>
        </div>
      </div>
    </div>
  );
} 