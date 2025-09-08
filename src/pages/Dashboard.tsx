import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { ThemedBalanceChart } from '@/components/charts/ThemedBalanceChart';
import { ThemedWinLossChart } from '@/components/charts/ThemedWinLossChart';
import { AccountManager } from '@/components/AccountManager';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart } from 'lucide-react';

export default function Dashboard() {
  const { settings } = useUserSettings();
  const { activeAccount } = useAccountManagement();
  const [initialBalance, setInitialBalance] = useState<number>(5000);
  const { trades, isLoading, error } = useApiTrades();
  
  // Use active account's initial balance if available, otherwise use default
  const effectiveInitialBalance = activeAccount?.initialBalance || initialBalance;
  const analysisData = useTradeAnalysis(trades, effectiveInitialBalance);

  const safeTrades = Array.isArray(trades) ? trades : [];
  const totalTrades = safeTrades.length;
  const winningTrades = safeTrades.filter(trade => trade.profitLoss > 0).length;
  const losingTrades = safeTrades.filter(trade => trade.profitLoss < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalProfitLoss = safeTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const currentBalance = effectiveInitialBalance + totalProfitLoss;

  const recentTrades = safeTrades
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Your trading performance overview</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {totalTrades} Total Trades
              </Badge>
              <Button className="btn-apple">
                <Target className="w-4 h-4 mr-2" />
                Add Trade
              </Button>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <AccountManager />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Balance */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${currentBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()} from initial
              </p>
            </CardContent>
          </Card>

          {/* Total Trades */}
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

          {/* Win Rate */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {winningTrades} winning trades
              </p>
            </CardContent>
          </Card>

          {/* Total P&L */}
          <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total P&L
              </CardTitle>
              {totalProfitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProfitLoss >= 0 ? 'Profit' : 'Loss'} from trading
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ThemedBalanceChart 
            balanceOverTime={analysisData.balanceOverTime}
            loading={isLoading}
            error={error}
          />
          
          <ThemedWinLossChart 
            data={analysisData.winLossData}
            loading={isLoading}
            error={error}
          />
        </div>

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                Your latest trading activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrades.map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${trade.profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-medium text-foreground">
                          {trade.asset || 'Unknown Asset'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(trade.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trade.side || 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
