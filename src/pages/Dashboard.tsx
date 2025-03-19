import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { ArrowDown, ArrowUp, BarChart3, Clock, DollarSign, LineChart, PieChart, Timer, CandlestickChart, Bolt } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export default function Dashboard() {
  // Get actual trades from localStorage instead of using sample data
  const trades = useMemo(() => {
    return JSON.parse(localStorage.getItem('trades') || '[]') as Trade[];
  }, []);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((trade) => trade.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const avgProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;
    
    const emotionData = trades.reduce((acc, trade) => {
      acc[trade.emotion] = (acc[trade.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionChartData = Object.entries(emotionData).map(([name, value]) => ({ name, value }));
    
    const assetPerformance = trades.reduce((acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = { asset: trade.asset, trades: 0, profitLoss: 0 };
      }
      acc[trade.asset].trades += 1;
      acc[trade.asset].profitLoss += trade.profitLoss;
      return acc;
    }, {} as Record<string, { asset: string; trades: number; profitLoss: number }>);
    
    const assetChartData = Object.values(assetPerformance);
    
    const plOverTime = trades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, trade, index) => {
        const date = new Date(trade.date).toLocaleDateString();
        const prevValue = index > 0 ? acc[index - 1].cumulative : 0;
        acc.push({
          date,
          value: trade.profitLoss,
          cumulative: prevValue + trade.profitLoss,
        });
        return acc;
      }, [] as { date: string; value: number; cumulative: number }[]);
    
    return {
      totalTrades,
      profitableTrades,
      winRate,
      totalProfitLoss,
      avgProfitLoss,
      emotionChartData,
      assetChartData,
      plOverTime,
    };
  }, [trades]);

  const chartConfig = {
    profit: { color: "hsl(143, 85%, 46%)" },
    loss: { color: "hsl(0, 84%, 60%)" },
    confident: { color: "#4ade80" },
    nervous: { color: "#fb923c" },
    greedy: { color: "#f87171" },
    fearful: { color: "#60a5fa" },
    calm: { color: "#a78bfa" },
    excited: { color: "#facc15" },
    frustrated: { color: "#f43f5e" },
    satisfied: { color: "#22d3ee" },
  };

  const COLORS = ["#4ade80", "#fb923c", "#f87171", "#60a5fa", "#a78bfa", "#facc15"];

  // Function to render empty state for charts
  const renderEmptyState = (message: string) => (
    <div className="flex items-center justify-center h-full w-full">
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Short-term Trading Performance
        </div>
      </div>
      
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
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-primary" />
              Intraday P&L Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.plOverTime.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.plOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        name="Cumulative P&L"
                        stroke={metrics.totalProfitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                        fill={metrics.totalProfitLoss >= 0 ? chartConfig.profit.color : chartConfig.loss.color}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                renderEmptyState("No trade data available. Add trades to see your P&L trend.")
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bolt className="mr-2 h-5 w-5 text-primary" />
              Trading Mindset Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.emotionChartData.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={metrics.emotionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {metrics.emotionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                renderEmptyState("No emotion data available. Add trades with emotions to see your mindset analysis.")
              )}
            </div>
          </CardContent>
        </Card>
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
                      {metrics.assetChartData.length > 0 
                        ? metrics.assetChartData.sort((a, b) => b.profitLoss - a.profitLoss)[0]?.asset 
                        : "No data"}
                    </span>
                    <br />
                    {metrics.assetChartData.length > 0 
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
                    {metrics.assetChartData.length > 0 ? (
                      <>
                        Consider setting tighter stop losses on your
                        <span className="font-bold">
                          {" "}{metrics.assetChartData.sort((a, b) => a.profitLoss - b.profitLoss)[0]?.asset}{" "}
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
                  {metrics.assetChartData.length > 0 && metrics.emotionChartData.length > 0 ? (
                    <>
                      Based on your trading history, you perform best when trading {metrics.assetChartData.sort((a, b) => b.profitLoss - a.profitLoss)[0]?.asset} with a {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name} mindset. 
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
      
      {/* Instrument Performance Section - Moved to bottom of page */}
      <Card className="shadow-md hover:shadow-lg transition-shadow mt-10 mb-10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Instrument Performance
          </CardTitle>
          <CardDescription>Performance breakdown by trading instrument</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {metrics.assetChartData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={metrics.assetChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barSize={25}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="asset" 
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      padding={{ bottom: 20, top: 20 }}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ bottom: 5 }} />
                    <Bar
                      dataKey="profitLoss"
                      name="Profit/Loss"
                      fill={chartConfig.profit.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      {metrics.assetChartData.map((entry, index) => (
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
              renderEmptyState("No asset performance data available. Add trades to see instrument performance.")
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
