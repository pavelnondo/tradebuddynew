import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { BarChart3, TrendingUp, Clock, Heart, Target, Filter } from 'lucide-react';

export default function Analysis() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const analysisData = useTradeAnalysis(trades, 10000);

  const safeTrades = Array.isArray(trades) ? trades : [];
  
  // Filter trades based on selected criteria
  const filteredTrades = safeTrades.filter(trade => {
    const tradeDate = new Date(trade.date);
    const now = new Date();
    
    if (timeframe !== "all") {
      const daysBack = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      if (tradeDate < cutoffDate) return false;
    }
    
    if (selectedAsset !== "all" && trade.asset !== selectedAsset) {
      return false;
    }
    
    return true;
  });

  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(trade => trade.profitLoss > 0).length;
  const losingTrades = filteredTrades.filter(trade => trade.profitLoss < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalProfitLoss = filteredTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const avgProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;

  // Get unique assets for filter
  const uniqueAssets = Array.from(new Set(safeTrades.map(trade => trade.asset).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Analysis</h1>
              <p className="text-muted-foreground mt-2">Deep dive into your trading performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {totalTrades} Trades Analyzed
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Analysis Filters</span>
            </CardTitle>
            <CardDescription>
              Customize your analysis view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-muted-foreground">Timeframe:</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-muted-foreground">Asset:</label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    {uniqueAssets.map(asset => (
                      <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Trades
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalTrades}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {winningTrades} wins, {losingTrades} losses
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Success rate
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total P&L
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProfitLoss >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg P&L
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${avgProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgProfitLoss >= 0 ? '+' : ''}${avgProfitLoss.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per trade
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Balance Evolution */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Balance Evolution</span>
              </CardTitle>
              <CardDescription>
                Account balance progression over time
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
              ) : analysisData.balanceOverTime.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No data available</p>
                    <p className="text-sm">Start trading to see your balance progression</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      ${(10000 + totalProfitLoss).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Current Balance
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Change
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Performance */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Hourly Performance</span>
              </CardTitle>
              <CardDescription>
                Profit/Loss and win rate by hour of day
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
              ) : totalTrades === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No data available</p>
                    <p className="text-sm">Start trading to see hourly patterns</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {totalTrades}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Total Trades
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Win Rate
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emotion Impact */}
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
            ) : totalTrades === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No data available</p>
                  <p className="text-sm">Add trades with emotions to see patterns</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {totalTrades}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Trades with Emotions
                  </div>
                  <div className="text-lg font-semibold text-purple-600">
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Emotional Win Rate
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
