import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity,
  Award,
  Clock,
  Download,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { ProfessionalBalanceChart } from "@/components/charts/ProfessionalBalanceChart";
import { ProfessionalHourlyChart } from "@/components/charts/ProfessionalHourlyChart";
import { ProfessionalEmotionsChart } from "@/components/charts/ProfessionalEmotionsChart";
import { SetupPerformanceChart } from "@/components/charts/SetupPerformanceChart";

export default function Analysis() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();

  const filteredTrades = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    let filtered = trades;

    if (timeframe !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (timeframe) {
        case "week": cutoff.setDate(now.getDate() - 7); break;
        case "month": cutoff.setMonth(now.getMonth() - 1); break;
        case "quarter": cutoff.setMonth(now.getMonth() - 3); break;
        case "year": cutoff.setFullYear(now.getFullYear() - 1); break;
      }
      filtered = filtered.filter(trade => new Date(trade.date) >= cutoff);
    }

    if (selectedAsset !== "all") {
      filtered = filtered.filter(trade => trade.asset === selectedAsset);
    }

    return filtered;
  }, [trades, timeframe, selectedAsset]);

  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    const assets = [...new Set(trades.map(t => t.asset))];
    return assets.sort();
  }, [trades]);

  const analysisData = useTradeAnalysis(filteredTrades, 10000);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analysis</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analysis</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (filteredTrades.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analysis</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">Add some trades to see detailed analysis</p>
            <Button onClick={() => navigate('/add-trade')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, balanceOverTime, tradesByHour, emotionPerformance } = analysisData as any;
  
  const transformedEmotionPerformance = emotionPerformance?.map((item: any) => ({
    emotion: item.emotion,
    avgProfitLoss: item.trades > 0 ? item.profitLoss / item.trades : 0,
    winRate: item.winRate,
    tradeCount: item.trades
  })) || [];
  
  const transformedTradesByHour = tradesByHour?.map((item: any) => ({
    hour: item.hour,
    profitLoss: item.profitLoss,
    winRate: item.winRate,
    tradeCount: item.trades
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analysis</h1>
        <Button variant="outline" onClick={() => {/* Export functionality */}}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
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

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total P&L</p>
                <p className={`text-2xl font-bold ${metrics.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalProfitLoss >= 0 ? '+' : ''}${metrics.totalProfitLoss.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold">{metrics.totalTrades}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Factor</p>
                <p className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Over Time</CardTitle>
          <CardDescription>Account balance progression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ProfessionalBalanceChart balanceOverTime={balanceOverTime} />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Emotion Impact</CardTitle>
            <CardDescription>How emotions correlate with performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ProfessionalEmotionsChart data={transformedEmotionPerformance} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Performance</CardTitle>
            <CardDescription>Profit/Loss and win rate by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ProfessionalHourlyChart data={transformedTradesByHour} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Performance</CardTitle>
          <CardDescription>Performance analysis by trading setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <SetupPerformanceChart data={[]} isLoading={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}