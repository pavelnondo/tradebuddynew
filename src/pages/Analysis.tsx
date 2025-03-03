
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { Activity, Coins, DollarSign, LineChart, ListFilter, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RechartPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  // Adding more sample trades for better analysis
  {
    id: "6",
    date: "2023-04-06T09:15:00Z",
    asset: "AMZN",
    tradeType: "Buy",
    entryPrice: 3200,
    exitPrice: 3250,
    positionSize: 1,
    profitLoss: 50,
    notes: "Technical bounce",
    emotion: "Confident",
  },
  {
    id: "7",
    date: "2023-04-07T13:45:00Z",
    asset: "ETH",
    tradeType: "Long",
    entryPrice: 1900,
    exitPrice: 2000,
    positionSize: 1.5,
    profitLoss: 150,
    notes: "Strong uptrend",
    emotion: "Excited",
  },
  {
    id: "8",
    date: "2023-04-08T10:00:00Z",
    asset: "TSLA",
    tradeType: "Short",
    entryPrice: 240,
    exitPrice: 230,
    positionSize: 3,
    profitLoss: 30,
    notes: "Overbought conditions",
    emotion: "Nervous",
  },
  {
    id: "9",
    date: "2023-04-09T16:30:00Z",
    asset: "BTC",
    tradeType: "Long",
    entryPrice: 29000,
    exitPrice: 28800,
    positionSize: 0.2,
    profitLoss: -40,
    notes: "False breakout",
    emotion: "Frustrated",
  },
  {
    id: "10",
    date: "2023-04-10T11:20:00Z",
    asset: "AAPL",
    tradeType: "Buy",
    entryPrice: 170,
    exitPrice: 175,
    positionSize: 7,
    profitLoss: 35,
    notes: "Support level bounce",
    emotion: "Calm",
  },
];

export default function Analysis() {
  // Calculate analysis data
  const analysisData = useMemo(() => {
    // Basic metrics
    const totalTrades = sampleTrades.length;
    const profitableTrades = sampleTrades.filter((trade) => trade.profitLoss > 0).length;
    const lossTrades = sampleTrades.filter((trade) => trade.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = sampleTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    // Advanced metrics
    const totalProfit = sampleTrades
      .filter((trade) => trade.profitLoss > 0)
      .reduce((sum, trade) => sum + trade.profitLoss, 0);
    
    const totalLoss = sampleTrades
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
    
    // Analysis by asset
    const assetPerformance = sampleTrades.reduce((acc, trade) => {
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
    const tradeTypePerformance = sampleTrades.reduce((acc, trade) => {
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
    const emotionPerformance = sampleTrades.reduce((acc, trade) => {
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
      },
      assetPerformance: assetPerformanceArray,
      tradeTypePerformance: tradeTypePerformanceArray,
      emotionPerformance: emotionPerformanceArray,
      winLossRatio,
    };
  }, []);
  
  // Color config for charts
  const chartConfig = {
    profit: { color: "hsl(143, 85%, 46%)" },
    loss: { color: "hsl(0, 84%, 60%)" },
    wins: { color: "#4ade80" },
    losses: { color: "#f87171" },
  };
  
  // COLORS for pie charts
  const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa", "#fb923c"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Performance Analysis</h1>
      
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
      
      {/* Win/Loss Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Win/Loss Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
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
                    <Legend />
                  </RechartPieChart>
                </ResponsiveContainer>
              </ChartContainer>
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
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData.assetPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
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
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData.emotionPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="winRate"
                      name="Win Rate (%)"
                      fill="#60a5fa"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
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
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData.tradeTypePerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Insights */}
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
                <strong>{analysisData.assetPerformance.sort((a, b) => b.profitLoss - a.profitLoss)[0].asset}</strong> is your most profitable asset with a total profit of $
                {analysisData.assetPerformance.sort((a, b) => b.profitLoss - a.profitLoss)[0].profitLoss.toFixed(2)} and a win rate of 
                {analysisData.assetPerformance.sort((a, b) => b.profitLoss - a.profitLoss)[0].winRate.toFixed(1)}%.
              </p>
            </div>
          )}
          
          {/* Most winning emotion */}
          {analysisData.emotionPerformance.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Emotion Impact</h3>
              <p className="text-sm">
                Trades where you felt <strong>{analysisData.emotionPerformance.sort((a, b) => b.winRate - a.winRate)[0].emotion}</strong> had the highest win rate at 
                {analysisData.emotionPerformance.sort((a, b) => b.winRate - a.winRate)[0].winRate.toFixed(1)}%. Consider what conditions lead to this emotional state.
              </p>
            </div>
          )}
          
          {/* Trade type analysis */}
          {analysisData.tradeTypePerformance.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Trade Type Analysis</h3>
              <p className="text-sm">
                <strong>{analysisData.tradeTypePerformance.sort((a, b) => b.winRate - a.winRate)[0].type}</strong> trades are your most successful with a win rate of 
                {analysisData.tradeTypePerformance.sort((a, b) => b.winRate - a.winRate)[0].winRate.toFixed(1)}%. You might want to focus more on this strategy.
              </p>
            </div>
          )}
          
          {/* Overall suggestion */}
          <div>
            <h3 className="font-semibold mb-1">Risk Management</h3>
            <p className="text-sm">
              Your risk-reward ratio is 1:{analysisData.metrics.riskRewardRatio.toFixed(2)}. 
              {analysisData.metrics.riskRewardRatio >= 1.5 
                ? "This is a healthy ratio. Keep maintaining this discipline." 
                : "Consider adjusting your strategy to aim for larger wins relative to your losses."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
