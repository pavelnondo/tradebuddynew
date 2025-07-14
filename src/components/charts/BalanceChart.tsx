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
} from 'chart.js';
import React, { useEffect, useState } from 'react';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function BalanceChart({ balanceOverTime }: { balanceOverTime: { date: string; balance: number }[] }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const borderColor = isDark ? '#22c55e' : '#4ade80';
  const backgroundColor = isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(74, 222, 128, 0.2)';
  const data = {
    labels: balanceOverTime.map((d) => d.date),
    datasets: [
      {
        label: 'Balance',
        data: balanceOverTime.map((d) => d.balance),
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    interaction: { mode: 'nearest' as const, intersect: false },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Balance' } },
    },
  };
  return <Line data={data} options={options} />;
}
