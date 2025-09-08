import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { ThemedBalanceChart } from '@/components/charts/ThemedBalanceChart';
import { ThemedTradeCountChart } from '@/components/charts/ThemedTradeCountChart';
import { ThemedEmotionChart } from '@/components/charts/ThemedEmotionChart';
import { BarChart3, TrendingUp, Clock, Heart, Target, Filter } from 'lucide-react';

export default function Analysis() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const { accounts, activeAccount } = useAccountManagement();
  
  // Use active account's initial balance if available, otherwise use default
  const effectiveInitialBalance = activeAccount?.initialBalance || 10000;
  const analysisData = useTradeAnalysis(trades, effectiveInitialBalance);

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
    
    if (selectedAccount !== "all" && trade.accountId !== selectedAccount) {
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

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-muted-foreground">Account:</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
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
          <ThemedBalanceChart 
            balanceOverTime={analysisData.balanceOverTime}
            loading={isLoading}
            error={error}
          />
          
          <ThemedTradeCountChart 
            data={analysisData.tradeCountByDate}
            loading={isLoading}
            error={error}
          />
        </div>

        {/* Emotion Impact */}
        <ThemedEmotionChart 
          data={analysisData.emotionPerformance.map(item => ({
            emotion: item.emotion,
            avgProfitLoss: item.trades > 0 ? item.profitLoss / item.trades : 0,
            tradeCount: item.trades,
            winRate: item.winRate
          }))}
          loading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
