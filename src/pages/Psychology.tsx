import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useUserSettings } from '@/hooks/useUserSettings';
import { PsychologyDashboard } from '@/components/charts/PsychologyDashboard';

export default function Psychology() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();
  const { settings } = useUserSettings();
  const navigate = useNavigate();

  // Filter trades based on timeframe and asset
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

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    const assets = [...new Set(trades.map(t => t.asset))];
    return assets.sort();
  }, [trades]);

  // Generate psychology data
  const psychologyData = useMemo(() => {
    console.log('Psychology - filteredTrades:', filteredTrades);
    console.log('Psychology - trades length:', filteredTrades?.length);
    
    if (!Array.isArray(filteredTrades) || filteredTrades.length === 0) {
      console.log('Psychology - no trades available');
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

    // Emotion trends
    const emotionTrends = filteredTrades.map(trade => ({
      date: typeof trade.date === 'string' ? trade.date : new Date(trade.date).toISOString(),
      emotion: trade.emotion || 'neutral',
      confidence: trade.confidenceLevel || 5,
      profitLoss: trade.profitLoss || 0,
    }));

    // Emotion performance analysis
    const emotionStats = new Map();
    console.log('Psychology - processing trades for emotions:', filteredTrades.map(t => ({ emotion: t.emotion, profitLoss: t.profitLoss })));
    
    filteredTrades.forEach(trade => {
      const emotion = trade.emotion || 'neutral';
      console.log('Psychology - processing trade with emotion:', emotion, 'profitLoss:', trade.profitLoss);
      
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
    
    console.log('Psychology - emotionStats:', emotionStats);

    const emotionPerformance = Array.from(emotionStats.entries()).map(([emotion, stats]) => ({
      emotion,
      avgProfitLoss: stats.totalPnL / stats.totalCount,
      winRate: (stats.winCount / stats.totalCount) * 100,
      tradeCount: stats.totalCount,
      avgConfidence: stats.totalConfidence / stats.totalCount,
    }));

    // Confidence analysis
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

    // Stress indicators
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;
    let recentLosses = 0;
    let emotionalVolatility = 0;
    let overtradingScore = 0;

    // Calculate consecutive losses
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

    // Calculate emotional volatility (standard deviation of emotions)
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

    // Calculate overtrading score (based on recent activity and losses)
    const recentTrades = filteredTrades.slice(-10);
    const recentLossRate = recentTrades.filter(t => (t.profitLoss || 0) < 0).length / recentTrades.length;
    const recentActivity = recentTrades.length;
    overtradingScore = (recentLossRate * 5) + (recentActivity > 5 ? 3 : 0);

    // Calculate recent drawdown
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Psychology</h1>
            <p className="text-muted-foreground">Analyze your emotional patterns and performance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-modern">
              <CardContent className="p-6">
                <div className="h-64 bg-muted/50 rounded-lg shimmer"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Psychology</h1>
            <p className="text-muted-foreground">Analyze your emotional patterns and performance</p>
          </div>
        </div>
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Trading Psychology</h1>
          <p className="text-lg text-muted-foreground">Analyze your emotional patterns and performance</p>
        </div>
        <Button onClick={() => navigate('/add-trade')} className="btn-apple">
          <Plus className="w-4 h-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription className="text-base">
            Customize your psychology analysis view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
