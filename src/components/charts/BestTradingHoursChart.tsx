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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface BestTradingHour {
  hourFormatted: string;
  winRate: number;
  profitLoss: number;
}

interface BestTradingHoursChartProps {
  data: BestTradingHour[];
}

export function BestTradingHoursChart({ data }: BestTradingHoursChartProps) {
  console.log('Rendering BestTradingHoursChart');
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
    return <div className="text-center text-muted-foreground">No trading hour data available.</div>;
  }
  const barColor = isDark ? '#22c55e' : '#4ade80';
  const chartData = {
    labels: data.map((d) => d.hourFormatted),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: data.map((d) => d.winRate),
        backgroundColor: barColor,
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
      x: { title: { display: true, text: 'Hour' } },
      y: { title: { display: true, text: 'Win Rate (%)' }, min: 0, max: 100 },
    },
  };
  return (
    <div className="chart-container bg-card border shadow rounded-lg p-6">
      <div className="chart-header">
        <h3 className="chart-title">Best Trading Hours</h3>
        <p className="chart-subtitle">Win rate by hour of day</p>
      </div>
      <div className="chart-body">
        <Bar data={chartData} options={options} />
      </div>
      <div className="chart-legend flex justify-center space-x-6 text-sm mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: barColor }}></div>
          <span className="text-gray-700 dark:text-gray-300">Win Rate (%)</span>
        </div>
      </div>
    </div>
  );
} 