import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { cn } from '@/lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WinLossChartProps {
  data: Array<{ label: string; value: number; color: string }>;
}

export function WinLossChart({ data }: WinLossChartProps) {
  // Ensure data is always an array and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value >= 0 &&
    item.label &&
    item.color
  ) : [];
  
  const chartData = {
    labels: safeData.map(item => item.label),
    datasets: [
      {
        data: safeData.map(item => item.value),
        backgroundColor: safeData.map(item => item.color),
        borderColor: safeData.map(item => item.color),
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
        cutout: '70%',
        radius: '90%',
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
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  const winPercentage = total > 0 ? ((safeData.find(item => item.label === 'Wins')?.value || 0) / total * 100).toFixed(1) : '0';

  if (safeData.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Add some trades to see your win/loss distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Legend - Moved to top */}
      <div className="flex justify-center space-x-6 mb-4 px-6">
        {safeData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Chart Container */}
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{winPercentage}%</div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </div>
        </div>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
