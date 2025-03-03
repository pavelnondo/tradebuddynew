import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { ArrowDown, ArrowUp, BarChart3, Clock, DollarSign, LineChart, PieChart } from "lucide-react";
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
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
              {metrics.totalTrades}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
              {metrics.winRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <DollarSign className="mr-2 h-5 w-5" />
              {metrics.totalProfitLoss >= 0 ? '+' : ''}
              ${metrics.totalProfitLoss.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. P&L per Trade</CardDescription>
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
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              P&L Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.plOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
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
        
        {/* Emotion Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Emotion Analysis
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
      
      {/* Asset Performance - Now in its own row */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Asset Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.assetChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
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
      
      {/* Insights - Now in its own row */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>Best Performing Asset:</strong>{" "}
            {metrics.assetChartData.sort((a, b) => b.profitLoss - a.profitLoss)[0]?.asset || "N/A"}
          </p>
          <p>
            <strong>Most Frequent Emotion:</strong>{" "}
            {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
          </p>
          <p>
            <strong>Suggested Improvement:</strong> Consider analyzing why your trades with the emotion "
            {metrics.emotionChartData.sort((a, b) => b.value - a.value)[0]?.name || "Confident"}" are more frequent. 
            Is this helping or hurting your performance?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
