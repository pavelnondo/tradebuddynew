
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

// Sample data - in a real app, this would come from a database
const sampleTrades: Trade[] = [
  {
    id: "1",
    date: "2023-04-01T10:30:00Z",
    asset: "BTC",
    tradeType: "Long",
    entryPrice: 28000,
    exitPrice: 29000,
    positionSize: 0.5,
    profitLoss: 500,
    notes: "Strong breakout above resistance",
    emotion: "Confident",
  },
  {
    id: "2",
    date: "2023-04-02T14:15:00Z",
    asset: "AAPL",
    tradeType: "Short",
    entryPrice: 180,
    exitPrice: 175,
    positionSize: 10,
    profitLoss: 50,
    notes: "Earnings miss, quick in and out",
    emotion: "Nervous",
  },
  {
    id: "3",
    date: "2023-04-03T09:45:00Z",
    asset: "ETH",
    tradeType: "Long",
    entryPrice: 1800,
    exitPrice: 1750,
    positionSize: 2,
    profitLoss: -100,
    notes: "Failed breakout, stopped out",
    emotion: "Frustrated",
  },
  {
    id: "4",
    date: "2023-04-04T11:20:00Z",
    asset: "TSLA",
    tradeType: "Buy",
    entryPrice: 220,
    exitPrice: 235,
    positionSize: 5,
    profitLoss: 75,
    notes: "Strong momentum after news",
    emotion: "Excited",
  },
  {
    id: "5",
    date: "2023-04-05T15:30:00Z",
    asset: "BTC",
    tradeType: "Short",
    entryPrice: 30000,
    exitPrice: 29500,
    positionSize: 0.3,
    profitLoss: 150,
    notes: "Overbought conditions, short term reversal",
    emotion: "Calm",
  },
];

export default function Dashboard() {
  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTrades = sampleTrades.length;
    const profitableTrades = sampleTrades.filter((trade) => trade.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = sampleTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const avgProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;
    
    // Emotion data for pie chart
    const emotionData = sampleTrades.reduce((acc, trade) => {
      acc[trade.emotion] = (acc[trade.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionChartData = Object.entries(emotionData).map(([name, value]) => ({ name, value }));
    
    // Asset performance
    const assetPerformance = sampleTrades.reduce((acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = { asset: trade.asset, trades: 0, profitLoss: 0 };
      }
      acc[trade.asset].trades += 1;
      acc[trade.asset].profitLoss += trade.profitLoss;
      return acc;
    }, {} as Record<string, { asset: string; trades: number; profitLoss: number }>);
    
    const assetChartData = Object.values(assetPerformance);
    
    // P&L over time
    const plOverTime = sampleTrades
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
  }, []);

  // Color config for charts
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Short-term Trading Performance
        </div>
      </div>
      
      {/* Key Metrics - Updated with Trading-Focused Icons */}
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
              {metrics.winRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Daily P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <DollarSign className="mr-2 h-5 w-5" />
              {metrics.totalProfitLoss >= 0 ? '+' : ''}
              ${metrics.totalProfitLoss.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Trade P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.avgProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.avgProfitLoss >= 0 ? (
                <ArrowUp className="mr-2 h-5 w-5" />
              ) : (
                <ArrowDown className="mr-2 h-5 w-5" />
              )}
              ${Math.abs(metrics.avgProfitLoss).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Performance Charts - More Focused on Short-term Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Over Time */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-primary" />
              Intraday P&L Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
            </div>
          </CardContent>
        </Card>
        
        {/* Trading Mindset Analysis */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bolt className="mr-2 h-5 w-5 text-primary" />
              Trading Mindset Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Asset Performance - Now in its own row with more emphasis */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Instrument Performance
          </CardTitle>
          <CardDescription>Performance breakdown by trading instrument</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]"> {/* Increased height for better visibility */}
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.assetChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="asset" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar
                    dataKey="profitLoss"
                    name="Profit/Loss"
                    fill={chartConfig.profit.color}
                    radius={[4, 4, 0, 0]}
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
          </div>
        </CardContent>
      </Card>
      
      {/* Trade Insights - Redesigned with more focus on actionable trading advice */}
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-secondary/5 to-transparent">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold mb-2 text-primary">Best Performing Asset</h3>
              <p className="text-sm">
                <span className="text-lg font-bold">
                  {metrics.assetChartData.sort((a, b) => b.profitLoss - a.profitLoss)[0]?.asset || "N/A"}
                </span>
                <br />
                Focus on short-term trades with this instrument for highest profit potential.
              </p>
            </div>
            
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold mb-2 text-primary">Primary Trading Emotion</h3>
              <p className="text-sm">
                <span className="text-lg font-bold">
                  {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
                </span>
                <br />
                Pay attention to how this emotion affects your decision-making in fast markets.
              </p>
            </div>
            
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold mb-2 text-primary">Suggested Action</h3>
              <p className="text-sm">
                Consider setting tighter stop losses on your 
                <span className="font-bold">{" "}{metrics.assetChartData.sort((a, b) => a.profitLoss - b.profitLoss)[0]?.asset || "N/A"}{" "}</span> 
                trades to minimize drawdowns in volatile markets.
              </p>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Timer className="mr-2 h-4 w-4" />
              Daily Trading Recommendation
            </h3>
            <p className="text-sm">
              Based on your trading history, you perform best when trading {metrics.assetChartData.sort((a, b) => b.profitLoss - a.profitLoss)[0]?.asset || "top assets"} with a {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name || "balanced"} mindset. 
              Consider focusing on quick intraday opportunities rather than overnight positions for improved risk management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
