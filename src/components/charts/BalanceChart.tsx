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
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number }>;
}

export function BalanceChart({ balanceOverTime }: BalanceChartProps) {
  const data = {
    labels: balanceOverTime.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Account Balance',
        data: balanceOverTime.map(item => item.balance),
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          title: (context: any) => {
            return `Balance on ${context[0].label}`;
          },
          label: (context: any) => {
            return `$${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
            weight: '500',
          },
          maxTicksLimit: 6,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
            weight: '500',
          },
          callback: (value: any) => {
            return `$${value.toLocaleString()}`;
          },
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgb(59, 130, 246)',
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 3,
      },
    },
  };

  if (balanceOverTime.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Add some trades to see your balance progression</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}
