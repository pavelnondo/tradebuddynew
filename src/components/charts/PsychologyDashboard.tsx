import React from 'react';

interface PsychologyDashboardProps {
  data: {
    emotionTrends: Array<any>;
    emotionPerformance: Array<any>;
    confidenceAnalysis: Array<any>;
    stressIndicators: {
      consecutiveLosses: number;
      recentDrawdown: number;
      emotionalVolatility: number;
      overtradingScore: number;
    };
  };
  isLoading?: boolean;
}

export function PsychologyDashboard({ data, isLoading }: PsychologyDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  const safeEmotionData = Array.isArray(data?.emotionPerformance) ? data.emotionPerformance.filter(item => 
    item && 
    typeof item.avgProfitLoss === 'number' && 
    typeof item.winRate === 'number' && 
    typeof item.tradeCount === 'number' &&
    !isNaN(item.avgProfitLoss) && 
    !isNaN(item.winRate) && 
    !isNaN(item.tradeCount)
  ) : [];
  
  if (!data || safeEmotionData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">Add trades with emotions to see psychology analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emotion Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Emotion Performance</h3>
          {safeEmotionData.slice(0, 4).map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{item.emotion}</span>
                <span className={`font-medium ${item.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${item.avgProfitLoss.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{item.tradeCount} trades</span>
                <span>{item.winRate.toFixed(0)}% win rate</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Stress Indicators</h3>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Consecutive Losses</span>
                <span className="text-lg font-bold text-red-600">{data.stressIndicators.consecutiveLosses}</span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Recent Drawdown</span>
                <span className="text-lg font-bold text-orange-600">{data.stressIndicators.recentDrawdown.toFixed(1)}%</span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overtrading Score</span>
                <span className="text-lg font-bold text-yellow-600">{data.stressIndicators.overtradingScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
