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
import { Line, Bar } from 'react-chartjs-2';
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

  // Emotion Performance Chart
  const emotionChartData = {
    labels: data.emotionPerformance.map(d => d.emotion),
    datasets: [
      {
        label: 'Average P&L ($)',
        data: data.emotionPerformance.map(d => d.avgProfitLoss),
        backgroundColor: data.emotionPerformance.map(d => 
          d.avgProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: data.emotionPerformance.map(d => 
          d.avgProfitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Win Rate (%)',
        data: data.emotionPerformance.map(d => d.winRate),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y1',
      },
    ],
  };

  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Emotion vs Performance' },
    },
    scales: {
      x: { title: { display: true, text: 'Emotion' } },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'P&L ($)' },
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

  // Confidence Analysis Chart
  const confidenceChartData = {
    labels: data.confidenceAnalysis.map(d => d.confidenceRange),
    datasets: [
      {
        label: 'Average P&L ($)',
        data: data.confidenceAnalysis.map(d => d.avgProfitLoss),
        backgroundColor: data.confidenceAnalysis.map(d => 
          d.avgProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        ),
        borderColor: data.confidenceAnalysis.map(d => 
          d.avgProfitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const confidenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Confidence vs Performance' },
    },
    scales: {
      x: { title: { display: true, text: 'Confidence Level' } },
      y: { title: { display: true, text: 'Average P&L ($)' } },
    },
  };

  // Emotion Trend Line Chart
  const emotionTrendData = {
    labels: data.emotionTrends.map(d => d.date),
    datasets: [
      {
        label: 'Confidence Level',
        data: data.emotionTrends.map(d => d.confidence),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'P&L ($)',
        data: data.emotionTrends.map(d => d.profitLoss),
        borderColor: data.emotionTrends.map(d => 
          d.profitLoss >= 0 ? 'rgb(16, 185, 129)' : 'rgb(245, 101, 101)'
        ),
        backgroundColor: data.emotionTrends.map(d => 
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

  const stressLevel = getStressLevel(data.stressIndicators.overtradingScore);

  return (
    <div className="space-y-6">
      {/* Stress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consecutive Losses</p>
                <p className="text-2xl font-bold">{data.stressIndicators.consecutiveLosses}</p>
              </div>
              <div className={`p-2 rounded-full ${
                data.stressIndicators.consecutiveLosses >= 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {data.stressIndicators.consecutiveLosses >= 3 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Drawdown</p>
                <p className="text-2xl font-bold">{data.stressIndicators.recentDrawdown.toFixed(1)}%</p>
              </div>
              <div className={`p-2 rounded-full ${
                data.stressIndicators.recentDrawdown >= 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {data.stressIndicators.recentDrawdown >= 10 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emotional Volatility</p>
                <p className="text-2xl font-bold">{data.stressIndicators.emotionalVolatility.toFixed(1)}</p>
              </div>
              <div className={`p-2 rounded-full ${
                data.stressIndicators.emotionalVolatility >= 7 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
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
                <p className="text-2xl font-bold">{data.stressIndicators.overtradingScore.toFixed(1)}/10</p>
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
              <Bar data={emotionChartData} options={emotionChartOptions} />
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
              <Bar data={confidenceChartData} options={confidenceChartOptions} />
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
            {data.emotionPerformance
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
