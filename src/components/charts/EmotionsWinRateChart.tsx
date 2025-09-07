import React from 'react';
import { Brain, Smile, Frown, Meh } from 'lucide-react';

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

const emotionIcons = {
  'confident': Smile,
  'calm': Smile,
  'excited': Smile,
  'fearful': Frown,
  'anxious': Frown,
  'frustrated': Frown,
  'neutral': Meh,
  'greedy': Brain,
  'fomo': Brain,
};

const emotionColors = {
  'confident': 'var(--color-profit)',
  'calm': 'var(--color-profit)',
  'excited': 'var(--color-warning)',
  'fearful': 'var(--color-loss)',
  'anxious': 'var(--color-loss)',
  'frustrated': 'var(--color-loss)',
  'neutral': 'var(--color-primary)',
  'greedy': 'var(--color-warning)',
  'fomo': 'var(--color-warning)',
};

export function EmotionsWinRateChart({ data }: EmotionsWinRateChartProps) {
  // Ensure data is valid and filter out invalid entries
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item.winRate === 'number' && 
    !isNaN(item.winRate) &&
    typeof item.trades === 'number' && 
    !isNaN(item.trades) &&
    item.emotion
  ) : [];
  
  if (safeData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <Brain className="icon" />
          <div>No emotion data available yet.</div>
        </div>
      </div>
    );
  }

  // Sort by win rate for better visualization
  const sortedData = [...safeData].sort((a, b) => b.winRate - a.winRate);
  const maxWinRate = Math.max(...sortedData.map(item => item.winRate));
  const totalTrades = sortedData.reduce((sum, item) => sum + item.trades, 0);

  return (
    <div className="chart-container">
      <div className="chart-title">Emotion Performance</div>
      <div className="chart-subtitle">
        Total trades analyzed: <span className="font-medium text-foreground">{totalTrades}</span>
      </div>
      
      <table className="charts-css bar" role="chart">
        <tbody>
          {sortedData.map((item, index) => {
            const percentage = maxWinRate > 0 ? (item.winRate / maxWinRate) * 100 : 0;
            const emotionKey = item.emotion.toLowerCase();
            const IconComponent = emotionIcons[emotionKey as keyof typeof emotionIcons] || Brain;
            const color = emotionColors[emotionKey as keyof typeof emotionColors] || 'var(--color-primary)';
            
            return (
              <tr key={index}>
                <td 
                  className="primary"
                  style={{ 
                    '--size': `${percentage}%`,
                    '--color-chart-1': color
                  } as React.CSSProperties}
                >
                  <span className="data">{item.winRate.toFixed(1)}%</span>
                  <span className="label">
                    <IconComponent className="w-3 h-3 inline mr-1" />
                    {item.emotion}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="grid grid-cols-1 gap-2 mt-4">
        {sortedData.slice(0, 3).map((item, index) => {
          const emotionKey = item.emotion.toLowerCase();
          const IconComponent = emotionIcons[emotionKey as keyof typeof emotionIcons] || Brain;
          const color = emotionColors[emotionKey as keyof typeof emotionColors] || 'var(--color-primary)';
          
          return (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <div className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-medium">{item.emotion}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color }}>
                  {item.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.trades} trades
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}