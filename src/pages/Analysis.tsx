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
import { ChartContainer } from '@/components/ChartContainer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TradeCalendar } from '@/components/charts/TradeCalendar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  console.log('Rendering Analysis page');
  const [initialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  
  console.log('Calling useTradeAnalysis');
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
  
  // Debug logging for analysisData and chart props
  console.log('analysisData:', analysisData);
  console.log('balanceOverTime:', analysisData.balanceOverTime);
  console.log('metrics:', analysisData.metrics);
  console.log('assetPerformance:', analysisData.assetPerformance);
  console.log('emotionPerformance:', analysisData.emotionPerformance);
  console.log('tradeTypePerformance:', analysisData.tradeTypePerformance);
  console.log('tradesByHour:', analysisData.tradesByHour);

  // Prepare chart props for logging
  const winLossChartProps = {
    wins: analysisData.metrics?.profitableTrades ?? 0,
    losses: analysisData.metrics?.lossTrades ?? 0,
    totalTrades: analysisData.metrics?.totalTrades ?? 0,
    winRate: typeof analysisData.metrics?.winRate === 'number' ? analysisData.metrics.winRate : 0,
  };
  console.log('BalanceChart props:', analysisData.balanceOverTime);
  console.log('WinLossChart props:', winLossChartProps);
  console.log('BarPerformanceChart props:', analysisData.assetPerformance);
  console.log('EmotionsWinRateChart props:', analysisData.emotionPerformance);
  console.log('TradeTypePerformanceChart props:', analysisData.tradeTypePerformance);
  console.log('BestTradingHoursChart props:', analysisData.tradesByHour);

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
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
            <TabsContent value="charts">
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
            <div className="bg-card rounded-lg shadow-md p-6 h-[400px]">
              <h3 className="text-lg font-semibold text-left mb-4">Balance Over Time</h3>
              <BalanceChart balanceOverTime={analysisData.balanceOverTime || []} />
            </div>
            {/* Removed Win/Loss Ratio chart */}
            <div className="bg-card rounded-lg shadow-md p-6 h-[400px]">
              <h3 className="text-lg font-semibold text-left mb-4">Asset Performance</h3>
              <BarPerformanceChart data={analysisData.assetPerformance || []} />
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 h-[400px]">
              <h3 className="text-lg font-semibold text-left mb-4">Emotions vs Win Rate</h3>
              <EmotionsWinRateChart data={analysisData.emotionPerformance || []} />
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 h-[400px]">
              <h3 className="text-lg font-semibold text-left mb-4">Trade Type Performance</h3>
              <TradeTypePerformanceChart data={analysisData.tradeTypePerformance || []} />
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 h-[400px]">
              <h3 className="text-lg font-semibold text-left mb-4">Best Trading Hours</h3>
              <BestTradingHoursChart data={analysisData.tradesByHour || []} />
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
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
