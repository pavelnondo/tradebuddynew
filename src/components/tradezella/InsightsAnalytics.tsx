import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Activity,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Maximize2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  asset: string;
  tradeType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  date: string;
  profitLoss: number;
  notes: string;
  emotion: string;
  setup: string;
  accountId: string;
  confidenceLevel: number;
  executionQuality: number;
  duration: number;
  tags: string[];
}

interface InsightsAnalyticsProps {
  trades: Trade[];
  isLoading?: boolean;
  error?: string | null;
}

export function InsightsAnalytics({ trades, isLoading, error }: InsightsAnalyticsProps) {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('profit');
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());

  // Filter trades based on selected filters
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    if (selectedAccount !== 'all') {
      filtered = filtered.filter(trade => trade.accountId === selectedAccount);
    }

    if (selectedTimeframe !== 'all') {
      const now = new Date();
      const daysAgo = {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
      }[selectedTimeframe] || 0;

      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(trade => new Date(trade.date) >= cutoffDate);
      }
    }

    return filtered;
  }, [trades, selectedAccount, selectedTimeframe]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        avgTradeDuration: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const winningTrades = filteredTrades.filter(trade => trade.profitLoss > 0);
    const losingTrades = filteredTrades.filter(trade => trade.profitLoss < 0);
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / losingTrades.length : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
    const bestTrade = Math.max(...filteredTrades.map(trade => trade.profitLoss));
    const worstTrade = Math.min(...filteredTrades.map(trade => trade.profitLoss));
    const avgTradeDuration = filteredTrades.reduce((sum, trade) => sum + trade.duration, 0) / filteredTrades.length;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    filteredTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(trade => {
        runningPnL += trade.profitLoss;
        if (runningPnL > peak) peak = runningPnL;
        const drawdown = peak - runningPnL;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

    return {
      totalTrades: filteredTrades.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio: 0, // Simplified calculation
      avgTradeDuration,
      bestTrade,
      worstTrade
    };
  }, [filteredTrades]);

  // Prepare chart data
  const equityCurveData = useMemo(() => {
    const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulativePnL = 0;
    
    return sortedTrades.map(trade => {
      cumulativePnL += trade.profitLoss;
      return {
        date: new Date(trade.date).toLocaleDateString(),
        equity: cumulativePnL,
        trade: trade.profitLoss
      };
    });
  }, [filteredTrades]);

  const dailyPnLData = useMemo(() => {
    const dailyData: Record<string, number> = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.date).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + trade.profitLoss;
    });

    return Object.entries(dailyData)
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTrades]);

  const setupPerformanceData = useMemo(() => {
    const setupStats: Record<string, { trades: number; pnl: number; wins: number }> = {};
    
    filteredTrades.forEach(trade => {
      if (!setupStats[trade.setup]) {
        setupStats[trade.setup] = { trades: 0, pnl: 0, wins: 0 };
      }
      setupStats[trade.setup].trades++;
      setupStats[trade.setup].pnl += trade.profitLoss;
      if (trade.profitLoss > 0) setupStats[trade.setup].wins++;
    });

    return Object.entries(setupStats).map(([setup, stats]) => ({
      setup,
      trades: stats.trades,
      pnl: stats.pnl,
      winRate: (stats.wins / stats.trades) * 100,
      avgPnL: stats.pnl / stats.trades
    }));
  }, [filteredTrades]);

  const emotionDistributionData = useMemo(() => {
    const emotionStats: Record<string, number> = {};
    
    filteredTrades.forEach(trade => {
      emotionStats[trade.emotion] = (emotionStats[trade.emotion] || 0) + 1;
    });

    return Object.entries(emotionStats).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: (count / filteredTrades.length) * 100
    }));
  }, [filteredTrades]);

  const timeOfDayData = useMemo(() => {
    const timeStats: Record<string, { trades: number; pnl: number }> = {};
    
    filteredTrades.forEach(trade => {
      const hour = new Date(trade.date).getHours();
      const timeSlot = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
      
      if (!timeStats[timeSlot]) {
        timeStats[timeSlot] = { trades: 0, pnl: 0 };
      }
      timeStats[timeSlot].trades++;
      timeStats[timeSlot].pnl += trade.profitLoss;
    });

    return Object.entries(timeStats).map(([timeSlot, stats]) => ({
      timeSlot,
      trades: stats.trades,
      avgPnL: stats.pnl / stats.trades
    }));
  }, [filteredTrades]);

  const toggleChartExpansion = (chartId: string) => {
    const newExpanded = new Set(expandedCharts);
    if (newExpanded.has(chartId)) {
      newExpanded.delete(chartId);
    } else {
      newExpanded.add(chartId);
    }
    setExpandedCharts(newExpanded);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="tradezella-widget">
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Insights & Analytics</h2>
          <p className="text-muted-foreground">
            Deep dive into your trading performance and patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="tradezella-widget">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="1">Account 1</SelectItem>
                  <SelectItem value="2">Account 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit/Loss</SelectItem>
                  <SelectItem value="winrate">Win Rate</SelectItem>
                  <SelectItem value="trades">Trade Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="tradezella-metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", metrics.totalPnL >= 0 ? "text-green-500" : "text-red-500")}>
              {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="tradezella-metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card className="tradezella-metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit Factor
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk/Reward ratio
            </p>
          </CardContent>
        </Card>

        <Card className="tradezella-metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Drawdown
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -${metrics.maxDrawdown.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Peak to trough
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Equity Curve */}
          <Card className="tradezella-widget">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Equity Curve</span>
                  </CardTitle>
                  <CardDescription>Your account balance progression over time</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleChartExpansion('equity')}
                >
                  {expandedCharts.has('equity') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("transition-all duration-300 min-h-[200px]", expandedCharts.has('equity') ? "h-96" : "h-64")} style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={equityCurveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily P&L */}
          <Card className="tradezella-widget">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Daily P&L</span>
                  </CardTitle>
                  <CardDescription>Profit and loss by trading day</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleChartExpansion('daily')}
                >
                  {expandedCharts.has('daily') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("transition-all duration-300", expandedCharts.has('daily') ? "h-96" : "h-64")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyPnLData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Setup Performance */}
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Setup Performance</span>
              </CardTitle>
              <CardDescription>Performance breakdown by trading setup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-h-[200px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <BarChart data={setupPerformanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="setup" type="category" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Bar dataKey="pnl" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Time of Day Analysis */}
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Time of Day Analysis</span>
              </CardTitle>
              <CardDescription>Performance by time of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeOfDayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="timeSlot" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Bar dataKey="avgPnL" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {/* Emotion Distribution */}
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Emotion Distribution</span>
              </CardTitle>
              <CardDescription>Distribution of emotions during trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-h-[200px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <PieChart>
                    <Pie
                      data={emotionDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ emotion, percentage }) => `${emotion} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {emotionDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
       </TabsContent>
      </Tabs>
    </div>
  );
}
