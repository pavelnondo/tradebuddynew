import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Award,
  Zap,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useTradeAnalysis } from '@/hooks/useTradeAnalysis';
import { useUserSettings } from '@/hooks/useUserSettings';
import { RevolutionaryBalanceChart } from '@/components/charts/RevolutionaryBalanceChart';
import { RevolutionaryWinLossChart } from '@/components/charts/RevolutionaryWinLossChart';
import { cn } from "@/lib/utils";

// Loading skeleton component
const MetricSkeleton = () => (
  <div className="card-modern p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-24 bg-muted rounded shimmer"></div>
      <div className="h-8 w-8 bg-muted rounded-full shimmer"></div>
    </div>
    <div className="h-8 w-20 bg-muted rounded shimmer mb-2"></div>
    <div className="h-3 w-32 bg-muted rounded shimmer"></div>
  </div>
);

// Metric card component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = "up",
  format = "number",
  className = ""
}: {
  title: string;
  value: number | string;
  change?: string;
  icon: any;
  trend?: "up" | "down";
  format?: "number" | "currency" | "percentage";
  className?: string;
}) => {
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
    <Card className={cn("card-modern group hover:shadow-lg transition-smooth", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-muted transition-smooth">
            <Icon className="w-5 h-5 text-muted-foreground" />
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
              {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {change}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{formatValue(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick action card
const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = "default" 
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  variant?: "default" | "primary";
}) => (
  <Card 
    className={cn(
      "card-modern cursor-pointer group hover:shadow-lg transition-smooth",
      variant === "primary" && "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
    )}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-start space-x-4">
        <div className={cn(
          "p-3 rounded-xl",
          variant === "primary" ? "bg-white/20" : "bg-muted/50 group-hover:bg-muted"
        )}>
          <Icon className={cn("w-6 h-6", variant === "primary" ? "text-white" : "text-muted-foreground")} />
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold mb-1", variant === "primary" ? "text-white" : "text-foreground")}>
            {title}
          </h3>
          <p className={cn("text-sm", variant === "primary" ? "text-white/80" : "text-muted-foreground")}>
            {description}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Insight card
const InsightCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon,
  color = "blue" 
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  color?: "blue" | "green" | "yellow" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
  };

  return (
    <Card className="card-modern">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-2xl font-bold mb-2">{value}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const { settings } = useUserSettings();
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  
  // Update initial balance when settings are loaded
  useEffect(() => {
    if (settings) {
      setInitialBalance(Number(settings.initial_balance));
    }
  }, [settings]);
  
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  // Ensure trades is always an array to prevent map errors
  const safeTrades = Array.isArray(trades) ? trades : [];
  const navigate = useNavigate();
  const analysisData = useTradeAnalysis(safeTrades, initialBalance);

  const handleInitialBalanceChange = (newBalance: number) => {
    setInitialBalance(newBalance);
    // Note: This will be handled by the Settings page now
    localStorage.setItem('initialTradingBalance', newBalance.toString());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Your trading overview</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="h-64 bg-muted/50 rounded-lg shimmer"></div>
              </CardContent>
            </Card>
          </div>
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="h-64 bg-muted/50 rounded-lg shimmer"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTrades} className="btn-apple">
              Try Again
            </Button>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your trading overview for today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="btn-apple-secondary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => navigate('/add-trade')}
            className="btn-apple"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Balance"
          value={currentBalance}
          change="+12.5%"
          icon={DollarSign}
          format="currency"
          trend="up"
        />
        <MetricCard
          title="Total P&L"
          value={totalProfitLoss}
          change={totalProfitLoss >= 0 ? "+8.2%" : "-3.1%"}
          icon={TrendingUp}
          format="currency"
          trend={totalProfitLoss >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Win Rate"
          value={winRate}
          change="+2.1%"
          icon={Target}
          format="percentage"
          trend="up"
        />
        <MetricCard
          title="Total Trades"
          value={totalTrades}
          change="+5"
          icon={Activity}
          format="number"
          trend="up"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-modern lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Balance Over Time
            </CardTitle>
            <CardDescription>
              Your account balance progression
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <RevolutionaryBalanceChart balanceOverTime={analysisData.balanceOverTime} />
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Win/Loss Distribution
            </CardTitle>
            <CardDescription>
              Your trading performance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <RevolutionaryWinLossChart data={analysisData.winLossData} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-4">
            <QuickActionCard
              title="Add New Trade"
              description="Record your latest trade with detailed analysis"
              icon={Plus}
              onClick={() => navigate('/add-trade')}
              variant="primary"
            />
            <QuickActionCard
              title="View Analysis"
              description="Deep dive into your trading patterns"
              icon={BarChart3}
              onClick={() => navigate('/analysis')}
            />
            <QuickActionCard
              title="Trading Calendar"
              description="Plan and review your trading schedule"
              icon={Calendar}
              onClick={() => navigate('/calendar')}
            />
          </div>
        </div>

        {/* Trading Insights */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Trading Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard
              title="Best Performing Asset"
              value={analysisData.assetPerformance.length > 0 ? analysisData.assetPerformance[0]?.asset || "N/A" : "N/A"}
              description="Your most profitable trading instrument"
              icon={TrendingUp}
              color="green"
            />
            <InsightCard
              title="Peak Trading Hours"
              value={analysisData.tradesByHour.length > 0 ? `${analysisData.tradesByHour[0]?.hourFormatted || "N/A"}` : "N/A"}
              description="Your most successful trading time"
              icon={Clock}
              color="blue"
            />
            <InsightCard
              title="Profit Factor"
              value={analysisData.metrics.profitFactor ? analysisData.metrics.profitFactor.toFixed(2) : "N/A"}
              description={`Total Profit: $${analysisData.metrics.totalProfit?.toFixed(2) || '0'} | Total Loss: $${Math.abs(analysisData.metrics.totalLoss || 0).toFixed(2)}`}
              icon={Award}
              color="yellow"
            />
            <InsightCard
              title="Risk Level"
              value={analysisData.metrics.maxDrawdown > 10 ? "High" : analysisData.metrics.maxDrawdown > 5 ? "Medium" : "Low"}
              description="Your current risk exposure"
              icon={Zap}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {trades.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              Your latest trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      trade.profitLoss >= 0 ? "bg-green-500" : "bg-red-500"
                    )} />
                    <div>
                      <p className="font-medium">{trade.asset}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.date ? new Date(trade.date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {trade.profitLoss >= 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">{trade.tradeType}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/trades')}
                className="w-full"
              >
                View All Trades
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
