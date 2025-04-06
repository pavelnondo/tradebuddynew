
import { useState, useEffect } from "react";
import { Activity, Coins, DollarSign, LineChart, ListFilter, TrendingDown, TrendingUp } from "lucide-react";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { MetricsCard } from "@/components/metrics/MetricsCard";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { WinLossChart } from "@/components/charts/WinLossChart";
import { BarPerformanceChart } from "@/components/charts/BarPerformanceChart";
import { HourlyPerformanceChart } from "@/components/charts/HourlyPerformanceChart";
import { InsightsPanel } from "@/components/analysis/InsightsPanel";
import { useTradeAnalysis } from "@/hooks/useTradeAnalysis";
import { Loader2 } from "lucide-react";

export default function Analysis() {
  const [initialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const [trades, setTrades] = useState([]);
  const { fetchTrades, isLoading } = useSupabaseTrades();
  
  // Fetch trades from Supabase on component mount
  useEffect(() => {
    const loadTrades = async () => {
      const tradesData = await fetchTrades();
      setTrades(tradesData);
    };
    
    loadTrades();
  }, [fetchTrades]);
  
  // Calculate analysis data using our new hook
  const analysisData = useTradeAnalysis(trades, initialBalance);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your trading analysis...</p>
      </div>
    );
  }
  
  // Find best performing assets and insights
  const bestAsset = analysisData.assetPerformance.length > 0
    ? [...analysisData.assetPerformance].sort((a, b) => b.profitLoss - a.profitLoss)[0]
    : undefined;
    
  const worstAsset = analysisData.assetPerformance.length > 0
    ? [...analysisData.assetPerformance].filter(a => a.profitLoss < 0).sort((a, b) => a.profitLoss - b.profitLoss)[0]
    : undefined;
    
  const bestEmotion = analysisData.emotionPerformance.length > 0
    ? [...analysisData.emotionPerformance].sort((a, b) => b.winRate - a.winRate)[0]
    : undefined;
    
  const bestTradeType = analysisData.tradeTypePerformance.length > 0
    ? [...analysisData.tradeTypePerformance].sort((a, b) => b.profitLoss - a.profitLoss)[0]
    : undefined;
    
  const bestHour = analysisData.tradesByHour.length > 0
    ? [...analysisData.tradesByHour].sort((a, b) => b.winRate - a.winRate)[0]
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Performance Analysis</h1>
      
      {/* Empty state when no trades exist */}
      {trades.length === 0 ? (
        <div className="p-8 border rounded-lg">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">No Trading Data Available</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add your trading history to see detailed performance analysis, metrics, and insights to improve your trading strategy.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Account Balance and Drawdown Chart */}
          <div className="border rounded-lg p-4" style={{ height: "280px" }}>
            <BalanceChart data={analysisData.balanceOverTime} />
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard 
              title="Win Rate" 
              value={`${analysisData.metrics.winRate.toFixed(1)}%`} 
              icon={<TrendingUp className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Profit Factor" 
              value={analysisData.metrics.profitFactor.toFixed(2)} 
              icon={<Activity className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Avg. Win" 
              value={`$${analysisData.metrics.avgWin.toFixed(2)}`} 
              icon={<TrendingUp />}
              valueClassName="text-green-500"
            />
            
            <MetricsCard 
              title="Avg. Loss" 
              value={`$${analysisData.metrics.avgLoss.toFixed(2)}`} 
              icon={<TrendingDown />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Risk:Reward" 
              value={`1:${analysisData.metrics.riskRewardRatio.toFixed(2)}`} 
              icon={<ListFilter className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Max Drawdown" 
              value={`${analysisData.metrics.maxDrawdown.toFixed(2)}%`} 
              icon={<TrendingDown />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Total Profit" 
              value={`$${analysisData.metrics.totalProfit.toFixed(2)}`} 
              icon={<DollarSign />}
              valueClassName="text-green-500"
            />
            
            <MetricsCard 
              title="Total Loss" 
              value={`$${Math.abs(analysisData.metrics.totalLoss).toFixed(2)}`} 
              icon={<DollarSign />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Net P&L" 
              value={`$${analysisData.metrics.totalProfitLoss.toFixed(2)}`} 
              icon={<Coins />}
              valueClassName={analysisData.metrics.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}
            />
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Ratio */}
            <div className="border rounded-lg p-4" style={{ height: "280px" }}>
              <WinLossChart data={analysisData.winLossData} />
            </div>
            
            {/* Asset Performance */}
            <div className="border rounded-lg p-4" style={{ height: "280px" }}>
              <BarPerformanceChart 
                data={analysisData.assetPerformance}
                title="Asset Performance"
                dataKey="profitLoss"
                categoryKey="asset"
                nameKey="Profit/Loss"
                emptyMessage="No asset performance data available yet."
              />
            </div>
            
            {/* Emotions vs Win Rate */}
            <div className="border rounded-lg p-4" style={{ height: "280px" }}>
              <BarPerformanceChart 
                data={analysisData.emotionPerformance}
                title="Emotions vs Win Rate"
                dataKey="winRate"
                categoryKey="emotion"
                nameKey="Win Rate (%)"
                emptyMessage="No emotion data available yet."
              />
            </div>
            
            {/* Trade Type Performance */}
            <div className="border rounded-lg p-4" style={{ height: "280px" }}>
              <BarPerformanceChart 
                data={analysisData.tradeTypePerformance}
                title="Trade Type Performance"
                dataKey="profitLoss"
                categoryKey="type"
                nameKey="Profit/Loss"
                emptyMessage="No trade type performance data available yet."
              />
            </div>
            
            {/* Trading Hours Analysis */}
            <div className="border rounded-lg p-4" style={{ height: "280px" }}>
              <HourlyPerformanceChart data={analysisData.tradesByHour} />
            </div>
          </div>
          
          {/* Insights Section */}
          <InsightsPanel 
            bestAsset={bestAsset}
            worstAsset={worstAsset}
            bestEmotion={bestEmotion}
            bestTradeType={bestTradeType}
            bestHour={bestHour}
          />
        </>
      )}
    </div>
  );
}
