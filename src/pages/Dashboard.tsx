import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity,
  Plus,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { useUserSettings } from '@/hooks/useUserSettings';
import { BorderlessBalanceChart } from '@/components/charts/BorderlessBalanceChart';
import { BorderlessWinLossChart } from '@/components/charts/BorderlessWinLossChart';

export default function Dashboard() {
  const { settings } = useUserSettings();
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (settings) {
      setInitialBalance(Number(settings.initial_balance));
    }
  }, [settings]);
  
  const safeTrades = Array.isArray(trades) ? trades : [];
  const analysisData = useTradeAnalysis(safeTrades, initialBalance);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBalance = typeof analysisData.metrics.currentBalance === 'number' ? analysisData.metrics.currentBalance : 0;
  const totalProfitLoss = typeof analysisData.metrics.totalProfitLoss === 'number' ? analysisData.metrics.totalProfitLoss : 0;
  const winRate = typeof analysisData.metrics.winRate === 'number' ? analysisData.metrics.winRate : 0;
  const totalTrades = analysisData.metrics.totalTrades || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => navigate('/add-trade')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold">${currentBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total P&L</p>
                <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BorderlessBalanceChart 
          balanceOverTime={analysisData.balanceOverTime}
          loading={isLoading}
          error={error}
        />
        
        <BorderlessWinLossChart 
          data={analysisData.winLossData}
          loading={isLoading}
          error={error}
        />
      </div>

      {/* Recent Trades */}
      {safeTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your latest trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {safeTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{trade.asset}</p>
                    <p className="text-sm text-gray-600">
                      {trade.date ? new Date(trade.date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{trade.tradeType}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/trades')} className="w-full">
                View All Trades
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}