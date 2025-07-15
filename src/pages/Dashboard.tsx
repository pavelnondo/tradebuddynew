import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, BarChart3, CandlestickChart, DollarSign, Bolt, Loader2, Timer } from "lucide-react";
import { InitialBalanceControl } from "@/components/forms/InitialBalanceControl";
import { MetricsCard } from "@/components/metrics/MetricsCard";
import { useTradeAnalysis } from "@/hooks/useTradeAnalysis";
import {
  Cell,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
} from "recharts";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useNavigate } from 'react-router-dom';
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
import { BalanceChart } from '@/components/charts/BalanceChart';
import { WinLossChart } from '@/components/charts/WinLossChart';
import { BarPerformanceChart } from '@/components/charts/BarPerformanceChart';
import { EmotionsWinRateChart } from '@/components/charts/EmotionsWinRateChart';
import { TradeTypePerformanceChart } from '@/components/charts/TradeTypePerformanceChart';
import { BestTradingHoursChart } from '@/components/charts/BestTradingHoursChart';
import { ChartContainer } from '@/components/ChartContainer';
import { TradeWinPieChart } from '@/components/charts/TradeWinPieChart';
import { EmotionPieChart } from '@/components/charts/EmotionPieChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Sample data
const barData = {
  labels: ['A', 'B', 'C'],
  datasets: [{ label: 'Sample', data: [12, 19, 3], backgroundColor: '#4ade80' }],
};
const doughnutData = {
  labels: ['X', 'Y'],
  datasets: [{ data: [60, 40], backgroundColor: ['#4ade80', '#f87171'] }],
};

export default function Dashboard() {
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('initialTradingBalance');
    return savedBalance ? parseFloat(savedBalance) : 10000; // Default to 10,000 if not set
  });
  
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  
  const navigate = useNavigate();
  
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
      {/* Balance Overview Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Trading Dashboard</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 text-muted-foreground">
            <span className="bg-muted px-3 py-1 rounded-full text-sm">Initial Balance: <span className="font-semibold text-primary">${initialBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
            <span className="bg-muted px-3 py-1 rounded-full text-sm">Current Balance: <span className="font-semibold text-green-600">${typeof analysisData.metrics.currentBalance === 'number' ? analysisData.metrics.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span></span>
          </div>
        </div>
        <button
          className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition"
          onClick={() => navigate('/add-trade')}
        >
          + Add Trade
        </button>
      </div>
      
      {/* InitialBalanceControl Section (keep for editing initial balance) */}
      <InitialBalanceControl 
        initialBalance={initialBalance}
        onBalanceChange={handleInitialBalanceChange}
        currentBalance={analysisData.metrics.currentBalance}
        percentageReturn={analysisData.metrics.percentageReturn}
      />
      
      {/* Quick Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Today's Trades"
          value={analysisData.metrics.totalTrades}
          icon={<Timer className="text-primary" />}
        />
        <MetricsCard
          title="Win Rate"
          value={analysisData.metrics.totalTrades ? (typeof analysisData.metrics.winRate === 'number' ? analysisData.metrics.winRate.toFixed(1) : '0.0') + '%' : '0%'}
          icon={<CandlestickChart className="text-primary" />}
        />
        <MetricsCard
          title="Daily P&L"
          value={`${analysisData.metrics.totalProfitLoss > 0 ? '+' : ''}$${typeof analysisData.metrics.totalProfitLoss === 'number' ? analysisData.metrics.totalProfitLoss.toFixed(2) : '0.00'}`}
          icon={<DollarSign />}
          valueClassName={analysisData.metrics.totalProfitLoss > 0 ? 'text-green-500' : analysisData.metrics.totalProfitLoss < 0 ? 'text-red-500' : ''}
        />
        <MetricsCard
          title="Avg. Trade P&L"
          value={`$${typeof analysisData.metrics.avgWin === 'number' ? Math.abs(analysisData.metrics.avgWin).toFixed(2) : '0.00'}`}
          icon={analysisData.metrics.avgWin > 0 ? <ArrowUp /> : analysisData.metrics.avgWin < 0 ? <ArrowDown /> : <DollarSign />}
          valueClassName={analysisData.metrics.avgWin > 0 ? 'text-green-500' : analysisData.metrics.avgWin < 0 ? 'text-red-500' : ''}
        />
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Win % Pie/Donut Chart */}
        <Card className="flex flex-col items-center justify-center p-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Trade Win %</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <TradeWinPieChart
              winRate={typeof analysisData.metrics.winRate === 'number' ? analysisData.metrics.winRate : 0}
              winCount={analysisData.metrics.profitableTrades}
              lossCount={analysisData.metrics.lossTrades}
              totalTrades={analysisData.metrics.totalTrades}
            />
          </CardContent>
        </Card>
        {/* Emotion Pie/Donut Chart (to be restyled) */}
        <Card className="flex flex-col items-center justify-center p-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Emotional Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <EmotionPieChart data={analysisData.emotionPerformance} />
          </CardContent>
        </Card>
      </div>
      
      {/* Trading Insights Card */}
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-secondary/5 to-transparent mt-8">
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
