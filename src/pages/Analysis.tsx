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
import { BalanceChart } from "@/components/charts/BalanceChart";

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
  const [tradeType, setTradeType] = useState("all");
  const [emotion, setEmotion] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();

  // Filter trades based on timeframe, asset, trade type, and emotion
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

    if (tradeType !== "all") {
      filtered = filtered.filter(trade => (trade.tradeType || '').toLowerCase() === tradeType.toLowerCase());
    }

    if (emotion !== "all") {
      filtered = filtered.filter(trade => (trade.emotion || '').toLowerCase() === emotion.toLowerCase());
    }

    return filtered;
  }, [trades, timeframe, selectedAsset, tradeType, emotion]);

  // Calculate analysis metrics using the existing hook
  const initialBalance = 10000;
  const analysisHook = useTradeAnalysis(filteredTrades as any, initialBalance);

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
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

  if (!analysisHook) {
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
            <p className="text-muted-foreground mb-6">Add some trades to see detailed analysis and insights</p>
            <Button onClick={() => navigate('/add-trade')} className="btn-apple">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, balanceOverTime, winLossData } = analysisHook;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trading Analysis</h1>
          <p className="text-muted-foreground">Deep insights into your trading performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => {/* Export functionality */}} className="btn-apple-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
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
            <div>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Trade Type</label>
              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger className="input-modern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Long">Long</SelectItem>
                  <SelectItem value="Short">Short</SelectItem>
                  <SelectItem value="Scalp">Scalp</SelectItem>
                  <SelectItem value="Swing">Swing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Emotion</label>
              <Select value={emotion} onValueChange={setEmotion}>
                <SelectTrigger className="input-modern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emotions</SelectItem>
                  <SelectItem value="Confident">Confident</SelectItem>
                  <SelectItem value="Calm">Calm</SelectItem>
                  <SelectItem value="Excited">Excited</SelectItem>
                  <SelectItem value="Nervous">Nervous</SelectItem>
                  <SelectItem value="Fearful">Fearful</SelectItem>
                  <SelectItem value="Greedy">Greedy</SelectItem>
                  <SelectItem value="Frustrated">Frustrated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total P&L" value={metrics.totalProfitLoss} icon={DollarSign} format="currency" color={metrics.totalProfitLoss >= 0 ? "green" : "red"} />
        <MetricCard title="Win Rate" value={metrics.winRate} icon={Target} format="percentage" color="blue" />
        <MetricCard title="Total Trades" value={metrics.totalTrades} icon={Activity} format="number" color="purple" />
        <MetricCard title="Profit Factor" value={metrics.profitFactor} icon={TrendingUp} format="number" color="yellow" />
      </div>

      {/* Balance Over Time */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Balance Over Time</CardTitle>
          <CardDescription>Account balance progression across the selected period</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <BalanceChart balanceOverTime={balanceOverTime} />
        </CardContent>
      </Card>
    </div>
  );
}
