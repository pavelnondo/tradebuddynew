import React from 'react';
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
  BarChart3
} from "lucide-react";
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

export function PsychologyDashboard({ data, isLoading = false }: PsychologyDashboardProps) {
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
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Psychology Data Available</h3>
              <p className="text-muted-foreground">No valid psychology data to display</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Emotion Performance Chart - Scatter Plot
  const emotionChartData = {
    datasets: [
      {
        label: 'Emotion Performance',
        data: safeEmotionPerformance.map(d => ({
          x: d.winRate,
          y: d.avgProfitLoss,
          emotion: d.emotion,
          tradeCount: d.tradeCount,
          confidence: d.avgConfidence
        })),
        backgroundColor: safeEmotionPerformance.map(d => 
          d.avgProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: safeEmotionPerformance.map(d => 
          d.avgProfitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 12,
      },
    ],
  };

  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Emotion Performance Correlation' },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const dataPoint = context[0].raw;
            return dataPoint.emotion;
          },
          label: (context: any) => {
            const dataPoint = context.raw;
            return [
              `Win Rate: ${dataPoint.x.toFixed(1)}%`,
              `Avg P&L: $${dataPoint.y.toFixed(2)}`,
              `Trades: ${dataPoint.tradeCount}`,
              `Confidence: ${dataPoint.confidence.toFixed(1)}/10`
            ];
          }
        }
      }
    },
    scales: {
      x: { 
        title: { display: true, text: 'Win Rate (%)' },
        min: 0,
        max: 100
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Average P&L ($)' },
      },
    },
  };

  // Confidence Analysis Chart - Line Chart
  const confidenceChartData = {
    labels: safeConfidenceAnalysis.map(d => d.confidenceRange),
    datasets: [
      {
        label: 'Average P&L ($)',
        data: safeConfidenceAnalysis.map(d => d.avgProfitLoss),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: safeConfidenceAnalysis.map(d => 
          d.avgProfitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        pointBorderColor: safeConfidenceAnalysis.map(d => 
          d.avgProfitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Win Rate (%)',
        data: safeConfidenceAnalysis.map(d => d.winRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
      },
    ],
  };

  const confidenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Confidence vs Performance Trends' },
    },
    scales: {
      x: { title: { display: true, text: 'Confidence Level' } },
      y: { 
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Average P&L ($)' } 
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Win Rate (%)' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
      },
    },
  };

  // Emotion Trend Line Chart
  const emotionTrendData = {
    labels: safeEmotionTrends.map(d => d.date),
    datasets: [
      {
        label: 'Confidence Level',
        data: safeEmotionTrends.map(d => d.confidence),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'P&L ($)',
        data: safeEmotionTrends.map(d => d.profitLoss),
        borderColor: safeEmotionTrends.map(d => 
          d.profitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        backgroundColor: safeEmotionTrends.map(d => 
          d.profitLoss >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 101, 101, 0.1)'
        ),
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const emotionTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Emotion & Performance Trends' },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Confidence (1-10)' },
        min: 0,
        max: 10,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'P&L ($)' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const getStressLevel = (score: number) => {
    if (score >= 8) return { level: 'High', color: 'destructive', icon: AlertTriangle };
    if (score >= 5) return { level: 'Medium', color: 'warning', icon: AlertTriangle };
    return { level: 'Low', color: 'success', icon: CheckCircle };
  };

  const stressLevel = getStressLevel(safeStressIndicators.overtradingScore);

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
        {/* Emotion Performance */}
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
            <div className="h-80">
              <Scatter data={emotionChartData} options={emotionChartOptions} />
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
            <div className="h-80">
              <Line data={confidenceChartData} options={confidenceChartOptions} />
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
          <div className="h-80">
            <Line data={emotionTrendData} options={emotionTrendOptions} />
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
              .map((emotion, index) => (
                <div key={emotion.emotion} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {emotion.emotion}
                    </Badge>
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
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
