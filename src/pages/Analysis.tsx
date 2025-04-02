import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { Activity, Coins, DollarSign, LineChart, ListFilter, PieChart, TrendingDown, TrendingUp, Clock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  Pie, 
  PieChart as RechartPieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Area,
  AreaChart
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartTooltipContent } from "@/components/ui/chart";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Analysis() {
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const { fetchTrades, isLoading } = useSupabaseTrades();
  
  // Fetch trades from Supabase on component mount
  useEffect(() => {
    const loadTrades = async () => {
      const tradesData = await fetchTrades();
      setTrades(tradesData);
    };
    
    loadTrades();
  }, [fetchTrades]);
  
  // Calculate analysis data
  const analysisData = useMemo(() => {
    // Basic metrics
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((trade) => trade.profitLoss > 0).length;
    const lossTrades = trades.filter((trade) => trade.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const currentBalance = initialBalance + totalProfitLoss;
    const percentageReturn = initialBalance > 0 ? (totalProfitLoss / initialBalance) * 100 : 0;
    
    // Advanced metrics
    const totalProfit = trades
      .filter((trade) => trade.profitLoss > 0)
      .reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    const totalLoss = trades
      .filter((trade) => trade.profitLoss < 0)
      .reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    const profitFactor = Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : totalProfit;
    
    const avgWin = profitableTrades > 0
      ? totalProfit / profitableTrades
      : 0;
    
    const avgLoss = lossTrades > 0
      ? Math.abs(totalLoss) / lossTrades
      : 0;
    
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;
    
    // Calculate drawdowns
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peak = initialBalance;
    
    const balanceOverTime = trades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, trade, index) => {
        const date = new Date(trade.date).toLocaleDateString();
        const prevBalance = index > 0 ? acc[index - 1].balance : initialBalance;
        const currentBalance = prevBalance + trade.profitLoss;
        
        // Update peak and drawdown
        if (currentBalance > peak) {
          peak = currentBalance;
          currentDrawdown = 0;
        } else {
          currentDrawdown = (peak - currentBalance) / peak * 100;
          if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown;
          }
        }
        
        acc.push({
          date,
          balance: currentBalance,
          drawdown: currentDrawdown
        });
        
        return acc;
      }, [] as { date: string; balance: number; drawdown: number }[]);
    
    // Analysis by asset
    const assetPerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = {
          asset: trade.asset,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.asset].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.asset].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.asset].losses += 1;
      }
      
      acc[trade.asset].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      asset: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const assetPerformanceArray = Object.values(assetPerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Analysis by trade type
    const tradeTypePerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.tradeType]) {
        acc[trade.tradeType] = {
          type: trade.tradeType,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.tradeType].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.tradeType].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.tradeType].losses += 1;
      }
      
      acc[trade.tradeType].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      type: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const tradeTypePerformanceArray = Object.values(tradeTypePerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Analysis by emotion
    const emotionPerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.emotion]) {
        acc[trade.emotion] = {
          emotion: trade.emotion,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[trade.emotion].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[trade.emotion].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[trade.emotion].losses += 1;
      }
      
      acc[trade.emotion].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, {
      emotion: string;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const emotionPerformanceArray = Object.values(emotionPerformance).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }));
    
    // Win/Loss ratio pie chart data
    const winLossRatio = [
      { name: "Wins", value: profitableTrades },
      { name: "Losses", value: lossTrades },
    ];
    
    // Time Analysis
    // Group trades by hour of day to find when you trade best
    const tradesByHour = trades.reduce((acc, trade) => {
      const hour = new Date(trade.date).getHours();
      
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          trades: 0,
          wins: 0,
          losses: 0,
          profitLoss: 0,
        };
      }
      
      acc[hour].trades += 1;
      
      if (trade.profitLoss > 0) {
        acc[hour].wins += 1;
      } else if (trade.profitLoss < 0) {
        acc[hour].losses += 1;
      }
      
      acc[hour].profitLoss += trade.profitLoss;
      
      return acc;
    }, {} as Record<number, {
      hour: number;
      trades: number;
      wins: number;
      losses: number;
      profitLoss: number;
    }>);
    
    const tradesByHourArray = Object.values(tradesByHour).map((item) => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
      hourFormatted: `${item.hour}:00`
    }));
    
    return {
      metrics: {
        totalTrades,
        profitableTrades,
        lossTrades,
        winRate,
        totalProfitLoss,
        totalProfit,
        totalLoss,
        profitFactor,
        avgWin,
        avgLoss,
        riskRewardRatio,
        currentBalance,
        percentageReturn,
        maxDrawdown
      },
      assetPerformance: assetPerformanceArray,
      tradeTypePerformance: tradeTypePerformanceArray,
      emotionPerformance: emotionPerformanceArray,
      tradesByHour: tradesByHourArray,
      winLossRatio,
      balanceOverTime
    };
  }, [trades, initialBalance]);
  
  // Function to update initial balance
  const handleInitialBalanceChange = (newBalance: number) => {
    setInitialBalance(newBalance);
    localStorage.setItem('initialTradingBalance', newBalance.toString());
    toast.success("Initial balance updated successfully");
  };
  
  // Color config for charts
  const chartConfig = {
    profit: { color: "hsl(143, 85%, 46%)" },
    loss: { color: "hsl(0, 84%, 60%)" },
    wins: { color: "#4ade80" },
    losses: { color: "#f87171" },
    balance: { color: "#3b82f6" },
    drawdown: { color: "#f87171" }
  };
  
  // COLORS for pie charts
  const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa", "#fb923c"];

  // Function to render empty state for charts
  const renderEmptyState = (message: string) => (
    <div className="flex items-center justify-center h-full w-full">
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Performance Analysis</h1>
      
      {/* Balance Settings */}
      <Card className="p-4">
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
          <div className="flex-1">
            <Label htmlFor="initial-balance">Initial Account Balance</Label>
            <div className="flex items-center mt-1">
              <Input
                id="initial-balance"
                type="number"
                min="0"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                placeholder="Enter your initial balance"
                className="flex-1"
              />
              <Button 
                className="ml-2" 
                onClick={() => handleInitialBalanceChange(initialBalance)}
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set your initial trading balance to accurately calculate returns and drawdowns
            </p>
          </div>
          
          <div className="flex space-x-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-muted-foreground text-xs">Current Balance</div>
              <div className={`text-xl font-semibold ${analysisData.metrics.currentBalance >= initialBalance ? 'text-green-500' : 'text-red-500'}`}>
                ${analysisData.metrics.currentBalance.toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-muted-foreground text-xs">Total Return</div>
              <div className={`text-xl font-semibold ${analysisData.metrics.percentageReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analysisData.metrics.percentageReturn.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Empty state when no trades exist */}
      {trades.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">No Trading Data Available</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add your trading history to see detailed performance analysis, metrics, and insights to improve your trading strategy.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Account Balance and Drawdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5" />
                Account Balance & Drawdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {analysisData.balanceOverTime.length > 0 ? (
                  <ChartContainer 
                    title="Account Balance & Drawdown"
                    icon={<LineChart className="h-5 w-5 text-primary" />}
                    isEmpty={analysisData.balanceOverTime.length === 0}
                    emptyMessage="No balance data available yet."
                  >
                    <ResponsiveContainer width="99%" height="99%">
                      <AreaChart 
                        data={analysisData.balanceOverTime}
                        margin={{ top: 20, right: 70, left: 40, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          stroke={chartConfig.balance.color}
                          label={{ 
                            value: 'Balance ($)', 
                            angle: -90, 
                            position: 'insideLeft', 
                            offset: -20,
                            style: { textAnchor: 'middle', fontSize: 12 }
                          }}
                          tick={{ fontSize: 10 }}
                          tickMargin={8}
                          width={50}
                          domain={['dataMin - 1000', 'dataMax + 1000']}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke={chartConfig.drawdown.color}
                          label={{ 
                            value: 'Drawdown (%)', 
                            angle: 90, 
                            position: 'insideRight', 
                            offset: -15,
                            style: { textAnchor: 'middle', fontSize: 12 }
                          }}
                          tick={{ fontSize: 10 }}
                          tickMargin={8}
                          width={50}
                          domain={[0, 'dataMax + 5']}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{ paddingTop: 10 }}
                        />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="balance" 
                          stroke={chartConfig.balance.color} 
                          fill={chartConfig.balance.color}
                          fillOpacity={0.2}
                          name="Account Balance ($)"
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="drawdown" 
                          stroke={chartConfig.drawdown.color} 
                          fill={chartConfig.drawdown.color}
                          fillOpacity={0.2}
                          name="Drawdown (%)"
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-muted-foreground text-center">No balance data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Win Rate</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
                  {analysisData.metrics.winRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Profit Factor</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-muted-foreground" />
                  {analysisData.metrics.profitFactor.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Win</CardDescription>
                <CardTitle className="text-2xl flex items-center text-green-500">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  ${analysisData.metrics.avgWin.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Loss</CardDescription>
                <CardTitle className="text-2xl flex items-center text-red-500">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  ${analysisData.metrics.avgLoss.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Risk:Reward</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <ListFilter className="mr-2 h-5 w-5 text-muted-foreground" />
                  1:{analysisData.metrics.riskRewardRatio.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Max Drawdown</CardDescription>
                <CardTitle className="text-2xl flex items-center text-red-500">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  {analysisData.metrics.maxDrawdown.toFixed(2)}%
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Profit</CardDescription>
                <CardTitle className="text-2xl flex items-center text-green-500">
                  <DollarSign className="mr-2 h-5 w-5" />
                  ${analysisData.metrics.totalProfit.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Loss</CardDescription>
                <CardTitle className="text-2xl flex items-center text-red-500">
                  <DollarSign className="mr-2 h-5 w-5" />
                  ${Math.abs(analysisData.metrics.totalLoss).toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net P&L</CardDescription>
                <CardTitle className={`text-2xl flex items-center ${
                  analysisData.metrics.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}>
                  <Coins className="mr-2 h-5 w-5" />
                  ${analysisData.metrics.totalProfitLoss.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          {/* Win/Loss Ratio and Asset Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Ratio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Win/Loss Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analysisData.winLossRatio[0].value > 0 || analysisData.winLossRatio[1].value > 0 ? (
                    <ChartContainer 
                      title="Win/Loss Ratio"
                      icon={<PieChart className="h-5 w-5 text-primary" />}
                      isEmpty={analysisData.winLossRatio.length === 0}
                      emptyMessage="No win/loss data available yet."
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <RechartPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <Pie
                            data={analysisData.winLossRatio}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="win-cell" fill={chartConfig.wins.color} />
                            <Cell key="loss-cell" fill={chartConfig.losses.color} />
                          </Pie>
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            wrapperStyle={{ paddingTop: 20 }}
                          />
                        </RechartPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-muted-foreground text-center">No win/loss data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Asset Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  Asset Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analysisData.assetPerformance.length > 0 ? (
                    <ChartContainer 
                      title="Asset Performance"
                      icon={<LineChart className="h-5 w-5 text-primary" />}
                      isEmpty={analysisData.assetPerformance.length === 0}
                      emptyMessage="No asset performance data available yet."
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart 
                          data={analysisData.assetPerformance} 
                          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="asset"
                            tick={{ fontSize: 10 }}
                            tickMargin={10}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickMargin={8}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                          <Bar
                            dataKey="profitLoss"
                            name="Profit/Loss"
                            radius={[4, 4, 0, 0]}
                          >
                            {analysisData.assetPerformance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.profitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-muted-foreground text-center">No asset performance data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Emotions vs Win Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  Emotions vs Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analysisData.emotionPerformance.length > 0 ? (
                    <ChartContainer 
                      title="Emotions vs Win Rate"
                      icon={<LineChart className="h-5 w-5 text-primary" />}
                      isEmpty={analysisData.emotionPerformance.length === 0}
                      emptyMessage="No emotion data available yet."
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart 
                          data={analysisData.emotionPerformance} 
                          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="emotion"
                            tick={{ fontSize: 10 }}
                            tickMargin={10}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickMargin={8}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                          <Bar
                            dataKey="winRate"
                            name="Win Rate (%)"
                            fill="#60a5fa"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-muted-foreground text-center">No emotion data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Trade Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  Trade Type Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analysisData.tradeTypePerformance.length > 0 ? (
                    <ChartContainer 
                      title="Trade Type Performance"
                      icon={<LineChart className="h-5 w-5 text-primary" />}
                      isEmpty={analysisData.tradeTypePerformance.length === 0}
                      emptyMessage="No trade type performance data available yet."
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart 
                          data={analysisData.tradeTypePerformance} 
                          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="type"
                            tick={{ fontSize: 10 }}
                            tickMargin={10}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickMargin={8}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                          <Bar
                            dataKey="profitLoss"
                            name="Profit/Loss"
                            radius={[4, 4, 0, 0]}
                          >
                            {analysisData.tradeTypePerformance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.profitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-muted-foreground text-center">No trade type performance data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Trading Hours Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Best Trading Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analysisData.tradesByHour.length > 0 ? (
                    <ChartContainer 
                      title="Best Trading Hours"
                      icon={<Clock className="h-5 w-5 text-primary" />}
                      isEmpty={analysisData.tradesByHour.length === 0}
                      emptyMessage="No time-based analysis data available yet."
                    >
                      <ResponsiveContainer width="99%" height="99%">
                        <BarChart 
                          data={analysisData.tradesByHour} 
                          margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="hourFormatted"
                            tick={{ fontSize: 10 }}
                            tickMargin={10}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left"
                            tick={{ fontSize: 10 }}
                            tickMargin={8}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right"
                            tick={{ fontSize: 10 }}
                            tickMargin={8}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ paddingTop: 10 }}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="profitLoss"
                            name="P&L ($)"
                            fill="#60a5fa"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="winRate"
                            name="Win Rate (%)"
                            fill="#4ade80"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-muted-foreground text-center">No time-based analysis data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Insights */}
          {trades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  System-generated insights based on your trading history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Best performing asset */}
                {analysisData.assetPerformance.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">Best Performing Asset</h3>
                    <p className="text-sm">
                      <strong>{analysisData.assetPerformance.sort((a, b) => b.profitLoss -
