import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiTrades } from '@/hooks/useApiTrades';
import { Brain, Heart, TrendingUp, Target, Zap, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export default function Psychology() {
  const { trades, isLoading, error } = useApiTrades();

  const safeTrades = Array.isArray(trades) ? trades : [];
  
  // Psychology-related metrics
  const totalTrades = safeTrades.length;
  const tradesWithEmotions = safeTrades.filter(trade => trade.emotion).length;
  const tradesWithConfidence = safeTrades.filter(trade => trade.confidence !== undefined);
  const tradesWithNotes = safeTrades.filter(trade => trade.notes && trade.notes.trim().length > 0).length;
  
  const emotionPercentage = totalTrades > 0 ? (tradesWithEmotions / totalTrades) * 100 : 0;
  const confidencePercentage = totalTrades > 0 ? (tradesWithConfidence / totalTrades) * 100 : 0;
  const notesPercentage = totalTrades > 0 ? (tradesWithNotes / totalTrades) * 100 : 0;
  
  // Emotion analysis
  const emotionStats = safeTrades.reduce((acc, trade) => {
    if (trade.emotion) {
      const emotion = trade.emotion.toLowerCase();
      if (!acc[emotion]) {
        acc[emotion] = { count: 0, totalPnl: 0, wins: 0 };
      }
      acc[emotion].count++;
      acc[emotion].totalPnl += trade.profitLoss || 0;
      if (trade.profitLoss > 0) acc[emotion].wins++;
    }
    return acc;
  }, {} as Record<string, { count: number; totalPnl: number; wins: number }>);

  const emotionEntries = Object.entries(emotionStats).map(([emotion, stats]) => ({
    emotion,
    count: stats.count,
    avgPnl: stats.totalPnl / stats.count,
    winRate: (stats.wins / stats.count) * 100
  })).sort((a, b) => b.avgPnl - a.avgPnl);

  const bestEmotion = emotionEntries[0];
  const worstEmotion = emotionEntries[emotionEntries.length - 1];

  // Confidence analysis
  const avgConfidence = tradesWithConfidence.length > 0 
    ? tradesWithConfidence.reduce((sum, trade) => sum + (trade.confidence || 0), 0) / tradesWithConfidence.length 
    : 0;

  // Psychology patterns
  const recentTrades = safeTrades
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const psychologyScore = Math.round((emotionPercentage + confidencePercentage + notesPercentage) / 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Psychology</h1>
              <p className="text-muted-foreground mt-2">Analyze your trading mindset, emotions, and psychological patterns</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                Psychology Score: {psychologyScore}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Psychology Tracking Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Emotional Awareness */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emotional Tracking
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {emotionPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradesWithEmotions} of {totalTrades} trades
              </p>
            </CardContent>
          </Card>

          {/* Confidence Tracking */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confidence Tracking
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {confidencePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradesWithConfidence.length} trades rated
              </p>
            </CardContent>
          </Card>

          {/* Notes Tracking */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Journal Entries
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {notesPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradesWithNotes} of {totalTrades} trades
              </p>
            </CardContent>
          </Card>

          {/* Average Confidence */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Confidence
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {avgConfidence.toFixed(1)}/10
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradesWithConfidence.length > 0 ? 'Based on rated trades' : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emotion Analysis */}
        {emotionEntries.length > 0 && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Emotion Performance Analysis</span>
              </CardTitle>
              <CardDescription>
                How different emotions correlate with your trading performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionEntries.map((emotion, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        emotion.avgPnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-foreground capitalize">
                        {emotion.emotion}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        emotion.avgPnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {emotion.avgPnl >= 0 ? '+' : ''}${emotion.avgPnl.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emotion.count} trades, {emotion.winRate.toFixed(0)}% win rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Psychology Patterns */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Psychology Patterns</span>
            </CardTitle>
            <CardDescription>
              Your latest trading mindset and emotional states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrades.slice(0, 5).map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">
                      {new Date(trade.date).toLocaleDateString()}
                    </span>
                    {trade.emotion && (
                      <Badge variant="outline" className="text-xs">
                        {trade.emotion}
                      </Badge>
                    )}
                    {trade.confidence !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {trade.confidence}/10
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Psychology Insights & Recommendations */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Psychology Insights & Recommendations</span>
            </CardTitle>
            <CardDescription>
              Key insights about your trading psychology and improvement suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-foreground">Emotional Tracking</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You track emotions in {emotionPercentage.toFixed(0)}% of your trades. 
                  {emotionPercentage > 70 ? ' Excellent emotional awareness!' : emotionPercentage > 50 ? ' Good tracking, aim for 70%+' : ' Consider tracking emotions more consistently for better insights.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-foreground">Confidence Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tradesWithConfidence.length > 0 ? `Your average confidence is ${avgConfidence.toFixed(1)}/10. ${avgConfidence > 7 ? 'High confidence trader!' : avgConfidence > 5 ? 'Moderate confidence level.' : 'Consider building more confidence through practice and education.'}` : 'Start rating your confidence levels to track psychological patterns.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-foreground">Journaling Practice</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You journal {notesPercentage.toFixed(0)}% of your trades. 
                  {notesPercentage > 60 ? ' Great journaling discipline!' : 'Consider adding more detailed notes to track your thought process and improve decision-making.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-foreground">Best Trading Mindset</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {bestEmotion ? `You perform best when feeling ${bestEmotion.emotion}, with an average P&L of +$${bestEmotion.avgPnl.toFixed(0)}. Focus on cultivating this mindset.` : 'Track more emotions to identify your optimal trading mindset.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-foreground">Areas for Improvement</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {worstEmotion ? `Be cautious when feeling ${worstEmotion.emotion} - it correlates with ${worstEmotion.avgPnl < 0 ? 'losses' : 'lower performance'}. Consider taking breaks or adjusting your strategy.` : 'Track more emotional data to identify patterns that need attention.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-foreground">Psychology Score</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your overall psychology tracking score is {psychologyScore}%. 
                  {psychologyScore > 80 ? 'Excellent psychological awareness!' : psychologyScore > 60 ? 'Good tracking habits, keep improving!' : 'Focus on consistent tracking of emotions, confidence, and notes.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
