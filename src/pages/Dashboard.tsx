import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { ArrowDown, ArrowUp, BarChart3, Clock, DollarSign, LineChart, PieChart, Timer, CandlestickChart, Bolt, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ChartContainer";
import { ChartWrapper } from "@/components/ChartWrapper";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { InitialBalanceForm } from "@/components/InitialBalanceForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { defaultChartConfig } from "@/utils/chartUtils";

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  const { fetchTrades, isLoading, error } = useSupabaseTrades();
  
  // Fetch trades from Supabase on component mount
  useEffect(() => {
    const loadTrades = async () => {
      const tradesData = await fetchTrades();
      setTrades(tradesData);
    };
    
    loadTrades();
  }, [fetchTrades]);
  
  // Save initial balance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('initialTradingBalance', initialBalance.toString());
  }, [initialBalance]);
  
  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((trade) => trade.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const avgProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;
    const currentBalance = initialBalance + totalProfitLoss;
    const percentageReturn = initialBalance > 0 ? (totalProfitLoss / initialBalance) * 100 : 0;
    
    const emotionData = trades.reduce((acc, trade) => {
      acc[trade.emotion] = (acc[trade.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionChartData = Object.entries(emotionData).map(([name, value]) => ({ name, value }));
    
    const plOverTime = trades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, trade, index) => {
        const date = new Date(trade.date).toLocaleDateString();
        const prevBalance = index > 0 ? acc[index - 1].balance : initialBalance;
        acc.push({
          date,
          value: trade.profitLoss,
          cumulative: index > 0 ? acc[index - 1].cumulative + trade.profitLoss : trade.profitLoss,
          balance: prevBalance + trade.profitLoss
        });
        return acc;
      }, [] as { date: string; value: number; cumulative: number; balance: number }[]);
    
    return {
      totalTrades,
      profitableTrades,
      winRate,
      totalProfitLoss,
      avgProfitLoss,
      emotionChartData,
      plOverTime,
      currentBalance,
      percentageReturn
    };
  }, [trades, initialBalance]);

  // Updated chart config with correct emotion color mapping
  const chartConfig = {
    profit: { color: "hsl(143, 85%, 46%)" },
    loss: { color: "hsl(0, 84%, 60%)" },
    // Positive emotions with calming, positive colors
    Confident: { color: "#4ade80" }, // Green - positive
    Calm: { color: "#a78bfa" }, // Purple - positive
    Satisfied: { color: "#22d3ee" }, // Cyan - positive
    Excited: { color: "#facc15" }, // Yellow - positive
    // Negative emotions with warning and alarming colors
    Nervous: { color: "#fb923c" }, // Orange - caution
    Greedy: { color: "#f87171" }, // Light red - negative 
    Fearful: { color: "#3b82f6" }, // Blue - mixed/cautious
    Frustrated: { color: "#ea384c" }, // Bright red - negative
  };

  // Updated colors array for the pie chart cells with correct emotion colors
  const EMOTION_COLORS = {
    Confident: "#4ade80", // Green - positive
    Calm: "#a78bfa", // Purple - positive
    Satisfied: "#22d3ee", // Cyan - positive
    Excited: "#facc15", // Yellow - positive
    Nervous: "#fb923c", // Orange - caution
    Greedy: "#f87171", // Light red - negative 
    Fearful: "#3b82f6", // Blue - mixed/cautious
    Frustrated: "#ea384c", // Bright red - negative
  };

  // Function to render empty state for charts
  const renderEmptyState = (message: string) => (
    <div className="flex items-center justify-center h-full w-full">
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your trading dashboard...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="bg-red-100 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Short-term Trading Performance
        </div>
      </div>
      
      {/* Balance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InitialBalanceForm 
          initialBalance={initialBalance} 
          onSave={setInitialBalance} 
        />
        
        <Card className="border-l-4 border-l-primary h-full">
          <CardHeader className="pb-2">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.currentBalance >= initialBalance ? 'text-green-500' : 'text-red-500'}`}>
              <DollarSign className="mr-2 h-5 w-5" />
              ${metrics.currentBalance.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary h-full">
          <CardHeader className="pb-2">
            <CardDescription>Return</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.percentageReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.percentageReturn >= 0 ? (
                <ArrowUp className="mr-2 h-5 w-5" />
              ) : (
                <ArrowDown className="mr-2 h-5 w-5" />
              )}
              {metrics.percentageReturn.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Original metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Today's Trades</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <Timer className="mr-2 h-5 w-5 text-primary" />
              {metrics.totalTrades}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <CandlestickChart className="mr-2 h-5 w-5 text-primary" />
              {metrics.totalTrades ? metrics.winRate.toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Daily P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.totalProfitLoss > 0 ? 'text-green-500' : metrics.totalProfitLoss < 0 ? 'text-red-500' : ''}`}>
              <DollarSign className="mr-2 h-5 w-5" />
              {metrics.totalProfitLoss > 0 ? '+' : ''}
              ${metrics.totalProfitLoss.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Trade P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.avgProfitLoss > 0 ? 'text-green-500' : metrics.avgProfitLoss < 0 ? 'text-red-500' : ''}`}>
              {metrics.avgProfitLoss > 0 ? (
                <ArrowUp className="mr-2 h-5 w-5" />
              ) : metrics.avgProfitLoss < 0 ? (
                <ArrowDown className="mr-2 h-5 w-5" />
              ) : (
                <DollarSign className="mr-2 h-5 w-5" />
              )}
              ${Math.abs(metrics.avgProfitLoss).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <Card className="shadow-md hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 text-primary mr-2" />
                Account Balance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : metrics.plOverTime.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-muted-foreground text-center">No trade data available. Add trades to see your account balance trend.</p>
                  </div>
                ) : (
                  <ChartWrapper
                    title="Account Balance"
                    config={defaultChartConfig}
                    isEmpty={metrics.plOverTime.length === 0}
                    emptyMessage="No trade data available"
                  >
                    <ResponsiveContainer width="99%" height="99%">
                      <AreaChart 
                        data={metrics.plOverTime} 
                        margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11 }}
                          tickMargin={10}
                        />
                        <YAxis 
                          tick={{ fontSize: 11 }}
                          tickMargin={10}
                        />
                        <Tooltip />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{ paddingTop: 10 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          name="Account Balance"
                          stroke={metrics.totalProfitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                          fill={metrics.totalProfitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
        
        <ErrorBoundary>
          <Card className="shadow-md hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bolt className="h-5 w-5 text-primary mr-2" />
                Trading Mindset Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : metrics.emotionChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-muted-foreground text-center">No emotion data available. Add trades with emotions to see your mindset analysis.</p>
                  </div>
                ) : (
                  <ChartWrapper
                    title="Emotions Distribution"
                    config={chartConfig}
                    isEmpty={metrics.emotionChartData.length === 0}
                    emptyMessage="No emotion data available"
                  >
                    <ResponsiveContainer width="99%" height="99%">
                      <RechartPieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <Pie
                          data={metrics.emotionChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={95}
                          innerRadius={5}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={4}
                          strokeWidth={1}
                          stroke="#fff"
                        >
                          {metrics.emotionChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={EMOTION_COLORS[entry.name as keyof typeof EMOTION_COLORS] || "#9ca3af"} 
                            />
                          ))}
                        </Pie>
                      </RechartPieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
      
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-secondary/5 to-transparent mt-8 mb-10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bolt className="mr-2 h-5 w-5 text-primary" />
            Trading Insights
          </CardTitle>
          <CardDescription>
            Actionable insights to improve your trading performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {trades.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Best Performing Asset</h3>
                  <p className="text-sm">
                    <span className="text-lg font-bold">
                      {metrics.emotionChartData.length > 0 
                        ? trades.reduce((acc, trade) => {
                            if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                            acc[trade.asset].pl += trade.profitLoss;
                            return acc;
                          }, {} as Record<string, { asset: string, pl: number }>)
                          && Object.values(trades.reduce((acc, trade) => {
                            if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                            acc[trade.asset].pl += trade.profitLoss;
                            return acc;
                          }, {} as Record<string, { asset: string, pl: number }>))
                            .sort((a, b) => b.pl - a.pl)[0]?.asset || "No data"
                        : "No data"}
                    </span>
                    <br />
                    {metrics.emotionChartData.length > 0 
                      ? "Focus on short-term trades with this instrument for highest profit potential."
                      : "Add trades to see your best performing assets."}
                  </p>
                </div>
                
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Primary Trading Emotion</h3>
                  <p className="text-sm">
                    <span className="text-lg font-bold">
                      {metrics.emotionChartData.length > 0
                        ? metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name
                        : "No data"}
                    </span>
                    <br />
                    {metrics.emotionChartData.length > 0
                      ? "Pay attention to how this emotion affects your decision-making in fast markets."
                      : "Add trades with emotions to analyze your trading psychology."}
                  </p>
                </div>
                
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Suggested Action</h3>
                  <p className="text-sm">
                    {metrics.emotionChartData.length > 0 ? (
                      <>
                        Consider setting tighter stop losses on your
                        <span className="font-bold">
                          {" "}{trades.reduce((acc, trade) => {
                            if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                            acc[trade.asset].pl += trade.profitLoss;
                            return acc;
                          }, {} as Record<string, { asset: string, pl: number }>)
                          && Object.values(trades.reduce((acc, trade) => {
                            if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                            acc[trade.asset].pl += trade.profitLoss;
                            return acc;
                          }, {} as Record<string, { asset: string, pl: number }>))
                            .sort((a, b) => a.pl - b.pl)[0]?.asset || "underperforming assets"}{" "}
                        </span> 
                        trades to minimize drawdowns in volatile markets.
                      </>
                    ) : (
                      "Add trades to receive personalized trading suggestions."
                    )}
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Timer className="mr-2 h-4 w-4" />
                  Daily Trading Recommendation
                </h3>
                <p className="text-sm">
                  {metrics.emotionChartData.length > 0 ? (
                    <>
                      Based on your trading history, you perform best when trading {
                        trades.reduce((acc, trade) => {
                          if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                          acc[trade.asset].pl += trade.profitLoss;
                          return acc;
                        }, {} as Record<string, { asset: string, pl: number }>)
                        && Object.values(trades.reduce((acc, trade) => {
                          if (!acc[trade.asset]) acc[trade.asset] = { asset: trade.asset, pl: 0 };
                          acc[trade.asset].pl += trade.profitLoss;
                          return acc;
                        }, {} as Record<string, { asset: string, pl: number }>))
                          .sort((a, b) => b.pl - a.pl)[0]?.asset || "your best assets"
                      } with a {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name} mindset. 
                      Consider focusing on quick intraday opportunities rather than overnight positions for improved risk management.
                    </>
                  ) : (
                    "Start recording your trades to receive personalized recommendations based on your trading patterns."
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <h3 className="font-semibold mb-3">No Trading Data Available</h3>
              <p className="text-sm max-w-md mx-auto">
                Add your trading history to receive personalized insights and recommendations to improve your performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
