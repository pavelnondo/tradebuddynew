import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { PsychologyDashboard } from '@/components/charts/PsychologyDashboard';

export default function Psychology() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();

  const filteredTrades = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    let filtered = trades;

    if (timeframe !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (timeframe) {
        case "week": cutoff.setDate(now.getDate() - 7); break;
        case "month": cutoff.setMonth(now.getMonth() - 1); break;
        case "quarter": cutoff.setMonth(now.getMonth() - 3); break;
        case "year": cutoff.setFullYear(now.getFullYear() - 1); break;
      }
      filtered = filtered.filter(trade => new Date(trade.date) >= cutoff);
    }

    if (selectedAsset !== "all") {
      filtered = filtered.filter(trade => trade.asset === selectedAsset);
    }

    return filtered;
  }, [trades, timeframe, selectedAsset]);

  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    const assets = [...new Set(trades.map(t => t.asset))];
    return assets.sort();
  }, [trades]);

  const psychologyData = useMemo(() => {
    if (!Array.isArray(filteredTrades) || filteredTrades.length === 0) {
      return {
        emotionTrends: [],
        emotionPerformance: [],
        confidenceAnalysis: [],
        stressIndicators: {
          consecutiveLosses: 0,
          recentDrawdown: 0,
          emotionalVolatility: 0,
          overtradingScore: 0,
        },
      };
    }

    const emotionTrends = filteredTrades.map(trade => ({
      date: typeof trade.date === 'string' ? trade.date : new Date(trade.date).toISOString(),
      emotion: trade.emotion || 'neutral',
      confidence: trade.confidenceLevel || 5,
      profitLoss: trade.profitLoss || 0,
    }));

    const emotionStats = new Map();
    
    filteredTrades.forEach(trade => {
      const emotion = trade.emotion || 'neutral';
      
      if (!emotionStats.has(emotion)) {
        emotionStats.set(emotion, {
          totalPnL: 0,
          winCount: 0,
          totalCount: 0,
          totalConfidence: 0,
        });
      }
      const stats = emotionStats.get(emotion);
      stats.totalPnL += trade.profitLoss || 0;
      stats.totalCount += 1;
      stats.totalConfidence += trade.confidenceLevel || 5;
      if ((trade.profitLoss || 0) >= 0) stats.winCount += 1;
    });

    const emotionPerformance = Array.from(emotionStats.entries()).map(([emotion, stats]) => ({
      emotion,
      avgProfitLoss: stats.totalPnL / stats.totalCount,
      winRate: (stats.winCount / stats.totalCount) * 100,
      tradeCount: stats.totalCount,
      avgConfidence: stats.totalConfidence / stats.totalCount,
    }));

    const confidenceRanges = [
      { range: '1-3', min: 1, max: 3 },
      { range: '4-6', min: 4, max: 6 },
      { range: '7-8', min: 7, max: 8 },
      { range: '9-10', min: 9, max: 10 },
    ];

    const confidenceAnalysis = confidenceRanges.map(range => {
      const rangeTrades = filteredTrades.filter(trade => {
        const confidence = trade.confidenceLevel || 5;
        return confidence >= range.min && confidence <= range.max;
      });

      const totalPnL = rangeTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
      const winCount = rangeTrades.filter(trade => (trade.profitLoss || 0) >= 0).length;

      return {
        confidenceRange: range.range,
        avgProfitLoss: rangeTrades.length > 0 ? totalPnL / rangeTrades.length : 0,
        winRate: rangeTrades.length > 0 ? (winCount / rangeTrades.length) * 100 : 0,
        tradeCount: rangeTrades.length,
      };
    });

    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;
    let recentLosses = 0;
    let emotionalVolatility = 0;
    let overtradingScore = 0;

    for (let i = filteredTrades.length - 1; i >= 0; i--) {
      if ((filteredTrades[i].profitLoss || 0) < 0) {
        consecutiveLosses++;
        if (i >= filteredTrades.length - 5) recentLosses++;
      } else {
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
        consecutiveLosses = 0;
      }
    }
    maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);

    const emotions = filteredTrades.map(t => t.emotion || 'neutral');
    const emotionCounts = new Map();
    emotions.forEach(emotion => {
      emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
    });
    const emotionVariance = Array.from(emotionCounts.values()).reduce((sum, count) => {
      const mean = emotions.length / emotionCounts.size;
      return sum + Math.pow(count - mean, 2);
    }, 0) / emotions.length;
    emotionalVolatility = Math.sqrt(emotionVariance);

    const recentTrades = filteredTrades.slice(-10);
    const recentLossRate = recentTrades.filter(t => (t.profitLoss || 0) < 0).length / recentTrades.length;
    const recentActivity = recentTrades.length;
    overtradingScore = (recentLossRate * 5) + (recentActivity > 5 ? 3 : 0);

    let peak = 0;
    let currentDrawdown = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    filteredTrades.forEach(trade => {
      runningPnL += trade.profitLoss || 0;
      if (runningPnL > peak) {
        peak = runningPnL;
        currentDrawdown = 0;
      } else {
        currentDrawdown = ((peak - runningPnL) / Math.max(peak, 1)) * 100;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    });

    return {
      emotionTrends,
      emotionPerformance,
      confidenceAnalysis,
      stressIndicators: {
        consecutiveLosses: maxConsecutiveLosses,
        recentDrawdown: currentDrawdown,
        emotionalVolatility,
        overtradingScore: Math.min(overtradingScore, 10),
      },
    };
  }, [filteredTrades]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Psychology</h1>
        <Card>
          <CardContent className="p-4">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Psychology</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Psychology</h1>
        <Button onClick={() => navigate('/add-trade')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {uniqueAssets.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Psychology Dashboard */}
      <PsychologyDashboard data={psychologyData} isLoading={isLoading} />
    </div>
  );
}