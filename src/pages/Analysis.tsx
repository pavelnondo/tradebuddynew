
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { Activity, Coins, DollarSign, LineChart, ListFilter, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RechartPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export default function Analysis() {
  // Get actual trades from localStorage instead of sample data
  const trades = useMemo(() => {
    return JSON.parse(localStorage.getItem('trades') || '[]') as Trade[];
  }, []);

  // Calculate analysis data
  const analysisData = useMemo(() => {
    // Basic metrics
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((trade) => trade.profitLoss > 0).length;
    const lossTrades = trades.filter((trade) => trade.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    
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
  }, [trades]);
  
  // Color config for charts
  const chartConfig = {
    profit: { color: "hsl(143, 85%, 46%)" },
    loss: { color: "hsl(0, 84%, 60%)" },
    wins: { color: "#4ade80" },
    losses: { color: "#f87171" },
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
          
          {/* Win/Loss Ratio and Asset Performance */}
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
                  {analysisData.winLossRatio[0].value > 0 || analysisData.winLossRatio[1].value > 0 ? (
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
                  ) : (
                    renderEmptyState("No win/loss data available yet.")
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
                  ) : (
                    renderEmptyState("No asset performance data available yet.")
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
                  ) : (
                    renderEmptyState("No emotion data available yet.")
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
                  ) : (
                    renderEmptyState("No trade type performance data available yet.")
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
          )}
        </>
      )}
    </div>
  );
}
