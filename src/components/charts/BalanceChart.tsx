import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BalanceChartProps {
  balanceOverTime: Array<{ date: string; balance: number }>;
}

export function BalanceChart({ balanceOverTime }: BalanceChartProps) {
  // Ensure balanceOverTime is always an array to prevent map errors
  const safeBalanceData = Array.isArray(balanceOverTime) ? balanceOverTime : [];
  console.log('BalanceChart received data:', balanceOverTime);
  console.log('BalanceChart safe data:', safeBalanceData);
  
  const data = safeBalanceData.map(item => {
    const date = new Date(item.date);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found:', item.date);
      return null;
    }
    return {
      date: date.toISOString().split('T')[0], // Use ISO date format for proper sorting
      displayDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      }),
      balance: typeof item.balance === 'number' && !isNaN(item.balance) ? item.balance : 0,
      timestamp: date.getTime(), // Add timestamp for proper ordering
    };
  }).filter(item => item !== null).sort((a, b) => a.timestamp - b.timestamp); // Ensure proper chronological order
  
  console.log('BalanceChart processed data:', data);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">Balance on {dataPoint.displayDate}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-blue-600">${payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (balanceOverTime.length === 0 || data.length === 0) {
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
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => {
              const date = new Date(value);
              if (isNaN(date.getTime())) return '';
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            }}
            type="category"
            tickCount={Math.min(data.length, 8)}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#balanceGradient)"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
