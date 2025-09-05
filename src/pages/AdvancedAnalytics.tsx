import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Calendar,
  Activity,
  Zap,
  Brain,
  PieChart
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
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { ParetoChart } from '@/components/charts/ParetoChart';
import { DonutChart } from '@/components/charts/DonutChart';

export default function AdvancedAnalytics() {
  const [timeframe, setTimeframe] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("all");
  const { trades, isLoading, error } = useApiTrades();

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

  // Generate waterfall data
  const waterfallData = useMemo(() => {
    if (!Array.isArray(filteredTrades)) return [];
    
    const dailyPnL = new Map();
    filteredTrades.forEach(trade => {
      const date = typeof trade.date === 'string' 
        ? new Date(trade.date).toLocaleDateString()
        : trade.date.toLocaleDateString();
      
      if (!dailyPnL.has(date)) {
        dailyPnL.set(date, 0);
      }
      dailyPnL.set(date, dailyPnL.get(date) + (trade.profitLoss || 0));
    });

    const sortedDates = Array.from(dailyPnL.keys()).sort();
    const result = [];
    
    // Starting balance
    result.push({ name: 'Starting Balance', value: 10000, type: 'start' });
    
    // Daily changes
    sortedDates.forEach(date => {
      const pnl = dailyPnL.get(date);
      result.push({
        name: date,
        value: pnl,
        type: pnl >= 0 ? 'positive' : 'negative'
      });
    });
    
    // Final balance
    const totalPnL = Array.from(dailyPnL.values()).reduce((sum, pnl) => sum + pnl, 0);
    result.push({ name: 'Final Balance', value: 10000 + totalPnL, type: 'end' });
    
    return result;
  }, [filteredTrades]);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    if (!Array.isArray(filteredTrades)) return [];
    
    const activityMap = new Map();
    filteredTrades.forEach(trade => {
      const date = typeof trade.date === 'string' ? new Date(trade.date) : trade.date;
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      
      if (!activityMap.has(key)) {
        activityMap.set(key, { value: 0, trades: 0 });
      }
      const current = activityMap.get(key);
      activityMap.set(key, {
        value: current.value + Math.abs(trade.profitLoss || 0),
        trades: current.trades + 1
      });
    });

    return Array.from(activityMap.entries()).map(([key, data]) => {
      const [day, hour] = key.split('-');
      return {
        day,
        hour: parseInt(hour),
        value: data.value,
        trades: data.trades
      };
    });
  }, [filteredTrades]);

  // Generate Pareto data
  const paretoData = useMemo(() => {
    if (!Array.isArray(filteredTrades)) return [];
    
    const setupStats = new Map();
    filteredTrades.forEach(trade => {
      const setup = trade.setupType || trade.setup || 'Unknown';
      if (!setupStats.has(setup)) {
        setupStats.set(setup, 0);
      }
      setupStats.set(setup, setupStats.get(setup) + (trade.profitLoss || 0));
    });

    const sortedSetups = Array.from(setupStats.entries())
      .map(([setup, value]) => ({ category: setup, value }))
      .sort((a, b) => b.value - a.value);

    const total = sortedSetups.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;

    return sortedSetups.map(item => {
      cumulative += item.value;
      return {
        ...item,
        cumulativePercentage: (cumulative / total) * 100
      };
    });
  }, [filteredTrades]);

  // Generate donut data
  const donutData = useMemo(() => {
    if (!Array.isArray(filteredTrades)) return [];
    
    const emotionStats = new Map();
    filteredTrades.forEach(trade => {
      const emotion = trade.emotion || 'neutral';
      if (!emotionStats.has(emotion)) {
        emotionStats.set(emotion, 0);
      }
      emotionStats.set(emotion, emotionStats.get(emotion) + 1);
    });

    return Array.from(emotionStats.entries()).map(([emotion, count]) => ({
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: count
    }));
  }, [filteredTrades]);

  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    return Array.from(new Set(trades.map(trade => trade.asset).filter(Boolean)));
  }, [trades]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Professional-grade trading analytics with advanced visualizations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>Advanced Charts</span>
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
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
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="w-40">
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

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <WaterfallChart
          data={waterfallData}
          title="P&L Waterfall Analysis"
          description="Track cumulative profit/loss changes over time"
          isLoading={isLoading}
        />

        {/* Heatmap Chart */}
        <HeatmapChart
          data={heatmapData}
          title="Trading Activity Heatmap"
          description="Visualize trading activity by day and hour"
          isLoading={isLoading}
        />

        {/* Pareto Chart */}
        <ParetoChart
          data={paretoData}
          title="Setup Performance Pareto"
          description="80/20 rule analysis of trading setups"
          isLoading={isLoading}
        />

        {/* Donut Chart */}
        <DonutChart
          data={donutData}
          title="Emotion Distribution"
          description="Distribution of trading emotions"
          isLoading={isLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{filteredTrades.length}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${
                  filteredTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${filteredTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">
                  {filteredTrades.length > 0 
                    ? ((filteredTrades.filter(t => (t.profitLoss || 0) > 0).length / filteredTrades.length) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Setups</p>
                <p className="text-2xl font-bold">
                  {new Set(filteredTrades.map(t => t.setupType || t.setup || 'Unknown')).size}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
