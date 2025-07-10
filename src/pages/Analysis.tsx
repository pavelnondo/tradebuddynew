import { useState, useEffect } from "react";
import { Activity, Coins, DollarSign, LineChart, ListFilter, TrendingDown, TrendingUp } from "lucide-react";
import { MetricsCard } from "@/components/metrics/MetricsCard";
import { HourlyPerformanceChart } from "@/components/charts/HourlyPerformanceChart";
import { InsightsPanel } from "@/components/analysis/InsightsPanel";
import { useTradeAnalysis } from "@/hooks/useTradeAnalysis";
import { Loader2 } from "lucide-react";
import { useApiTrades } from '@/hooks/useApiTrades';
import { GraphSection } from "@/components/GraphSection";
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
import { BalanceChart } from '@/components/charts/BalanceChart';
import { WinLossChart } from '@/components/charts/WinLossChart';
import { BarPerformanceChart } from '@/components/charts/BarPerformanceChart';
import { EmotionsWinRateChart } from '@/components/charts/EmotionsWinRateChart';
import { TradeTypePerformanceChart } from '@/components/charts/TradeTypePerformanceChart';
import { BestTradingHoursChart } from '@/components/charts/BestTradingHoursChart';

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ height: 320, minWidth: 0, flex: 1, border: '2px solid #e0e0e0', borderRadius: 8, padding: 10, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
      <h3 style={{ marginBottom: 8, fontSize: 16 }}>{title}</h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

// Sample data
const barData = {
  labels: ['A', 'B', 'C'],
  datasets: [{ label: 'Sample', data: [12, 19, 3], backgroundColor: '#4ade80' }],
};
const doughnutData = {
  labels: ['X', 'Y'],
  datasets: [{ data: [60, 40], backgroundColor: ['#4ade80', '#f87171'] }],
};

export default function Analysis() {
  const [initialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard 
              title="Win Rate" 
              value={`${typeof analysisData.metrics.winRate === 'number' ? analysisData.metrics.winRate.toFixed(1) : '0.0'}%`} 
              icon={<TrendingUp className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Profit Factor" 
              value={typeof analysisData.metrics.profitFactor === 'number' ? analysisData.metrics.profitFactor.toFixed(2) : '0.00'} 
              icon={<Activity className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Avg. Win" 
              value={`$${typeof analysisData.metrics.avgWin === 'number' ? analysisData.metrics.avgWin.toFixed(2) : '0.00'}`} 
              icon={<TrendingUp />}
              valueClassName="text-green-500"
            />
            
            <MetricsCard 
              title="Avg. Loss" 
              value={`$${typeof analysisData.metrics.avgLoss === 'number' ? analysisData.metrics.avgLoss.toFixed(2) : '0.00'}`} 
              icon={<TrendingDown />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Risk:Reward" 
              value={`1:${typeof analysisData.metrics.riskRewardRatio === 'number' ? analysisData.metrics.riskRewardRatio.toFixed(2) : '0.00'}`} 
              icon={<ListFilter className="text-muted-foreground" />} 
            />
            
            <MetricsCard 
              title="Max Drawdown" 
              value={`${typeof analysisData.metrics.maxDrawdown === 'number' ? analysisData.metrics.maxDrawdown.toFixed(2) : '0.00'}%`} 
              icon={<TrendingDown />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Total Profit" 
              value={`$${typeof analysisData.metrics.totalProfit === 'number' ? analysisData.metrics.totalProfit.toFixed(2) : '0.00'}`} 
              icon={<DollarSign />}
              valueClassName="text-green-500"
            />
            
            <MetricsCard 
              title="Total Loss" 
              value={`$${typeof analysisData.metrics.totalLoss === 'number' ? Math.abs(analysisData.metrics.totalLoss).toFixed(2) : '0.00'}`} 
              icon={<DollarSign />}
              valueClassName="text-red-500"
            />
            
            <MetricsCard 
              title="Net P&L" 
              value={`$${typeof analysisData.metrics.totalProfitLoss === 'number' ? analysisData.metrics.totalProfitLoss.toFixed(2) : '0.00'}`} 
              icon={<Coins />}
              valueClassName={analysisData.metrics.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}
            />
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartContainer title="Balance Over Time">
              <BalanceChart balanceOverTime={analysisData.balanceOverTime} />
            </ChartContainer>
            <ChartContainer title="Win/Loss Ratio">
              <WinLossChart wins={analysisData.metrics.profitableTrades} losses={analysisData.metrics.lossTrades} />
            </ChartContainer>
            <ChartContainer title="Asset Performance">
              <BarPerformanceChart data={analysisData.assetPerformance} />
            </ChartContainer>
            <ChartContainer title="Emotions vs Win Rate">
              <EmotionsWinRateChart data={analysisData.emotionPerformance} />
            </ChartContainer>
            <ChartContainer title="Trade Type Performance">
              <TradeTypePerformanceChart data={analysisData.tradeTypePerformance} />
            </ChartContainer>
            <ChartContainer title="Best Trading Hours">
              <BestTradingHoursChart data={analysisData.tradesByHour} />
            </ChartContainer>
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
