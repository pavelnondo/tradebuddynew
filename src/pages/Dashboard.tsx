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
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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
          <h1 className="text-3xl font-bold mb-1">Dashboard Overview</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 text-muted-foreground">
            <span className="bg-muted px-3 py-1 rounded-full text-sm">Initial Balance: <span className="font-semibold text-primary">${initialBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
            <span className="bg-muted px-3 py-1 rounded-full text-sm">Current Balance: <span className="font-semibold text-green-600">${typeof analysisData.metrics.currentBalance === 'number' ? analysisData.metrics.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span></span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            onClick={() => navigate('/add-trade')}
          >
            <span className="mr-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></span> Add Trade
          </button>
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center"
            onClick={() => navigate('/settings')}
          >
            <span className="mr-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg></span> Settings
          </button>
        </div>
      </div>
      {/* InitialBalanceControl Section (keep for editing initial balance) */}
      <InitialBalanceControl 
        initialBalance={initialBalance}
        onBalanceChange={handleInitialBalanceChange}
        currentBalance={analysisData.metrics.currentBalance}
        percentageReturn={analysisData.metrics.percentageReturn}
      />
      {/* Quick Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Profit</p>
              <h3 className="text-2xl font-bold text-green-600">${typeof analysisData.metrics.totalProfitLoss === 'number' ? analysisData.metrics.totalProfitLoss.toFixed(2) : '0.00'}</h3>
            </div>
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">+12.5% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Win Rate</p>
              <h3 className="text-2xl font-bold text-blue-600">{analysisData.metrics.totalTrades ? (typeof analysisData.metrics.winRate === 'number' ? analysisData.metrics.winRate.toFixed(1) : '0.0') : 0}%</h3>
            </div>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">+5% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Trades</p>
              <h3 className="text-2xl font-bold">{analysisData.metrics.totalTrades}</h3>
            </div>
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">32 this month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Risk/Reward</p>
              <h3 className="text-2xl font-bold">1:2.4</h3>
            </div>
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Consistent ratio</p>
        </div>
      </div>
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Balance Over Time</h3>
          <div className="chart-container" style={{height: 300}}>
            <BalanceChart balanceOverTime={analysisData.balanceOverTime} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Trade Distribution</h3>
          <div className="chart-container" style={{height: 300}}>
            <TradeTypePerformanceChart data={analysisData.tradeTypePerformance} />
          </div>
        </div>
      </div>
      {/* Quick Actions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades (placeholder for now) */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Trades</h2>
            <button className="text-blue-600 dark:text-blue-400 hover:underline">View All</button>
          </div>
          {/* TODO: Add recent trades table here */}
        </div>
        {/* Quick Actions & Insights */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <button className="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Add New Trade
              </button>
              <button className="w-full mb-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg> Import Trades
              </button>
              <button className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg> Export Data
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Trading Insights</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              {/* Insights content as before */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-2">Best Performing Instrument</h3>
                <p className="text-green-600 font-semibold">{bestAsset ? bestAsset.asset : "AAPL"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average profit: $245 per trade</p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-2">Most Profitable Time</h3>
                <p className="text-green-600 font-semibold">10:00 AM - 12:00 PM</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">72% win rate during this period</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Recent Achievement</h3>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                  </div>
                  <div>
                    <p className="font-semibold">5 Winning Streak</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed on May 15</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
