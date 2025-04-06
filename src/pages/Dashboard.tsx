
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, BarChart3, CandlestickChart, DollarSign, Bolt, Loader2, Timer } from "lucide-react";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { InitialBalanceControl } from "@/components/forms/InitialBalanceControl";
import { MetricsCard } from "@/components/metrics/MetricsCard";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { useTradeAnalysis } from "@/hooks/useTradeAnalysis";
import {
  Cell,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const [trades, setTrades] = useState([]);
  const { fetchTrades, isLoading, error } = useSupabaseTrades();
  
  // Fetch trades from Supabase on component mount
  useEffect(() => {
    const loadTrades = async () => {
      const tradesData = await fetchTrades();
      setTrades(tradesData);
    };
    
    loadTrades();
  }, [fetchTrades]);
  
  // Calculate analysis data using our hook
  const analysisData = useTradeAnalysis(trades, initialBalance);
  
  // Function to update initial balance
  const handleInitialBalanceChange = (newBalance: number) => {
    setInitialBalance(newBalance);
    localStorage.setItem('initialTradingBalance', newBalance.toString());
  };

  // Updated emotion colors with correct mapping
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

  // Find best performing assets and emotions for insights
  const bestAsset = analysisData.assetPerformance.length > 0
    ? [...analysisData.assetPerformance].sort((a, b) => b.profitLoss - a.profitLoss)[0]
    : null;

  const primaryEmotion = analysisData.emotionPerformance.length > 0
    ? [...analysisData.emotionPerformance].sort((a, b) => b.trades - a.trades)[0]
    : null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Short-term Trading Performance
        </div>
      </div>
      
      {/* Balance Section */}
      <InitialBalanceControl 
        initialBalance={initialBalance}
        onBalanceChange={handleInitialBalanceChange}
        currentBalance={analysisData.metrics.currentBalance}
        percentageReturn={analysisData.metrics.percentageReturn}
      />
      
      {/* Quick Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Today's Trades</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <Timer className="mr-2 h-5 w-5 text-primary" />
              {analysisData.metrics.totalTrades}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              <CandlestickChart className="mr-2 h-5 w-5 text-primary" />
              {analysisData.metrics.totalTrades ? analysisData.metrics.winRate.toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Daily P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${analysisData.metrics.totalProfitLoss > 0 ? 'text-green-500' : analysisData.metrics.totalProfitLoss < 0 ? 'text-red-500' : ''}`}>
              <DollarSign className="mr-2 h-5 w-5" />
              {analysisData.metrics.totalProfitLoss > 0 ? '+' : ''}
              ${analysisData.metrics.totalProfitLoss.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Trade P&L</CardDescription>
            <CardTitle className={`text-2xl flex items-center ${analysisData.metrics.avgWin > 0 ? 'text-green-500' : analysisData.metrics.avgWin < 0 ? 'text-red-500' : ''}`}>
              {analysisData.metrics.avgWin > 0 ? (
                <ArrowUp className="mr-2 h-5 w-5" />
              ) : analysisData.metrics.avgWin < 0 ? (
                <ArrowDown className="mr-2 h-5 w-5" />
              ) : (
                <DollarSign className="mr-2 h-5 w-5" />
              )}
              ${Math.abs(analysisData.metrics.avgWin).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Chart */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary mr-2" />
              Account Balance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3 lg:p-4 h-[300px]">
            <BalanceChart data={analysisData.balanceOverTime} isEmpty={analysisData.balanceOverTime.length === 0} />
          </CardContent>
        </Card>
        
        {/* Emotions Chart */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bolt className="h-5 w-5 text-primary mr-2" />
              Trading Mindset Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3 lg:p-4 h-[300px]">
            {analysisData.emotionPerformance.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-muted-foreground text-center">No emotion data available. Add trades with emotions to see your mindset analysis.</p>
              </div>
            ) : (
              <ResponsiveContainer width="99%" height="99%">
                <RechartPieChart>
                  <Pie
                    data={analysisData.emotionPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={5}
                    fill="#8884d8"
                    dataKey="trades"
                    nameKey="emotion"
                    paddingAngle={4}
                    strokeWidth={1}
                    stroke="#fff"
                    label={({ emotion, percent }) => `${emotion}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analysisData.emotionPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={EMOTION_COLORS[entry.emotion] || "#9ca3af"} 
                      />
                    ))}
                  </Pie>
                </RechartPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Trading Insights Card */}
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
                      {bestAsset ? bestAsset.asset : "No data"}
                    </span>
                    <br />
                    {bestAsset 
                      ? "Focus on short-term trades with this instrument for highest profit potential."
                      : "Add trades to see your best performing assets."}
                  </p>
                </div>
                
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Primary Trading Emotion</h3>
                  <p className="text-sm">
                    <span className="text-lg font-bold">
                      {primaryEmotion ? primaryEmotion.emotion : "No data"}
                    </span>
                    <br />
                    {primaryEmotion
                      ? "Pay attention to how this emotion affects your decision-making in fast markets."
                      : "Add trades with emotions to analyze your trading psychology."}
                  </p>
                </div>
                
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2 text-primary">Suggested Action</h3>
                  <p className="text-sm">
                    {analysisData.assetPerformance.length > 0 ? (
                      <>
                        Consider setting tighter stop losses on your
                        <span className="font-bold">
                          {" "}{analysisData.assetPerformance
                            .filter(a => a.profitLoss < 0)
                            .sort((a, b) => a.profitLoss - b.profitLoss)[0]?.asset || "underperforming assets"}{" "}
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
                  {analysisData.assetPerformance.length > 0 ? (
                    <>
                      Based on your trading history, you perform best when trading {bestAsset?.asset || "your best assets"} 
                      with a {primaryEmotion?.emotion || "focused"} mindset. 
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
