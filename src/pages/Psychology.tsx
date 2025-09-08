import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { Brain, Heart, TrendingUp, Target, BarChart3, PieChart, Clock, Zap } from 'lucide-react';

export default function Psychology() {
  const { trades, isLoading, error } = useApiTrades();
  const analysisData = useTradeAnalysis(trades, 10000);

  const safeTrades = Array.isArray(trades) ? trades : [];
  
  // Psychology-related metrics
  const totalTrades = safeTrades.length;
  const tradesWithEmotions = safeTrades.filter(trade => trade.emotion).length;
  const emotionPercentage = totalTrades > 0 ? (tradesWithEmotions / totalTrades) * 100 : 0;
  
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
  const tradesWithConfidence = safeTrades.filter(trade => trade.confidence !== undefined);
  const avgConfidence = tradesWithConfidence.length > 0 
    ? tradesWithConfidence.reduce((sum, trade) => sum + (trade.confidence || 0), 0) / tradesWithConfidence.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Psychology</h1>
              <p className="text-muted-foreground mt-2">Understand your trading mindset and emotional patterns</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {tradesWithEmotions} Emotional Trades
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Psychology Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Emotional Awareness */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emotional Awareness
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

          {/* Average Confidence */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Confidence
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {avgConfidence.toFixed(1)}/10
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradesWithConfidence.length} trades rated
              </p>
            </CardContent>
          </Card>

          {/* Best Emotion */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best Emotion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground capitalize">
                {bestEmotion?.emotion || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bestEmotion ? `+$${bestEmotion.avgPnl.toFixed(0)} avg` : 'No data'}
              </p>
            </CardContent>
          </Card>

          {/* Worst Emotion */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Worst Emotion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground capitalize">
                {worstEmotion?.emotion || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {worstEmotion ? `$${worstEmotion.avgPnl.toFixed(0)} avg` : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Psychology Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emotion Performance */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Emotion Performance</span>
              </CardTitle>
              <CardDescription>
                How different emotions correlate with your trading performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
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
              ) : emotionEntries.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No emotional data</p>
                    <p className="text-sm">Add trades with emotions to see patterns</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center space-y-4">
                  {emotionEntries.slice(0, 5).map((emotion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${emotion.avgPnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium text-foreground capitalize">{emotion.emotion}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${emotion.avgPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {emotion.avgPnl >= 0 ? '+' : ''}${emotion.avgPnl.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {emotion.winRate.toFixed(0)}% win rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidence vs Performance */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Confidence vs Performance</span>
              </CardTitle>
              <CardDescription>
                Relationship between confidence levels and actual outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
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
              ) : tradesWithConfidence.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No confidence data</p>
                    <p className="text-sm">Add trades with confidence ratings to see patterns</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {avgConfidence.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Average Confidence
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {tradesWithConfidence.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Trades Rated
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Psychology Insights */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Psychology Insights</span>
            </CardTitle>
            <CardDescription>
              Key insights about your trading psychology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-foreground">Emotional Awareness</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You track emotions in {emotionPercentage.toFixed(0)}% of your trades. 
                  {emotionPercentage > 50 ? ' Great job maintaining emotional awareness!' : ' Consider tracking emotions more consistently.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-foreground">Confidence Level</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your average confidence is {avgConfidence.toFixed(1)}/10. 
                  {avgConfidence > 7 ? ' You trade with high confidence!' : avgConfidence > 5 ? ' Moderate confidence level.' : ' Consider building more confidence in your trades.'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-foreground">Best Emotion</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {bestEmotion ? `You perform best when feeling ${bestEmotion.emotion}, with an average P&L of +$${bestEmotion.avgPnl.toFixed(0)}.` : 'Track more emotions to identify your best trading mindset.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
