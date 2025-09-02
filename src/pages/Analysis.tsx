import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Clock,
  Calendar,
  PieChart,
  Activity,
  Award,
  Zap,
  Filter,
  Download,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { cn } from "@/lib/utils";

// Performance metric card
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = "up",
  format = "number",
  color = "blue"
}: {
  title: string;
  value: number | string;
  change?: string;
  icon: any;
  trend?: "up" | "down";
  format?: "number" | "currency" | "percentage";
  color?: "blue" | "green" | "red" | "purple" | "yellow";
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
  };

  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    switch (format) {
      case "currency":
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card className="card-modern">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-xl", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {change && (
            <Badge 
              variant={trend === "up" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {trend === "up" ? "↗" : "↘"} {change}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{formatValue(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Insight card
const InsightCard = ({ 
  title, 
  description, 
  icon: Icon,
  color = "blue",
  action 
}: {
  title: string;
  description: string;
  icon: any;
  color?: "blue" | "green" | "red" | "purple" | "yellow";
  action?: { label: string; onClick: () => void };
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
  };

  return (
    <Card className="card-modern">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            {action && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={action.onClick}
                className="btn-apple-secondary"
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Analysis() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();

  // Filter trades based on timeframe and asset
  const filteredTrades = useMemo(() => {
    // Ensure trades is always an array to prevent filter/reduce errors
    if (!Array.isArray(trades)) return [];
    let filtered = trades;

    // Filter by timeframe
    if (timeframe !== "all") {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeframe) {
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoff.setMonth(now.getMonth() - 3);
          break;
        case "year":
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= cutoff;
      });
    }

    // Filter by asset
    if (selectedAsset !== "all") {
      filtered = filtered.filter(trade => trade.asset === selectedAsset);
    }

    return filtered;
  }, [trades, timeframe, selectedAsset]);

  // Calculate analysis metrics
  const analysis = useMemo(() => {
    if (filteredTrades.length === 0) return null;

    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => t.profitLoss > 0).length;
    const losingTrades = filteredTrades.filter(t => t.profitLoss < 0).length;
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winRate = (winningTrades / totalTrades) * 100;
    const avgWin = winningTrades > 0 ? filteredTrades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? Math.abs(filteredTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losingTrades) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Asset performance
    const assetPerformance = filteredTrades.reduce((acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = { trades: 0, pnl: 0, wins: 0 };
      }
      acc[trade.asset].trades++;
      acc[trade.asset].pnl += trade.profitLoss || 0;
      if (trade.profitLoss > 0) acc[trade.asset].wins++;
      return acc;
    }, {} as Record<string, { trades: number; pnl: number; wins: number }>);

    // Emotion analysis
    const emotionPerformance = filteredTrades.reduce((acc, trade) => {
      if (trade.emotion) {
        if (!acc[trade.emotion]) {
          acc[trade.emotion] = { trades: 0, pnl: 0, wins: 0 };
        }
        acc[trade.emotion].trades++;
        acc[trade.emotion].pnl += trade.profitLoss || 0;
        if (trade.profitLoss > 0) acc[trade.emotion].wins++;
      }
      return acc;
    }, {} as Record<string, { trades: number; pnl: number; wins: number }>);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      assetPerformance,
      emotionPerformance
    };
  }, [filteredTrades]);

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    console.log('Analysis uniqueAssets - trades:', trades, 'isArray:', Array.isArray(trades));
    if (!Array.isArray(trades)) {
      console.warn('Analysis uniqueAssets - trades is not array:', trades);
      return [];
    }
    const assets = [...new Set(trades.map(t => t.asset))];
    return assets.sort();
  }, [trades]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Analysis</h1>
            <p className="text-muted-foreground">Deep insights into your trading performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern p-6">
              <div className="h-4 w-24 bg-muted rounded shimmer mb-2"></div>
              <div className="h-8 w-16 bg-muted rounded shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Error Loading Analysis</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="btn-apple">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Analysis</h1>
            <p className="text-muted-foreground">Deep insights into your trading performance</p>
          </div>
        </div>
        
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Add some trades to see detailed analysis and insights
            </p>
            <Button onClick={() => navigate('/add-trade')} className="btn-apple">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trading Analysis</h1>
          <p className="text-muted-foreground">
            Deep insights into your trading performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {/* Export functionality */}}
            className="btn-apple-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="input-modern">
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
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="input-modern">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total P&L"
          value={analysis.totalPnL}
          icon={DollarSign}
          format="currency"
          color={analysis.totalPnL >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Win Rate"
          value={analysis.winRate}
          icon={Target}
          format="percentage"
          color="blue"
        />
        <MetricCard
          title="Total Trades"
          value={analysis.totalTrades}
          icon={Activity}
          format="number"
          color="purple"
        />
        <MetricCard
          title="Profit Factor"
          value={analysis.profitFactor}
          icon={TrendingUp}
          format="number"
          color="yellow"
        />
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Win/Loss Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of your winning and losing trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Winning Trades</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{analysis.winningTrades}</div>
                  <div className="text-xs text-muted-foreground">
                    {((analysis.winningTrades / analysis.totalTrades) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Losing Trades</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{analysis.losingTrades}</div>
                  <div className="text-xs text-muted-foreground">
                    {((analysis.losingTrades / analysis.totalTrades) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Average Performance
            </CardTitle>
            <CardDescription>
              Your average win and loss amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Win</span>
                <span className="font-semibold text-green-600">
                  +${analysis.avgWin.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Loss</span>
                <span className="font-semibold text-red-600">
                  -${analysis.avgLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk/Reward Ratio</span>
                <span className="font-semibold">
                  1:{analysis.avgLoss > 0 ? (analysis.avgWin / analysis.avgLoss).toFixed(2) : "∞"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InsightCard
          title="Best Performing Asset"
          description={
            Object.keys(analysis.assetPerformance).length > 0
              ? Object.entries(analysis.assetPerformance)
                  .sort(([,a], [,b]) => b.pnl - a.pnl)[0][0]
              : "No data available"
          }
          icon={TrendingUp}
          color="green"
        />
        
        <InsightCard
          title="Most Profitable Emotion"
          description={
            Object.keys(analysis.emotionPerformance).length > 0
              ? Object.entries(analysis.emotionPerformance)
                  .sort(([,a], [,b]) => b.pnl - a.pnl)[0][0]
              : "No data available"
          }
          icon={Award}
          color="yellow"
        />
        
        <InsightCard
          title="Trading Frequency"
          description={`${analysis.totalTrades} trades in selected period`}
          icon={Clock}
          color="blue"
          action={{
            label: "View Calendar",
            onClick: () => navigate('/calendar')
          }}
        />
      </div>

      {/* Asset Performance Table */}
      {Object.keys(analysis.assetPerformance).length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Asset Performance</CardTitle>
            <CardDescription>
              How each asset is performing in your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 font-medium">Asset</th>
                    <th className="text-left p-3 font-medium">Trades</th>
                    <th className="text-left p-3 font-medium">Win Rate</th>
                    <th className="text-left p-3 font-medium">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.assetPerformance)
                    .sort(([,a], [,b]) => b.pnl - a.pnl)
                    .map(([asset, data]) => (
                      <tr key={asset} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">{asset}</td>
                        <td className="p-3">{data.trades}</td>
                        <td className="p-3">
                          {((data.wins / data.trades) * 100).toFixed(1)}%
                        </td>
                        <td className={cn(
                          "p-3 font-semibold",
                          data.pnl >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
