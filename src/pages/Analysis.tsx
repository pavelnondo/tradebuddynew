/**
 * Analysis Page - Comprehensive Trading Analytics
 * Fixed: All charts use real data, correct calculations, missing analytics added
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useApiTrades } from '../hooks/useApiTrades';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { calculateAnalytics, TradeAnalytics } from '../utils/analytics';
import { StatCard } from '../components/shared/StatCard';
import { TimeRangeSelector, TimeRange } from '../components/shared/TimeRangeSelector';
import { LoadingState } from '../components/shared/LoadingState';
import { EmptyState } from '../components/shared/EmptyState';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatting';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Activity,
  Target,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  Brain
} from 'lucide-react';
import { ComposedChart, Line, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { EquityCurveTooltip } from '../components/charts/EquityCurveTooltip';
import { EmotionOutcomeHeatmap } from '../components/charts/EmotionOutcomeHeatmap';
import { DayOfWeekPerformance } from '../components/charts/DayOfWeekPerformance';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  formatChartValue,
  getTickCount,
  getTooltipOffset
} from '../utils/chartConfig';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingPulse } from '@/components/ui/loading-pulse';
import { AdvancedFilterBar, FilterValues } from '@/components/ui/advanced-filter-bar';
import { useTradeStore } from '@/stores/useTradeStore';
import { Trade } from '@/types/trade';
import { ChartCard } from '../components/charts/ChartCard';
import { runAnalyticsEngine, applyAnalyticsFilters, AnalyticsFilterInput } from '@/services/analyticsEngine';
import { computeAdvancedAnalytics } from '@/services/advancedAnalyticsEngine';
import { SetupIntelligenceSection } from '@/components/analysis/SetupIntelligenceSection';
import { BehavioralPatternsSection } from '@/components/analysis/BehavioralPatternsSection';
import { convertToStandardTrades } from '@/utils/tradeUtils';
import { API_BASE_URL } from '@/config';
import { PageContainer } from '@/components/layout/PageContainer';

const DEFAULT_FILTERS = {
  rMin: '',
  rMax: '',
  session: '' as const,
  riskMin: '',
  riskMax: '',
  checklistMin: '',
  checklistMax: '',
  confidenceMin: '',
  confidenceMax: '',
  executionMin: '',
  executionMax: '',
  durationMin: '',
  durationMax: '',
  tradeNumberMin: '',
  tradeNumberMax: '',
  winLoss: 'all' as const,
};

export default function Analysis() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const { trades: apiTrades, isLoading, error, fetchTrades } = useApiTrades();
  const { activeJournal } = useAccountManagement();
  const [recommendationCompletions, setRecommendationCompletions] = useState<Array<{
    recommendation_text: string;
    completed: boolean;
    created_at: string;
    trade_id: string;
  }>>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    rMin: string;
    rMax: string;
    session: '' | 'Asia' | 'London' | 'NewYork' | 'Other';
    riskMin: string;
    riskMax: string;
    checklistMin: string;
    checklistMax: string;
    confidenceMin: string;
    confidenceMax: string;
    executionMin: string;
    executionMax: string;
    durationMin: string;
    durationMax: string;
    tradeNumberMin: string;
    tradeNumberMax: string;
    winLoss: 'all' | 'win' | 'loss' | 'breakeven';
  }>(DEFAULT_FILTERS);

  const getInsightsCacheKey = () => activeJournal?.id ? `tradebuddy-insights-${activeJournal.id}` : 'tradebuddy-insights';
  type AnalysisInsightsState = {
    summary?: string;
    habits?: string[];
    recommendations?: string[];
    aiAnalysis?: string | null;
    sessionInsights?: string | null;
    setupInsights?: string | null;
    riskInsights?: string | null;
    strengths?: string[];
    topAction?: string | null;
    metrics?: { totalTrades?: number; winRate?: number; totalPnl?: number; profitFactor?: number; avgR?: number | null };
  } | null;
  const loadCachedInsights = (): AnalysisInsightsState => {
    try {
      const raw = localStorage.getItem(getInsightsCacheKey());
      if (!raw) return null;
      return JSON.parse(raw) as AnalysisInsightsState;
    } catch { return null; }
  };
  const lastInsightsFetchTradeCountRef = React.useRef<number | null>(null);
  const [insights, setInsights] = useState<AnalysisInsightsState>(() => loadCachedInsights());
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const allTrades = useMemo(() => convertToStandardTrades(apiTrades || []), [apiTrades]);

  const fetchInsights = useCallback(async () => {
    const count = allTrades.length;
    const last = lastInsightsFetchTradeCountRef.current;
    if (last != null && count < last + 3) return;
    lastInsightsFetchTradeCountRef.current = count;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/analytics/insights?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load insights');
      const data = await res.json();
      const next = {
        summary: data.summary,
        habits: data.habits || [],
        recommendations: data.recommendations || [],
        aiAnalysis: data.aiAnalysis,
        sessionInsights: data.sessionInsights,
        setupInsights: data.setupInsights,
        riskInsights: data.riskInsights,
        strengths: data.strengths || [],
        topAction: data.topAction,
        metrics: data.metrics,
      };
      setInsights(next);
      try {
        localStorage.setItem(getInsightsCacheKey(), JSON.stringify(next));
      } catch { /* ignore */ }
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Could not load insights');
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, [allTrades.length, activeJournal?.id]);

  useEffect(() => {
    const cached = loadCachedInsights();
    if (cached) setInsights(cached);
  }, [activeJournal?.id]);

  const lastFetchCount = lastInsightsFetchTradeCountRef.current;
  const newTradesSinceFetch = lastFetchCount == null ? allTrades.length : allTrades.length - lastFetchCount;
  const canRefreshInsights = lastFetchCount == null || allTrades.length >= lastFetchCount + 3;
  const systemRecommendsUpdate = lastFetchCount != null && newTradesSinceFetch >= 5;

  const resetFilters = () => setAdvancedFilters(DEFAULT_FILTERS);
  
  const baseFilteredTrades = useMemo(() => {
    let filtered = allTrades;
    
    // Filter by journal
    if (activeJournal) {
      filtered = filtered.filter(t => t.accountId === activeJournal.id);
    }
    
    // Filter by period
    if (selectedPeriod !== 'ALL') {
      const now = new Date();
      const days = selectedPeriod === '7D' ? 7 : selectedPeriod === '30D' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => t.entryTime >= cutoff);
    }
    
    return filtered;
  }, [allTrades, activeJournal, selectedPeriod]);

  const engineFilters: AnalyticsFilterInput = useMemo(() => ({
    rRange: { min: advancedFilters.rMin ? Number(advancedFilters.rMin) : undefined, max: advancedFilters.rMax ? Number(advancedFilters.rMax) : undefined },
    sessions: advancedFilters.session ? [advancedFilters.session] : undefined,
    riskPercentRange: { min: advancedFilters.riskMin ? Number(advancedFilters.riskMin) : undefined, max: advancedFilters.riskMax ? Number(advancedFilters.riskMax) : undefined },
    checklistPercentRange: { min: advancedFilters.checklistMin ? Number(advancedFilters.checklistMin) : undefined, max: advancedFilters.checklistMax ? Number(advancedFilters.checklistMax) : undefined },
    confidenceRange: { min: advancedFilters.confidenceMin ? Number(advancedFilters.confidenceMin) : undefined, max: advancedFilters.confidenceMax ? Number(advancedFilters.confidenceMax) : undefined },
    executionRange: { min: advancedFilters.executionMin ? Number(advancedFilters.executionMin) : undefined, max: advancedFilters.executionMax ? Number(advancedFilters.executionMax) : undefined },
    durationRange: { min: advancedFilters.durationMin ? Number(advancedFilters.durationMin) : undefined, max: advancedFilters.durationMax ? Number(advancedFilters.durationMax) : undefined },
    tradeNumberRange: { min: advancedFilters.tradeNumberMin ? Number(advancedFilters.tradeNumberMin) : undefined, max: advancedFilters.tradeNumberMax ? Number(advancedFilters.tradeNumberMax) : undefined },
    winLoss: advancedFilters.winLoss,
  }), [advancedFilters]);

  const filteredTrades = useMemo(
    () => applyAnalyticsFilters(baseFilteredTrades, engineFilters),
    [baseFilteredTrades, engineFilters]
  );

  // Calculate analytics - use journal's initial balance when available
  const initialBalance = activeJournal?.initialBalance ?? 10000;
  const analytics = useMemo(
    () => calculateAnalytics(filteredTrades, initialBalance),
    [filteredTrades, initialBalance]
  );
  const analyticsEngine = useMemo(
    () => runAnalyticsEngine(filteredTrades, { rollingWindow: 20, initialBalance, monteCarloRuns: 1000 }),
    [filteredTrades, initialBalance]
  );

  const advancedAnalytics = useMemo(
    () => computeAdvancedAnalytics({ trades: filteredTrades, rollingWindowSize: 20 }),
    [filteredTrades]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTrades();
    setIsRefreshing(false);
  };

  // Fetch AI recommendation completions
  useEffect(() => {
    const fetchCompletions = async () => {
      if (!activeJournal?.id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/ai-recommendation-completions?journal_id=${activeJournal.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendationCompletions(data);
        }
      } catch (err) {
        console.warn('Failed to fetch recommendation completions:', err);
      }
    };
    fetchCompletions();
  }, [activeJournal?.id]);

  // Calculate average win/loss for R-multiple charts
  const winningTradesList = filteredTrades.filter(t => t.pnl > 0);
  const losingTradesList = filteredTrades.filter(t => t.pnl < 0);
  
  const avgWin = winningTradesList.length > 0
    ? winningTradesList.reduce((sum, t) => sum + t.pnl, 0) / winningTradesList.length
    : 0;
  const avgLoss = losingTradesList.length > 0
    ? Math.abs(losingTradesList.reduce((sum, t) => sum + t.pnl, 0) / losingTradesList.length)
    : 0;

  // Chart data - unique timestamp per point so tooltip shows correct P&L when multiple trades share a day
  const equityCurveData = analytics.equityCurve.map(point => ({
    date: point.date.toISOString(),
    dateLabel: formatDate(point.date),
    equity: point.equity,
    pnl: point.pnl,
  }));

  // Y-axis domain: ensure minimum range so ~$100 moves are visible on the curve
  const equityDomain = useMemo(() => {
    if (equityCurveData.length === 0) return undefined;
    const vals = equityCurveData.map(d => d.equity).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return undefined;
    const minE = Math.min(...vals);
    const maxE = Math.max(...vals);
    const range = maxE - minE;
    const minVisibleRange = 500;
    const padding = Math.max(250, range * 0.2, minVisibleRange / 2);
    return [Math.max(0, minE - padding), maxE + padding] as [number, number];
  }, [equityCurveData]);

  const emotionChartData = analytics.emotionPerformance.map(em => ({
    emotion: em.emotion.charAt(0).toUpperCase() + em.emotion.slice(1),
    count: em.count,
    winRate: em.winRate,
    avgPnL: em.averagePnL,
  }));

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: analytics.tradesByHour[hour]?.count || 0,
    pnl: analytics.tradesByHour[hour]?.totalPnL || 0,
    winRate: analytics.tradesByHour[hour]?.winRate || 0,
  }));

  const dayOfWeekData = [
    { day: 'Sun', ...analytics.tradesByDayOfWeek[0] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Mon', ...analytics.tradesByDayOfWeek[1] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Tue', ...analytics.tradesByDayOfWeek[2] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Wed', ...analytics.tradesByDayOfWeek[3] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Thu', ...analytics.tradesByDayOfWeek[4] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Fri', ...analytics.tradesByDayOfWeek[5] || { count: 0, totalPnL: 0, winRate: 0 } },
    { day: 'Sat', ...analytics.tradesByDayOfWeek[6] || { count: 0, totalPnL: 0, winRate: 0 } },
  ];

  const pnlDistribution = [
    { range: '<-100', count: filteredTrades.filter(t => t.pnl < -100).length },
    { range: '-100 to 0', count: filteredTrades.filter(t => t.pnl >= -100 && t.pnl < 0).length },
    { range: '0 to 100', count: filteredTrades.filter(t => t.pnl >= 0 && t.pnl <= 100).length },
    { range: '>100', count: filteredTrades.filter(t => t.pnl > 100).length },
  ];

  if (isLoading) {
    return <LoadingState type="grid" count={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading analysis"
        description={error}
        action={{
          label: 'Retry',
          onClick: () => fetchTrades(),
        }}
      />
    );
  }

  const isEmpty = filteredTrades.length === 0;
  const hasTradesButFiltered = baseFilteredTrades.length > 0 && isEmpty;

  return (
    <div className="space-y-8">
      <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b" style={{ borderColor: themeConfig.border }}>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: themeConfig.foreground }}>
            Trading <span style={{ color: themeConfig.accent }}>Analysis</span>
          </h1>
          <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            Deep dive into your trading performance and patterns
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <TimeRangeSelector value={selectedPeriod} onChange={setSelectedPeriod} />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdvancedFilterBar
        filters={{
          session: advancedFilters.session || undefined,
          winLoss: advancedFilters.winLoss === 'all' ? undefined : advancedFilters.winLoss,
          rMin: advancedFilters.rMin || undefined,
          rMax: advancedFilters.rMax || undefined,
          riskMin: advancedFilters.riskMin || undefined,
          riskMax: advancedFilters.riskMax || undefined,
          checklistMin: advancedFilters.checklistMin || undefined,
          checklistMax: advancedFilters.checklistMax || undefined,
        }}
        onFilterChange={(newFilters) => {
          setAdvancedFilters({
            ...advancedFilters,
            session: (newFilters.session || '') as typeof advancedFilters.session,
            winLoss: (newFilters.winLoss || 'all') as typeof advancedFilters.winLoss,
            rMin: newFilters.rMin || '',
            rMax: newFilters.rMax || '',
            riskMin: newFilters.riskMin || '',
            riskMax: newFilters.riskMax || '',
            checklistMin: newFilters.checklistMin || '',
            checklistMax: newFilters.checklistMax || '',
          });
        }}
      />

      {isEmpty ? (
        <EmptyState
          title={hasTradesButFiltered ? "No trades match your filters" : "No trades to analyze"}
          description={hasTradesButFiltered ? "Try resetting filters or broadening your criteria" : "Add some trades to see detailed analytics and insights"}
          action={hasTradesButFiltered ? { label: 'Reset filters', onClick: resetFilters } : { label: 'Add Trade', onClick: () => navigate('/add-trade') }}
          secondaryActions={[{ label: 'Go to Trades', onClick: () => navigate('/trade-history') }]}
        />
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
        <StatCard
          title="Win Rate"
          value={formatPercent(analytics.winRate)}
          change={analytics.winRate > 50 ? analytics.winRate - 50 : undefined}
          trend={analytics.winRate > 50 ? 'up' : 'down'}
          icon={Target}
          valueColor={analytics.winRate >= 50 ? themeConfig.success : themeConfig.destructive}
        />
        
        <StatCard
          title="Total P&L"
          value={formatCurrency(analytics.totalPnL)}
          trend={analytics.totalPnL >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          valueColor={analytics.totalPnL >= 0 ? themeConfig.success : themeConfig.destructive}
        />
        
        <StatCard
          title="Max Win"
          value={formatCurrency(analytics.maxWin)}
          trend="up"
          icon={TrendingUp}
        />
        
        <StatCard
          title="Max Loss"
          value={formatCurrency(Math.abs(analytics.maxLoss))}
          trend="down"
          icon={TrendingDown}
        />
      </div>

      {/* Overview */}
      <Card shineBorder className="p-6 rounded-2xl" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: themeConfig.foreground }}>Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total R" value={analyticsEngine.totalR.toFixed(2)} icon={Target} valueColor={analyticsEngine.totalR >= 0 ? themeConfig.success : themeConfig.destructive} />
          <StatCard title="Avg R" value={analyticsEngine.avgR !== null ? analyticsEngine.avgR.toFixed(2) : 'N/A'} icon={Activity} valueColor={analyticsEngine.avgR != null && analyticsEngine.avgR >= 1 ? themeConfig.success : analyticsEngine.avgR != null ? themeConfig.destructive : undefined} />
          <StatCard title="Expectancy (R)" value={analyticsEngine.expectancyR !== null ? analyticsEngine.expectancyR.toFixed(2) : 'N/A'} icon={Brain} valueColor={analyticsEngine.expectancyR != null && analyticsEngine.expectancyR >= 0 ? themeConfig.success : analyticsEngine.expectancyR != null ? themeConfig.destructive : undefined} />
          <StatCard title="R Win Rate" value={`${analyticsEngine.rWinRate.toFixed(1)}%`} icon={Zap} valueColor={analyticsEngine.rWinRate >= 50 ? themeConfig.success : themeConfig.destructive} />
        </div>
      </Card>

      {/* Setup Intelligence - Advanced Analytics */}
      <SetupIntelligenceSection rows={advancedAnalytics.setupPerformanceMatrix} themeConfig={themeConfig} />

      {/* Behavioral Patterns - Advanced Post-Loss Analysis */}
      <BehavioralPatternsSection report={advancedAnalytics.postLossBehavior} themeConfig={themeConfig} />

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        <Card 
          shineBorder
          className="p-6 transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: themeConfig.card,
            borderColor: themeConfig.border,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: themeConfig.foreground }}
          >
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: themeConfig.mutedForeground }}>Profit Factor</span>
                <span className="font-semibold" style={{ color: analytics.profitFactor >= 1 ? themeConfig.success : themeConfig.destructive }}>
                  {analytics.profitFactor.toFixed(2)}
                </span>
              </div>
              <div 
                className="w-full rounded-full h-2"
                style={{ backgroundColor: `${themeConfig.border}40` }}
              >
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ 
                    width: `${Math.min(analytics.profitFactor * 10, 100)}%`,
                    backgroundColor: analytics.profitFactor >= 1 ? themeConfig.success : themeConfig.destructive
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: themeConfig.mutedForeground }}>Expectancy</span>
                <span className="font-semibold" style={{ color: analytics.expectancy >= 0 ? themeConfig.success : themeConfig.destructive }}>
                  {formatCurrency(analytics.expectancy)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card 
          shineBorder
          className="p-6 transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: themeConfig.card,
            borderColor: themeConfig.border,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: themeConfig.foreground }}
          >
            Streak Analysis
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div 
                className="text-3xl font-semibold mb-2"
                style={{ color: themeConfig.foreground }}
              >
                {analytics.currentWinStreak}
              </div>
              <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                Current Win Streak
              </div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl font-semibold mb-2"
                style={{ color: themeConfig.foreground }}
              >
                {analytics.longestWinStreak}
              </div>
              <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                Longest Win Streak
              </div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl font-semibold mb-2"
                style={{ color: themeConfig.destructive }}
              >
                {analytics.currentLossStreak}
              </div>
              <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                Current Loss Streak
              </div>
            </div>
          </div>
        </Card>

        <Card 
          shineBorder
          className="p-6 transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: themeConfig.card,
            borderColor: themeConfig.border,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: themeConfig.foreground }}
          >
            Risk Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm mb-1" style={{ color: themeConfig.mutedForeground }}>
                Max Drawdown
              </div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: themeConfig.foreground }}
              >
                {formatPercent(analytics.maxDrawdown)}
              </div>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: themeConfig.mutedForeground }}>
                Recovery Factor
              </div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: themeConfig.foreground }}
              >
                {analytics.recoveryFactor.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: themeConfig.mutedForeground }}>
                Sharpe Ratio
              </div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: themeConfig.foreground }}
              >
                {analytics.sharpeRatio.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        {/* Setup Grade Performance */}
        {analytics.gradePerformance && analytics.gradePerformance.length > 0 && (
          <Card 
            shineBorder
            className="p-6 transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: themeConfig.foreground }}
            >
              Setup Grade Win Rate
            </h3>
            <div className="space-y-4">
              {analytics.gradePerformance.map(({ grade, trades, wins, winRate }) => (
                <div key={grade} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span 
                      className="font-semibold"
                      style={{ 
                        color: grade === 'A' ? themeConfig.success : grade === 'B' ? themeConfig.accent : themeConfig.mutedForeground 
                      }}
                    >
                      Grade {grade}
                    </span>
                    <span style={{ color: winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                      {winRate.toFixed(1)}% ({wins}/{trades})
                    </span>
                  </div>
                  <div 
                    className="w-full rounded-full h-2"
                    style={{ backgroundColor: `${themeConfig.border}40` }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, winRate)}%`,
                        backgroundColor: winRate >= 50 ? themeConfig.success : themeConfig.destructive
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

        {/* Equity Curve */}
        <ChartCard
          title="Equity Curve"
          subtitle="Account balance over time"
          shineBorder
          minHeight={440}
          className="w-full"
        >
          <div className="w-full min-h-[440px]" style={{ height: 440, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={440} minHeight={440}>
              <ComposedChart 
                data={equityCurveData.length > 0 ? equityCurveData : [{ date: 'No Data', equity: 0 }]} 
                margin={getChartMargins()}
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  stroke={getGridConfig(themeConfig, true).stroke}
                  strokeOpacity={getGridConfig(themeConfig, true).strokeOpacity}
                  strokeDasharray={getGridConfig(themeConfig, true).strokeDasharray}
                />
                <XAxis 
                  dataKey="date" 
                  tickCount={Math.min(getTickCount(320), equityCurveData.length)}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(v) => {
                    if (!v || v === 'No Data') return v;
                    try {
                      const d = new Date(v);
                      return isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    } catch { return v; }
                  }}
                  {...getAxisConfig(themeConfig, 10)}
                />
                <YAxis 
                  tickCount={getTickCount(320)}
                  tickFormatter={(v) => formatChartValue(v, true)}
                  domain={equityDomain}
                  {...getAxisConfig(themeConfig, 10)}
                />
                <Tooltip 
                  content={<EquityCurveTooltip />}
                  cursor={{ stroke: themeConfig.border, strokeWidth: 1, strokeDasharray: '2 2' }}
                  offset={getTooltipOffset().x}
                />
                <defs>
                  <linearGradient id="equityGradient-analysis" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                    {(equityCurveData.length > 0 ? equityCurveData : [{ pnl: 0 }]).map((point, i, arr) => (
                      <stop
                        key={i}
                        offset={`${arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50}%`}
                        stopColor={(point as { pnl?: number }).pnl != null && (point as { pnl?: number }).pnl >= 0 ? themeConfig.success : themeConfig.destructive}
                        stopOpacity={0.85}
                      />
                    ))}
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="equity"
                  fill="url(#equityGradient-analysis)"
                  stroke="none"
                  baseValue="dataMin"
                  isAnimationActive={true}
                  animationDuration={500}
                />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke={themeConfig.chartLine}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Equity"
                  isAnimationActive={true}
                  animationDuration={500}
                />
                {/* Invisible line so pnl is in tooltip payload */}
                <Line dataKey="pnl" stroke="transparent" dot={false} hide />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Win/Loss Analysis */}
        <ChartCard
          title="Win/Loss Analysis"
          subtitle="Winning vs losing trades"
          shineBorder
          minHeight={200}
          className="w-full"
        >
          <div className="w-full min-h-[200px]" style={{ height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <BarChart 
                data={[
                  { name: 'Wins', value: analytics.winningTrades, color: themeConfig.success },
                  { name: 'Losses', value: analytics.losingTrades, color: themeConfig.destructive },
                ]}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 60, bottom: 8 }}
              >
                <CartesianGrid
                  horizontal={false}
                  vertical={true}
                  stroke={getGridConfig(themeConfig, false).stroke}
                  strokeOpacity={getGridConfig(themeConfig, false).strokeOpacity}
                  strokeDasharray={getGridConfig(themeConfig, false).strokeDasharray}
                />
                <XAxis 
                  type="number"
                  tickCount={5}
                  {...getAxisConfig(themeConfig, 10)}
                />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  width={56}
                  tickLine={false}
                  {...getAxisConfig(themeConfig, 10)}
                />
                <Tooltip 
                  content={<ChartTooltip />}
                  cursor={{ fill: themeConfig.border, fillOpacity: 0.1 }}
                  offset={getTooltipOffset().x}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 8, 8, 0]}
                  barSize={32}
                  isAnimationActive={true}
                  animationDuration={500}
                >
                  {[
                    { name: 'Wins', value: analytics.winningTrades, color: themeConfig.success },
                    { name: 'Losses', value: analytics.losingTrades, color: themeConfig.destructive },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      {/* Charts - same width as all other content */}
      <div className="space-y-6">
        {/* Emotion vs Outcome Heatmap */}
        <ChartCard
          title="Emotion vs Outcome"
          subtitle="Which emotions correlate with performance"
          shineBorder
          minHeight={400}
        >
          <EmotionOutcomeHeatmap
            data={analytics.emotionOutcomeData}
            metric="avgR"
          />
        </ChartCard>

        {/* Day of Week Performance */}
        <ChartCard
          title="Day of Week Performance"
          subtitle="Wins and losses by day (Monday-Friday)"
          shineBorder
          minHeight={360}
        >
          <DayOfWeekPerformance 
            data={Object.entries(analytics.tradesByDayOfWeek).map(([day, data]) => {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return {
                day: Number(day),
                dayName: dayNames[Number(day)],
                wins: data.wins || 0,
                losses: data.losses || 0,
                tradeCount: data.count
              };
            })}
          />
        </ChartCard>
      </div>

      {/* Detailed Emotion Performance Table */}
      <Card 
        shineBorder
        className="p-6 transition-all duration-200 hover:shadow-lg"
        style={{
          backgroundColor: themeConfig.card,
          borderColor: themeConfig.border,
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: themeConfig.foreground }}
        >
          Emotion Performance Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Emotion</th>
                <th className="text-right p-2">Trades</th>
                <th className="text-right p-2">Wins</th>
                <th className="text-right p-2">Win Rate</th>
                <th className="text-right p-2">Total P&L</th>
                <th className="text-right p-2">Avg P&L</th>
              </tr>
            </thead>
            <tbody>
              {analytics.emotionPerformance.map((em) => (
                <tr key={em.emotion} className="border-b">
                  <td className="p-2 font-medium capitalize">{em.emotion}</td>
                  <td className="p-2 text-right">{em.count}</td>
                  <td className="p-2 text-right">{em.wins}</td>
                  <td className="p-2 text-right">{formatPercent(em.winRate)}</td>
                  <td className={`p-2 text-right ${em.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(em.totalPnL)}
                  </td>
                  <td className={`p-2 text-right ${em.averagePnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(em.averagePnL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trading Habits & Insights - n8n Data Analyzer */}
        <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${themeConfig.border}` }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h4 className="text-base font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Brain className="w-4 h-4" style={{ color: themeConfig.accent }} />
              Trading Habits & Insights
              {systemRecommendsUpdate && canRefreshInsights && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${themeConfig.accent}20`, color: themeConfig.accent }}>
                  New data available
                </span>
              )}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInsights}
              disabled={insightsLoading || !canRefreshInsights}
              title={!canRefreshInsights ? 'Refresh available after 3 new trades' : undefined}
              style={{ borderColor: themeConfig.border, color: themeConfig.foreground }}
            >
              {insightsLoading ? (
                <LoadingPulse size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          {!insights && !insightsLoading ? (
            <div className="py-6 text-center" style={{ color: themeConfig.mutedForeground }}>
              Click Refresh to analyze your trading habits (requires 3+ new trades since last update).
            </div>
          ) : insightsLoading && !insights ? (
            <div className="py-6 text-center" style={{ color: themeConfig.mutedForeground }}>
              Analyzing your trading habits...
            </div>
          ) : insightsError ? (
            <div className="py-3 text-sm" style={{ color: themeConfig.destructive }}>
              {insightsError}
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {insights.summary && (
                <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.summary}</p>
              )}
              {insights.topAction && (
                <div className="rounded-lg p-3" style={{ backgroundColor: `${themeConfig.accent}10`, borderLeft: `4px solid ${themeConfig.accent}` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Top Action</p>
                  <p className="text-sm font-medium" style={{ color: themeConfig.foreground }}>{insights.topAction}</p>
                </div>
              )}
              {insights.metrics && (
                <div className="flex flex-wrap gap-3 py-1">
                  {insights.metrics.winRate != null && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: insights.metrics.winRate >= 50 ? `${themeConfig.success}15` : `${themeConfig.destructive}15`, color: insights.metrics.winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                      Win rate {insights.metrics.winRate}%
                    </span>
                  )}
                  {insights.metrics.profitFactor != null && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: insights.metrics.profitFactor >= 1 ? `${themeConfig.success}15` : `${themeConfig.destructive}15`, color: insights.metrics.profitFactor >= 1 ? themeConfig.success : themeConfig.destructive }}>
                      PF {insights.metrics.profitFactor}
                    </span>
                  )}
                  {insights.metrics.avgR != null && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: insights.metrics.avgR >= 1 ? `${themeConfig.success}15` : `${themeConfig.destructive}15`, color: insights.metrics.avgR >= 1 ? themeConfig.success : themeConfig.destructive }}>
                      Avg {insights.metrics.avgR}R
                    </span>
                  )}
                </div>
              )}
              {insights.aiAnalysis && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Emotion Analysis</h5>
                  <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.aiAnalysis}</p>
                </div>
              )}
              {insights.strengths && insights.strengths.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.success }}>Strengths</h5>
                  <ul className="space-y-1">
                    {insights.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: themeConfig.success }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.habits && insights.habits.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>Behavioral Tendencies</h5>
                  <ul className="space-y-1">
                    {insights.habits.map((h, i) => (
                      <li key={i} className="text-sm flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: themeConfig.accent }} />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.sessionInsights && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Session Insights</h5>
                  <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.sessionInsights}</p>
                </div>
              )}
              {insights.setupInsights && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Setup Insights</h5>
                  <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.setupInsights}</p>
                </div>
              )}
              {insights.riskInsights && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Risk Insights</h5>
                  <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.riskInsights}</p>
                </div>
              )}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: themeConfig.border }}>
                  <h5 className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Recommendations</h5>
                  <ul className="space-y-1">
                    {insights.recommendations.map((r, i) => (
                      <li key={i} className="text-sm" style={{ color: themeConfig.foreground }}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      {/* AI Recommendation Completion Tracking */}
      {insights && (insights.actionItems?.length > 0 || insights.topAction) && (
        <Card 
          shineBorder
          className="p-6 transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: themeConfig.card,
            borderColor: themeConfig.border,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: themeConfig.foreground }}
          >
            <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
            AI Recommendation Completion Progress
          </h3>
          <p className="text-sm mb-4" style={{ color: themeConfig.mutedForeground }}>
            Track your improvement by seeing how often you follow AI recommendations over time. Check off recommendations in the Add Trade form to start tracking.
          </p>
          
          {recommendationCompletions.length === 0 ? (
            <div className="py-8 text-center" style={{ color: themeConfig.mutedForeground }}>
              <p className="text-sm mb-2">No completion data yet.</p>
              <p className="text-xs">Start checking off recommendations in the Add Trade form to see your progress here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group completions by recommendation text
                const grouped = recommendationCompletions.reduce((acc, comp) => {
                  const text = comp.recommendation_text;
                  if (!acc[text]) {
                    acc[text] = { total: 0, completed: 0, recent: [] };
                  }
                  acc[text].total++;
                  if (comp.completed) acc[text].completed++;
                  // Track last 10 trades
                  acc[text].recent.push({
                    completed: comp.completed,
                    date: comp.created_at,
                  });
                  acc[text].recent = acc[text].recent.slice(-10);
                  return acc;
                }, {} as Record<string, { total: number; completed: number; recent: Array<{ completed: boolean; date: string }> }>);

                // Get unique recommendations from completion data
                const allRecommendations = Array.from(new Set(recommendationCompletions.map(c => c.recommendation_text)));

                return allRecommendations.map((rec, idx) => {
                  const stats = grouped[rec] || { total: 0, completed: 0, recent: [] };
                  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                  const recentRate = stats.recent.length > 0 
                    ? (stats.recent.filter(r => r.completed).length / stats.recent.length) * 100 
                    : 0;

                  return (
                    <div key={idx} className="space-y-2 p-4 rounded-lg border" style={{ borderColor: themeConfig.border }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium flex-1" style={{ color: themeConfig.foreground }}>
                          {rec}
                        </p>
                        <div className="text-right">
                          <div className="text-xs font-semibold" style={{ color: completionRate >= 70 ? themeConfig.success : completionRate >= 50 ? themeConfig.accent : themeConfig.destructive }}>
                            {completionRate.toFixed(0)}%
                          </div>
                          <div className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                            {stats.completed}/{stats.total} trades
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: themeConfig.mutedForeground }}>Overall</span>
                          <span style={{ color: themeConfig.foreground }}>{completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${themeConfig.border}40` }}>
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${completionRate}%`,
                              backgroundColor: completionRate >= 70 ? themeConfig.success : completionRate >= 50 ? themeConfig.accent : themeConfig.destructive,
                            }}
                          />
                        </div>
                        {stats.recent.length > 0 && (
                          <>
                            <div className="flex justify-between text-xs mt-2">
                              <span style={{ color: themeConfig.mutedForeground }}>Recent (last {stats.recent.length})</span>
                              <span style={{ color: themeConfig.foreground }}>{recentRate.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${themeConfig.border}30` }}>
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${recentRate}%`,
                                  backgroundColor: recentRate >= 70 ? themeConfig.success : recentRate >= 50 ? themeConfig.accent : themeConfig.destructive,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </Card>
      )}
        </>
      )}
      </PageContainer>
    </div>
  );
}
