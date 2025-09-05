import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scatter } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ScatterData {
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  duration: number;
  confidence: number;
  emotion: string;
  asset: string;
  date: string;
}

interface ScatterAnalysisProps {
  data: ScatterData[];
  analysisType: 'entry-exit' | 'duration-profit' | 'confidence-profit';
  isLoading?: boolean;
}

export function ScatterAnalysis({ data, analysisType, isLoading = false }: ScatterAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  const getChartData = () => {
    switch (analysisType) {
      case 'entry-exit':
        return {
          datasets: [
            {
              label: 'Profitable Trades',
              data: data
                .filter(d => d.profitLoss >= 0)
                .map(d => ({ x: d.entryPrice, y: d.exitPrice })),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgb(16, 185, 129)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Losing Trades',
              data: data
                .filter(d => d.profitLoss < 0)
                .map(d => ({ x: d.entryPrice, y: d.exitPrice })),
              backgroundColor: 'rgba(245, 101, 101, 0.6)',
              borderColor: 'rgb(245, 101, 101)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        };
      
      case 'duration-profit':
        return {
          datasets: [
            {
              label: 'Profitable Trades',
              data: data
                .filter(d => d.profitLoss >= 0)
                .map(d => ({ x: d.duration, y: d.profitLoss })),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgb(16, 185, 129)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Losing Trades',
              data: data
                .filter(d => d.profitLoss < 0)
                .map(d => ({ x: d.duration, y: d.profitLoss })),
              backgroundColor: 'rgba(245, 101, 101, 0.6)',
              borderColor: 'rgb(245, 101, 101)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        };
      
      case 'confidence-profit':
        return {
          datasets: [
            {
              label: 'Profitable Trades',
              data: data
                .filter(d => d.profitLoss >= 0)
                .map(d => ({ x: d.confidence, y: d.profitLoss })),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgb(16, 185, 129)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Losing Trades',
              data: data
                .filter(d => d.profitLoss < 0)
                .map(d => ({ x: d.confidence, y: d.profitLoss })),
              backgroundColor: 'rgba(245, 101, 101, 0.6)',
              borderColor: 'rgb(245, 101, 101)',
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        };
      
      default:
        return { datasets: [] };
    }
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const point = data[context.dataIndex];
              return [
                `Asset: ${point.asset}`,
                `P&L: $${point.profitLoss.toFixed(2)}`,
                `Duration: ${point.duration}min`,
                `Confidence: ${point.confidence}/10`,
                `Emotion: ${point.emotion}`,
                `Date: ${point.date}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true },
          grid: { color: 'rgba(156,163,175,0.1)' },
        },
        y: {
          title: { display: true },
          grid: { color: 'rgba(156,163,175,0.1)' },
        },
      },
    };

    switch (analysisType) {
      case 'entry-exit':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            title: { display: true, text: 'Entry vs Exit Price Analysis' },
          },
          scales: {
            ...baseOptions.scales,
            x: { ...baseOptions.scales.x, title: { display: true, text: 'Entry Price ($)' } },
            y: { ...baseOptions.scales.y, title: { display: true, text: 'Exit Price ($)' } },
          },
        };
      
      case 'duration-profit':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            title: { display: true, text: 'Trade Duration vs Profit Analysis' },
          },
          scales: {
            ...baseOptions.scales,
            x: { ...baseOptions.scales.x, title: { display: true, text: 'Duration (minutes)' } },
            y: { ...baseOptions.scales.y, title: { display: true, text: 'Profit/Loss ($)' } },
          },
        };
      
      case 'confidence-profit':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            title: { display: true, text: 'Confidence vs Profit Analysis' },
          },
          scales: {
            ...baseOptions.scales,
            x: { 
              ...baseOptions.scales.x, 
              title: { display: true, text: 'Confidence Level (1-10)' },
              min: 0,
              max: 10,
              ticks: { stepSize: 1 },
            },
            y: { ...baseOptions.scales.y, title: { display: true, text: 'Profit/Loss ($)' } },
          },
        };
      
      default:
        return baseOptions;
    }
  };

  // Calculate insights based on analysis type
  const getInsights = () => {
    if (data.length === 0) return [];

    switch (analysisType) {
      case 'entry-exit':
        const profitableTrades = data.filter(d => d.profitLoss >= 0);
        const avgEntryProfitable = profitableTrades.reduce((sum, d) => sum + d.entryPrice, 0) / profitableTrades.length;
        const avgExitProfitable = profitableTrades.reduce((sum, d) => sum + d.exitPrice, 0) / profitableTrades.length;
        
        return [
          `Profitable trades average entry: $${avgEntryProfitable.toFixed(2)}`,
          `Profitable trades average exit: $${avgExitProfitable.toFixed(2)}`,
          `Average price movement: $${(avgExitProfitable - avgEntryProfitable).toFixed(2)}`,
        ];
      
      case 'duration-profit':
        const shortTrades = data.filter(d => d.duration <= 30);
        const longTrades = data.filter(d => d.duration > 30);
        const shortAvgProfit = shortTrades.reduce((sum, d) => sum + d.profitLoss, 0) / shortTrades.length;
        const longAvgProfit = longTrades.reduce((sum, d) => sum + d.profitLoss, 0) / longTrades.length;
        
        return [
          `Short trades (≤30min) avg P&L: $${shortAvgProfit.toFixed(2)}`,
          `Long trades (>30min) avg P&L: $${longAvgProfit.toFixed(2)}`,
          `Best duration range: ${shortAvgProfit > longAvgProfit ? 'Short-term' : 'Long-term'}`,
        ];
      
      case 'confidence-profit':
        const highConfidence = data.filter(d => d.confidence >= 7);
        const lowConfidence = data.filter(d => d.confidence < 7);
        const highConfAvgProfit = highConfidence.reduce((sum, d) => sum + d.profitLoss, 0) / highConfidence.length;
        const lowConfAvgProfit = lowConfidence.reduce((sum, d) => sum + d.profitLoss, 0) / lowConfidence.length;
        
        return [
          `High confidence (≥7) avg P&L: $${highConfAvgProfit.toFixed(2)}`,
          `Low confidence (<7) avg P&L: $${lowConfAvgProfit.toFixed(2)}`,
          `Confidence accuracy: ${highConfAvgProfit > lowConfAvgProfit ? 'Good' : 'Needs improvement'}`,
        ];
      
      default:
        return [];
    }
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>
            {analysisType === 'entry-exit' && 'Entry vs Exit Price Analysis'}
            {analysisType === 'duration-profit' && 'Trade Duration vs Profit Analysis'}
            {analysisType === 'confidence-profit' && 'Confidence vs Profit Analysis'}
          </CardTitle>
          <CardDescription>
            {analysisType === 'entry-exit' && 'Analyze the relationship between entry and exit prices'}
            {analysisType === 'duration-profit' && 'Understand how trade duration affects profitability'}
            {analysisType === 'confidence-profit' && 'Evaluate how confidence levels correlate with actual outcomes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Scatter data={getChartData()} options={getChartOptions()} />
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Trades:</span>
              <span className="ml-2 font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Profitable:</span>
              <span className="ml-2 font-medium text-green-600">
                {data.filter(d => d.profitLoss >= 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Losing:</span>
              <span className="ml-2 font-medium text-red-600">
                {data.filter(d => d.profitLoss < 0).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
