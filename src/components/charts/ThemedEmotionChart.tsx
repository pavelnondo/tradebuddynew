import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from 'lucide-react';

interface ThemedEmotionChartProps {
  data: Array<{ emotion: string; avgProfitLoss: number; tradeCount: number; winRate: number }>;
  loading?: boolean;
  error?: string;
}

export function ThemedEmotionChart({ data, loading, error }: ThemedEmotionChartProps) {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data.filter(item => 
      item && 
      typeof item.emotion === 'string' && 
      typeof item.winRate === 'number' && 
      !isNaN(item.winRate) &&
      typeof item.tradeCount === 'number' &&
      !isNaN(item.tradeCount)
    );
  }, [data]);

  const hasData = validData.length > 0;
  const noDataMessage = 'Add trades with emotions to see patterns';

  // Sort emotions by win rate (highest first)
  const sortedEmotions = validData.sort((a, b) => b.winRate - a.winRate);
  
  const bestEmotion = sortedEmotions[0];
  const worstEmotion = sortedEmotions[sortedEmotions.length - 1];

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5" />
          <span>Emotion Impact</span>
        </CardTitle>
        <CardDescription>
          How emotions correlate with trading performance
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            <div className="text-center">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No data available</p>
              <p className="text-sm">{noDataMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Best emotion display */}
            {bestEmotion && (
              <div className="mb-4 flex justify-between items-center px-2">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-foreground capitalize">
                    {bestEmotion.emotion}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Best Emotion</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-xl font-semibold text-green-600">
                    {bestEmotion.winRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Win Rate ({bestEmotion.tradeCount} trades)
                  </div>
                </div>
              </div>
            )}

            {/* Emotion win rates list */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-3">
                {sortedEmotions.map((emotion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        emotion.winRate >= 70 ? 'bg-green-500' : 
                        emotion.winRate >= 50 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-foreground capitalize">
                        {emotion.emotion}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        emotion.winRate >= 70 ? 'text-green-600' : 
                        emotion.winRate >= 50 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {emotion.winRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emotion.tradeCount} trades
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-center space-x-6 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">≥70% Win Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-muted-foreground">50-69% Win Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-muted-foreground">&lt;50% Win Rate</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
