/**
 * Dashboard Page - Fixed with real charts and calculations
 * Fixed: Equity curve, win/loss analysis, rounded values, functional time filters
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useApiTrades } from '../hooks/useApiTrades';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { calculateAnalytics, getMonthlyComparison } from '../utils/analytics';
import { StatCard } from '../components/shared/StatCard';
import { TimeRangeSelector, TimeRange } from '../components/shared/TimeRangeSelector';
import { LoadingState } from '../components/shared/LoadingState';
import { EmptyState } from '../components/shared/EmptyState';
import { formatCurrency, formatPercent } from '../utils/formatting';
import { Trade } from '@/types/trade';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Activity,
  BarChart3,
  Flame,
  Brain,
  Trophy,
  CheckSquare
} from 'lucide-react';
import { ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { EquityCurveTooltip } from '../components/charts/EquityCurveTooltip';
import { ChartCard } from '../components/charts/ChartCard';
import { 
  getChartMargins, 
  getAxisConfig, 
  getGridConfig, 
  formatChartValue,
  getTickCount,
  getTooltipOffset
} from '../utils/chartConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { convertToStandardTrades } from '@/utils/tradeUtils';
import { useGoals } from '@/hooks/useGoals';
import { PageContainer } from '@/components/layout/PageContainer';
import { useInsights } from '@/hooks/useInsights';
import { useNavigate } from 'react-router-dom';
import { ImproveTodayWidget } from '@/components/dashboard/ImproveTodayWidget';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BlurFade } from '@/components/ui/blur-fade';

export default function Dashboard() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const { trades: apiTrades, isLoading, error, fetchTrades } = useApiTrades();
  const { activeJournal } = useAccountManagement();
  const { goals, fetchGoals } = useGoals(activeJournal?.id);
  const { insights, loading: insightsLoading, fetchInsights } = useInsights(100, activeJournal?.id);
  const location = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('ALL');

  useEffect(() => {
    if (activeJournal) fetchGoals();
  }, [activeJournal, fetchGoals]);

  useEffect(() => {
    if (activeJournal) {
      fetchTrades();
    }
  }, [activeJournal, fetchTrades]);
  
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      fetchTrades();
    }
  }, [location.pathname, fetchTrades]);

  const allTrades = useMemo(() => convertToStandardTrades(apiTrades || []), [apiTrades]);
  
  const filteredTrades = useMemo(() => {
    const list = Array.isArray(allTrades) ? allTrades : [];
    let filtered = list;

    // Filter by journal
    if (activeJournal?.id) {
      filtered = filtered.filter(t => t.accountId === activeJournal.id);
    }

    // Filter by period
    if (selectedPeriod !== 'ALL') {
      const now = new Date();
      const days = selectedPeriod === '7D' ? 7 : selectedPeriod === '30D' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => {
        const et = t.entryTime;
        if (!et) return false;
        const ts = et instanceof Date ? et.getTime() : new Date(et as unknown as string).getTime();
        return !isNaN(ts) && ts >= cutoff.getTime();
      });
    }

    return filtered;
  }, [allTrades, activeJournal, selectedPeriod]);

  // Calculate analytics - use journal's initial balance when available
  const initialBalance = activeJournal?.initialBalance ?? 10000;
  const analytics = useMemo(
    () => calculateAnalytics(filteredTrades, initialBalance),
    [filteredTrades, initialBalance]
  );

  const monthlyComparison = useMemo(
    () => getMonthlyComparison(filteredTrades),
    [filteredTrades]
  );

  // Map goals to current values from analytics
  const goalsWithProgress = useMemo(() => {
    const currentBalance = initialBalance + analytics.totalPnL;
    return goals.map((g) => {
      let current = g.currentValue;
      if (g.goalType === 'pnl' || g.goalType === 'profit') current = analytics.totalPnL;
      else if (g.goalType === 'win_rate') current = analytics.winRate;
      else if (g.goalType === 'trades_count' || g.goalType === 'trades' || g.goalType === 'trade_count') current = analytics.totalTrades;
      else if (g.goalType === 'balance') current = currentBalance;
      const progress = g.targetValue !== 0 ? Math.min(100, (current / g.targetValue) * 100) : 0;
      return { ...g, current, progress };
    });
  }, [goals, analytics, initialBalance]);

  // Prepare chart data - use unique timestamp per point so tooltip shows correct P&L when multiple trades share a day
  const equityCurveData = analytics.equityCurve.map(point => ({
    date: point.date.toISOString(),
    dateLabel: point.date.toISOString().split('T')[0],
    equity: point.equity,
    pnl: Math.round(point.pnl * 100) / 100,
  }));

  // Y-axis domain: ensure minimum range so ~$100 moves are visible on the curve
  const equityDomain = useMemo(() => {
    if (equityCurveData.length === 0) return undefined;
    const vals = equityCurveData.map(d => d.equity).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return undefined;
    const minE = Math.min(...vals);
    const maxE = Math.max(...vals);
    const range = maxE - minE;
    const minVisibleRange = 500;
    const padding = Math.max(250, range * 0.2, minVisibleRange / 2);
    return [Math.max(0, minE - padding), maxE + padding] as [number, number];
  }, [equityCurveData]);

  const winLossData = [
    { name: 'Wins', value: analytics.winningTrades, fill: '#10b981' },
    { name: 'Losses', value: analytics.losingTrades, fill: '#ef4444' },
  ];

  const emotionData = analytics.emotionPerformance
    .filter(em => em.count > 0)
    .map(em => ({
      name: em.emotion.charAt(0).toUpperCase() + em.emotion.slice(1),
      value: em.count,
      winRate: Math.round(em.winRate * 100) / 100,
    }));

  if (isLoading) {
    return <LoadingState type="grid" count={4} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading dashboard"
        description={error}
        action={{
          label: 'Retry',
          onClick: () => fetchTrades(),
        }}
      />
    );
  }

  const currentBalance = initialBalance + analytics.totalPnL;
  const hasTrades = filteredTrades.length > 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b" style={{ borderColor: themeConfig.border }}>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: themeConfig.foreground }}>
            Trading <span style={{ color: themeConfig.accent }}>Dashboard</span>
          </h1>
          <p className="text-sm flex items-center gap-2" style={{ color: themeConfig.mutedForeground }}>
            <Activity className="w-4 h-4" />
            Real-time performance metrics and analytics
          </p>
        </div>

        <TimeRangeSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {!hasTrades && (
        <div className="rounded-xl border p-4 flex items-center justify-between gap-4" style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.muted + '40' }}>
          <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            No trades yet. Add your first trade to start tracking performance and see analytics.
          </p>
          <ShimmerButton
            size="sm"
            onClick={() => (window.location.href = '/add-trade')}
            style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
            shimmerColor="rgba(255, 255, 255, 0.4)"
          >
            Add First Trade
          </ShimmerButton>
        </div>
      )}

      {/* Metrics Grid */}
      <BlurFade delay={0} duration={0.5} y={12} blur={4}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 xl:gap-8">
        <StatCard
          title="Account Balance"
          value={formatCurrency(currentBalance)}
          icon={DollarSign}
          trend="neutral"
          numericValue={currentBalance}
          valuePrefix="$"
          valueDecimals={1}
        />
        <StatCard
          title="Total Trades"
          value={analytics.totalTrades}
          icon={Activity}
          trend="neutral"
          numericValue={analytics.totalTrades}
          valueDecimals={0}
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(analytics.winRate)}
          change={analytics.winRate >= 50 ? analytics.winRate - 50 : undefined}
          trend={analytics.winRate >= 50 ? 'up' : 'down'}
          icon={Target}
          valueColor={analytics.winRate >= 50 ? themeConfig.success : themeConfig.destructive}
          numericValue={analytics.winRate}
          valueSuffix="%"
          valueDecimals={2}
        />
        <StatCard
          title="Total P&L"
          value={formatCurrency(analytics.totalPnL)}
          trend={analytics.totalPnL >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          valueColor={analytics.totalPnL >= 0 ? themeConfig.success : themeConfig.destructive}
          numericValue={Math.abs(analytics.totalPnL)}
          valuePrefix={analytics.totalPnL >= 0 ? '+$' : '-$'}
          valueDecimals={1}
        />
        <StatCard
          title="Avg P&L"
          value={formatCurrency(analytics.averagePnL)}
          trend={analytics.averagePnL >= 0 ? 'up' : 'down'}
          icon={TrendingUp}
          valueColor={analytics.averagePnL >= 0 ? themeConfig.success : themeConfig.destructive}
          numericValue={Math.abs(analytics.averagePnL)}
          valuePrefix={analytics.averagePnL >= 0 ? '+$' : '-$'}
          valueDecimals={1}
        />
        <StatCard
          title="Current Streak"
          value={analytics.currentWinStreak > 0 ? `${analytics.currentWinStreak}W` : analytics.currentLossStreak > 0 ? `${analytics.currentLossStreak}L` : '0'}
          trend={analytics.currentWinStreak > 0 ? 'up' : analytics.currentLossStreak > 0 ? 'down' : 'neutral'}
          icon={Flame}
        />
        <StatCard
          title="Longest Win Streak"
          value={analytics.longestWinStreak}
          icon={Trophy}
          trend="neutral"
        />
      </div>
      </BlurFade>

      {/* Monthly Comparison */}
      {hasTrades && (
        <BlurFade delay={0.08} duration={0.5} y={12} blur={4}>
        <Card
          shineBorder
          className="p-4 transition-all duration-200"
          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5" style={{ color: themeConfig.accent }} />
            <h3 className="text-base font-semibold" style={{ color: themeConfig.foreground }}>
              This Month vs Last Month
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>This month P&L</p>
              <p className="font-semibold" style={{ color: monthlyComparison.thisMonthPnL >= 0 ? themeConfig.success : themeConfig.destructive }}>
                {formatCurrency(monthlyComparison.thisMonthPnL)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>Last month P&L</p>
              <p className="font-semibold" style={{ color: themeConfig.foreground }}>
                {formatCurrency(monthlyComparison.lastMonthPnL)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>P&L change</p>
              <p className="font-semibold" style={{ color: monthlyComparison.pnlChange >= 0 ? themeConfig.success : themeConfig.destructive }}>
                {monthlyComparison.pnlChange >= 0 ? '+' : ''}{formatCurrency(monthlyComparison.pnlChange)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>Trades (this/last)</p>
              <p className="font-semibold" style={{ color: themeConfig.foreground }}>
                {monthlyComparison.thisMonthTrades} / {monthlyComparison.lastMonthTrades}
              </p>
            </div>
          </div>
        </Card>
        </BlurFade>
      )}

      {/* Charts - same width as all other content */}
      <div className="space-y-8">
        {/* What to improve today - AI summary with actionable to-dos */}
        {hasTrades && (
          <ErrorBoundary fallback={null}>
            <ImproveTodayWidget
              insights={insights}
              insightsLoading={insightsLoading}
              fetchInsights={fetchInsights}
              trades={filteredTrades}
              journalId={activeJournal?.id}
            />
          </ErrorBoundary>
        )}

        <ChartCard
          title="P&L Over Time"
          subtitle="Account balance progression"
          minHeight={440}
          className="w-full"
          shineBorder
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
                <linearGradient id="equityGradient-pnl" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="equity"
                fill="url(#equityGradient-pnl)"
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
                name="Equity"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={true}
                animationDuration={500}
              />
              {/* Invisible line so pnl is in tooltip payload */}
              <Line dataKey="pnl" stroke="transparent" dot={false} hide />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Setup Grade Win Rate & Checklist Completion - under P&L */}
        {hasTrades && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.gradePerformance && analytics.gradePerformance.length > 0 && (
              <Card shineBorder className="p-4" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                  <Target className="w-4 h-4" style={{ color: themeConfig.accent }} />
                  Setup Grade Win Rate
                </h4>
                <div className="flex flex-wrap gap-3">
                  {analytics.gradePerformance.map(({ grade, trades, wins, winRate }) => (
                    <div key={grade} className="flex items-center gap-2">
                      <span
                        className="font-bold text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: grade === 'A' ? `${themeConfig.success}20` : grade === 'B' ? `${themeConfig.accent}20` : `${themeConfig.mutedForeground}20`,
                          color: grade === 'A' ? themeConfig.success : grade === 'B' ? themeConfig.accent : themeConfig.mutedForeground,
                        }}
                      >
                        {grade}
                      </span>
                      <span className="text-sm" style={{ color: winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                        {winRate.toFixed(0)}% ({wins}/{trades})
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {(analytics.checklistCompletion.pre.tradeCount > 0 || analytics.checklistCompletion.during.tradeCount > 0 || analytics.checklistCompletion.post.tradeCount > 0) && (
              <Card shineBorder className="p-4" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                  <CheckSquare className="w-4 h-4" style={{ color: themeConfig.accent }} />
                  Checklist Completion
                </h4>
                <div className="space-y-2">
                  {analytics.checklistCompletion.pre.tradeCount > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color: themeConfig.mutedForeground }}>Pre</span>
                        <span style={{ color: themeConfig.foreground }}>{analytics.checklistCompletion.pre.completionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: `${themeConfig.border}40` }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${analytics.checklistCompletion.pre.completionRate}%`, backgroundColor: analytics.checklistCompletion.pre.completionRate >= 100 ? themeConfig.success : themeConfig.destructive }}
                        />
                      </div>
                    </div>
                  )}
                  {analytics.checklistCompletion.during.tradeCount > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color: themeConfig.mutedForeground }}>During</span>
                        <span style={{ color: themeConfig.foreground }}>{analytics.checklistCompletion.during.completionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: `${themeConfig.border}40` }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${analytics.checklistCompletion.during.completionRate}%`, backgroundColor: analytics.checklistCompletion.during.completionRate >= 100 ? themeConfig.success : themeConfig.destructive }}
                        />
                      </div>
                    </div>
                  )}
                  {analytics.checklistCompletion.post.tradeCount > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color: themeConfig.mutedForeground }}>Post</span>
                        <span style={{ color: themeConfig.foreground }}>{analytics.checklistCompletion.post.completionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: `${themeConfig.border}40` }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${analytics.checklistCompletion.post.completionRate}%`, backgroundColor: analytics.checklistCompletion.post.completionRate >= 100 ? themeConfig.success : themeConfig.destructive }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Win/Loss Analysis */}
        <ChartCard
          title="Win/Loss Analysis"
          subtitle="Winning vs losing trades"
          minHeight={200}
          className="w-full"
          shineBorder
        >
          <div className="w-full min-h-[200px]" style={{ height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart 
              data={winLossData} 
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
                {winLossData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Wins' ? themeConfig.success : themeConfig.destructive}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

      {/* Goals Progress */}
      {goalsWithProgress.length > 0 && (
        <Card
          shineBorder
          className="p-6 transition-all duration-200"
          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${themeConfig.accent}12`, border: `1px solid ${themeConfig.accent}25` }}>
              <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: themeConfig.foreground }}>Goals</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalsWithProgress.map((g) => (
              <div key={g.id} className="space-y-2 p-3 rounded-xl border" style={{ borderColor: themeConfig.border }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: themeConfig.foreground }}>{g.title}</span>
                  <span className="text-sm font-semibold" style={{ color: g.progress >= 100 ? themeConfig.success : themeConfig.destructive }}>
                    {g.progress >= 100 ? 'Done' : `${Math.round(g.progress)}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${themeConfig.border}40` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(g.progress, 100)}%`,
                      backgroundColor: g.progress >= 100 ? themeConfig.success : themeConfig.destructive,
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                  {g.current} / {g.targetValue} {g.unit}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Analysis */}
      {hasTrades && (
        <Card
          shineBorder
          className="p-6 transition-all duration-200"
          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${themeConfig.accent}12`, border: `1px solid ${themeConfig.accent}25` }}>
                <Brain className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: themeConfig.foreground }}>AI Analysis</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analysis')}
              style={{ borderColor: themeConfig.border, color: themeConfig.accent }}
            >
              Full Analysis
            </Button>
          </div>
          {!insights ? (
            <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>Go to Analysis and click Refresh to get AI insights (requires 3+ new trades since last update).</p>
          ) : insights ? (
            <div className="space-y-3">
              {insights.summary && (
                <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.summary}</p>
              )}
              {insights.topAction && (
                <div className="rounded-lg p-3" style={{ backgroundColor: `${themeConfig.accent}10`, borderColor: `${themeConfig.accent}30` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: themeConfig.accent }}>Top Action</p>
                  <p className="text-sm" style={{ color: themeConfig.foreground }}>{insights.topAction}</p>
                </div>
              )}
              {(!insights.summary && !insights.topAction) && (
                <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>Add more trades and refresh for AI insights.</p>
              )}
            </div>
          ) : null}
        </Card>
      )}

      {/* Psychology Insights */}
      {hasTrades && analytics.emotionPerformance.length > 0 && (
        <Card
          shineBorder
          className="p-6 transition-all duration-200"
          style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${themeConfig.accent}12`, border: `1px solid ${themeConfig.accent}25` }}>
              <Brain className="w-5 h-5" style={{ color: themeConfig.accent }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: themeConfig.foreground }}>Psychology Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.emotionPerformance
              .filter((e) => e.count >= 2)
              .sort((a, b) => b.winRate - a.winRate)
              .slice(0, 6)
              .map((e) => (
                <div key={e.emotion} className="p-3 rounded-xl border flex justify-between items-center" style={{ borderColor: themeConfig.border }}>
                  <div>
                    <p className="font-medium capitalize" style={{ color: themeConfig.foreground }}>{e.emotion}</p>
                    <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                      {e.count} trades · {formatCurrency(e.totalPnL)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: e.winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                    {formatPercent(e.winRate)} win
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
      </div>
    </PageContainer>
  );
}
