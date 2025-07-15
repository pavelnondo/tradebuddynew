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
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: true, text: 'Hour' } },
      y: { title: { display: true, text: 'Win Rate (%)' }, min: 0, max: 100 },
    },
  };
  return <Bar data={chartData} options={options} />;
} 