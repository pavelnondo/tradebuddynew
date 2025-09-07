import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Smile,
  Frown,
  Meh
} from "lucide-react";

interface PsychologyData {
  emotionTrends: {
    date: string;
    emotion: string;
    confidence: number;
    profitLoss: number;
  }[];
  emotionPerformance: {
    emotion: string;
    avgProfitLoss: number;
    winRate: number;
    tradeCount: number;
    avgConfidence: number;
  }[];
  confidenceAnalysis: {
    confidenceRange: string;
    avgProfitLoss: number;
    winRate: number;
    tradeCount: number;
  }[];
  stressIndicators: {
    consecutiveLosses: number;
    recentDrawdown: number;
    emotionalVolatility: number;
    overtradingScore: number;
  };
}

interface PsychologyDashboardProps {
  data: PsychologyData;
  isLoading?: boolean;
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

export function PsychologyDashboard({ data, isLoading = false }: PsychologyDashboardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-modern">
            <CardContent className="p-6">
              <div className="h-64 bg-muted/50 rounded-lg shimmer"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Validate and filter data to prevent NaN errors
  const safeEmotionPerformance = Array.isArray(data?.emotionPerformance) ? 
    data.emotionPerformance.filter(item => 
      item && 
      typeof item.avgProfitLoss === 'number' && !isNaN(item.avgProfitLoss) &&
      typeof item.winRate === 'number' && !isNaN(item.winRate) &&
      typeof item.tradeCount === 'number' && !isNaN(item.tradeCount) &&
      typeof item.avgConfidence === 'number' && !isNaN(item.avgConfidence) &&
      item.emotion
    ) : [];

  const safeConfidenceAnalysis = Array.isArray(data?.confidenceAnalysis) ? 
    data.confidenceAnalysis.filter(item => 
      item && 
      typeof item.avgProfitLoss === 'number' && !isNaN(item.avgProfitLoss) &&
      typeof item.winRate === 'number' && !isNaN(item.winRate) &&
      typeof item.tradeCount === 'number' && !isNaN(item.tradeCount) &&
      item.confidenceRange
    ) : [];

  const safeEmotionTrends = Array.isArray(data?.emotionTrends) ? 
    data.emotionTrends.filter(item => 
      item && 
      typeof item.confidence === 'number' && !isNaN(item.confidence) &&
      typeof item.profitLoss === 'number' && !isNaN(item.profitLoss) &&
      item.date && item.emotion
    ) : [];

  const safeStressIndicators = data?.stressIndicators ? {
    consecutiveLosses: typeof data.stressIndicators.consecutiveLosses === 'number' && !isNaN(data.stressIndicators.consecutiveLosses) ? data.stressIndicators.consecutiveLosses : 0,
    recentDrawdown: typeof data.stressIndicators.recentDrawdown === 'number' && !isNaN(data.stressIndicators.recentDrawdown) ? data.stressIndicators.recentDrawdown : 0,
    emotionalVolatility: typeof data.stressIndicators.emotionalVolatility === 'number' && !isNaN(data.stressIndicators.emotionalVolatility) ? data.stressIndicators.emotionalVolatility : 0,
    overtradingScore: typeof data.stressIndicators.overtradingScore === 'number' && !isNaN(data.stressIndicators.overtradingScore) ? data.stressIndicators.overtradingScore : 0,
  } : { consecutiveLosses: 0, recentDrawdown: 0, emotionalVolatility: 0, overtradingScore: 0 };

  // Check if we have any valid data
  if (safeEmotionPerformance.length === 0 && safeConfidenceAnalysis.length === 0 && safeEmotionTrends.length === 0) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="chart-empty">
            <Brain className="icon" />
            <div>No psychology data available yet.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStressLevel = (score: number) => {
    if (score >= 8) return { level: 'High', color: 'destructive', icon: AlertTriangle };
    if (score >= 5) return { level: 'Medium', color: 'warning', icon: AlertTriangle };
    return { level: 'Low', color: 'success', icon: CheckCircle };
  };

  const stressLevel = getStressLevel(safeStressIndicators.overtradingScore);

  // Calculate scatter plot positions
  const scatterData = safeEmotionPerformance.map((item, index) => {
    const maxWinRate = Math.max(...safeEmotionPerformance.map(d => d.winRate));
    const minWinRate = Math.min(...safeEmotionPerformance.map(d => d.winRate));
    const maxProfit = Math.max(...safeEmotionPerformance.map(d => Math.abs(d.avgProfitLoss)));
    const minProfit = Math.min(...safeEmotionPerformance.map(d => Math.abs(d.avgProfitLoss)));
    
    const x = ((item.winRate - minWinRate) / (maxWinRate - minWinRate)) * 100;
    const y = 100 - ((Math.abs(item.avgProfitLoss) - minProfit) / (maxProfit - minProfit)) * 100;
    
    return {
      ...item,
      x,
      y,
      isProfit: item.avgProfitLoss >= 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Stress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consecutive Losses</p>
                <p className="text-2xl font-bold">{safeStressIndicators.consecutiveLosses}</p>
              </div>
              <div className={`p-2 rounded-full ${
                safeStressIndicators.consecutiveLosses >= 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {safeStressIndicators.consecutiveLosses >= 3 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Drawdown</p>
                <p className="text-2xl font-bold">{safeStressIndicators.recentDrawdown.toFixed(1)}%</p>
              </div>
              <div className={`p-2 rounded-full ${
                safeStressIndicators.recentDrawdown >= 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {safeStressIndicators.recentDrawdown >= 10 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emotional Volatility</p>
                <p className="text-2xl font-bold">{safeStressIndicators.emotionalVolatility.toFixed(1)}</p>
              </div>
              <div className={`p-2 rounded-full ${
                safeStressIndicators.emotionalVolatility >= 7 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                <Brain className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overtrading Risk</p>
                <p className="text-2xl font-bold">{safeStressIndicators.overtradingScore.toFixed(1)}/10</p>
              </div>
              <div className={`p-2 rounded-full ${
                stressLevel.color === 'destructive' ? 'bg-red-100 text-red-600' : 
                stressLevel.color === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
              }`}>
                <stressLevel.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Performance Scatter Plot */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Emotion Performance Analysis
            </CardTitle>
            <CardDescription>
              How different emotions correlate with your trading performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <div className="chart-title">Emotion vs Performance Correlation</div>
              <div className="relative" style={{ height: '300px' }}>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground pr-2">
                  <span>High P&L</span>
                  <span>Low P&L</span>
                </div>
                
                {/* Scatter plot area */}
                <div className="ml-8 mr-4 h-full relative">
                  <div className="scatter-plot w-full h-full">
                    {scatterData.map((point, index) => {
                      const IconComponent = emotionIcons[point.emotion.toLowerCase() as keyof typeof emotionIcons] || Brain;
                      return (
                        <div
                          key={index}
                          className="point"
                          style={{
                            '--x': `${point.x}%`,
                            '--y': `${point.y}%`,
                          } as React.CSSProperties}
                          data-tooltip={`${point.emotion}: ${point.winRate.toFixed(1)}% win rate, $${point.avgProfitLoss.toFixed(2)} avg P&L`}
                          onMouseEnter={() => setHoveredPoint(index)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <IconComponent className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredPoint !== null && (
                    <div 
                      className="absolute bg-background border border-border rounded-lg p-3 shadow-lg z-10 pointer-events-none"
                      style={{
                        left: `${scatterData[hoveredPoint].x}%`,
                        top: `${scatterData[hoveredPoint].y}%`,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-10px'
                      }}
                    >
                      <div className="text-sm font-medium">
                        {scatterData[hoveredPoint].emotion}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Win Rate: {scatterData[hoveredPoint].winRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg P&L: ${scatterData[hoveredPoint].avgProfitLoss.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Trades: {scatterData[hoveredPoint].tradeCount}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-muted-foreground">
                  <span>Low Win Rate</span>
                  <span>High Win Rate</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Analysis */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Confidence vs Performance
            </CardTitle>
            <CardDescription>
              Relationship between confidence levels and actual outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <div className="chart-title">Confidence Performance Trends</div>
              <table className="charts-css bar" role="chart">
                <tbody>
                  {safeConfidenceAnalysis.map((item, index) => {
                    const maxProfit = Math.max(...safeConfidenceAnalysis.map(d => Math.abs(d.avgProfitLoss)));
                    const percentage = maxProfit > 0 ? (Math.abs(item.avgProfitLoss) / maxProfit) * 100 : 0;
                    const isProfit = item.avgProfitLoss >= 0;
                    const colorClass = isProfit ? 'profit' : 'loss';
                    
                    return (
                      <tr key={index}>
                        <td 
                          className={colorClass}
                          style={{ 
                            '--size': `${percentage}%`,
                            '--color-chart-1': isProfit ? 'var(--color-profit)' : 'var(--color-loss)'
                          } as React.CSSProperties}
                        >
                          <span className="data">
                            {isProfit ? '+' : ''}${item.avgProfitLoss.toFixed(2)}
                          </span>
                          <span className="label">{item.confidenceRange}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {safeConfidenceAnalysis.slice(0, 2).map((item, index) => (
                  <div key={index} className="p-2 bg-muted/30 rounded text-center">
                    <div className="font-medium">{item.confidenceRange}</div>
                    <div className={`text-sm ${item.avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${item.avgProfitLoss.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.winRate.toFixed(1)}% win rate
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotion Trends */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Emotion & Performance Trends
          </CardTitle>
          <CardDescription>
            Track how your emotions and confidence evolve over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <div className="chart-title">Emotion Trends Over Time</div>
            <div className="space-y-3">
              {safeEmotionTrends.slice(0, 10).map((item, index) => {
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                const IconComponent = emotionIcons[item.emotion.toLowerCase() as keyof typeof emotionIcons] || Brain;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.emotion}</div>
                        <div className="text-xs text-muted-foreground">{formattedDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        Confidence: <span className="font-medium">{item.confidence.toFixed(1)}/10</span>
                      </div>
                      <div className={`text-sm font-medium ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profitLoss >= 0 ? '+' : ''}${item.profitLoss.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Emotions */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Emotion Performance Summary</CardTitle>
          <CardDescription>Your best and worst emotional states for trading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeEmotionPerformance
              .sort((a, b) => b.avgProfitLoss - a.avgProfitLoss)
              .map((emotion, index) => {
                const IconComponent = emotionIcons[emotion.emotion.toLowerCase() as keyof typeof emotionIcons] || Brain;
                return (
                  <div key={emotion.emotion} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {emotion.emotion}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {emotion.tradeCount} trades
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg P&L:</span>
                        <span className={emotion.avgProfitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                          ${emotion.avgProfitLoss.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Win Rate:</span>
                        <span>{emotion.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Confidence:</span>
                        <span>{emotion.avgConfidence.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}