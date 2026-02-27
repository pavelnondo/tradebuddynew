/**
 * Trade Management Page - COMPLETELY REFACTORED
 * Features:
 * - Uses TradeCard component
 * - Integrated with useTradeStore for filtering/sorting
 * - Proper search, type, emotion, time filters
 * - Sorting by date, symbol, P&L
 * - Edit/delete actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, Clock, TrendingUp, TrendingDown, CheckCircle2, Edit as EditIcon, Lightbulb, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiTrades } from '../hooks/useApiTrades';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { useTradeStore } from '@/stores/useTradeStore';
import { TradeCard } from '@/components/shared/TradeCard';
import { TimeRangeSelector, TimeRange } from '@/components/shared/TimeRangeSelector';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Trade } from '@/types/trade';
import { tradeApi } from '@/services/tradeApi';
import { useToast } from '@/hooks/use-toast';

import { convertToStandardTrades } from '@/utils/tradeUtils';
import { formatCurrency, formatPercent, formatDate, formatDuration, stripVoiceNotePlaceholders, getVoiceNoteAudioUrl } from '@/utils/formatting';
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';
import { ScreenshotViewerModal } from '@/components/ScreenshotViewerModal';
import { PageContainer } from '@/components/layout/PageContainer';
import { useTheme } from '@/contexts/ThemeContext';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function TradeManagement() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const { trades: apiTrades, isLoading: loading, error, fetchTrades } = useApiTrades();
  const { activeJournal } = useAccountManagement();
  const { toast } = useToast();
  
  const {
    filters,
    sort,
    setFilter,
    setSort,
    setTrades,
  } = useTradeStore();

  const [localTrades, setLocalTrades] = useState<Trade[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [detailScreenshotUrl, setDetailScreenshotUrl] = useState<string | null>(null);

  // Convert and sync trades
  useEffect(() => {
    const converted = convertToStandardTrades(apiTrades || []);
    setLocalTrades(converted);
    setTrades(converted);
  }, [apiTrades, setTrades]);

  // Refetch when active journal changes
  useEffect(() => {
    if (activeJournal) {
      fetchTrades();
    }
  }, [activeJournal, fetchTrades]);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = localTrades;

    // Filter by journal
    if (activeJournal) {
      filtered = filtered.filter(t => t.accountId === activeJournal.id);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.symbol.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower) ||
        t.setupType.toLowerCase().includes(searchLower)
      );
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filter by emotion (matches any selected emotion for multi-emotion trades)
    if (filters.emotion !== 'all') {
      filtered = filtered.filter(t => {
        const ems = t.emotions && t.emotions.length > 0 ? t.emotions : [t.emotion];
        return ems.some(e => String(e).toLowerCase() === filters.emotion?.toLowerCase());
      });
    }

    // Filter by time range
    if (filters.timeRange !== 'ALL') {
      const now = new Date();
      const days = filters.timeRange === '7D' ? 7 : filters.timeRange === '30D' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => t.entryTime >= cutoff);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sort.direction === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sort.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [localTrades, activeJournal, filters, sort]);

  const handleEdit = (trade: Trade) => {
    navigate(`/edit-trade/${trade.id}`);
  };

  const handleDeleteClick = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tradeToDelete) return;
    const tradeId = tradeToDelete;
    setTradeToDelete(null);
    setDeleteDialogOpen(false);
    try {
      await tradeApi.deleteTrade(tradeId);
      await fetchTrades();
      toast({
        title: 'Trade Deleted',
        description: 'The trade has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trade',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (key: keyof Trade) => {
    if (sort.key === key) {
      setSort(key, sort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'desc');
    }
  };

  const SortButton: React.FC<{ sortKey: keyof Trade; label: string }> = ({ sortKey, label }) => {
    const isActive = sort.key === sortKey;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(sortKey)}
        className="flex items-center gap-1"
      >
        {label}
        {isActive && (
          sort.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        )}
        {!isActive && <ArrowUpDown className="w-3 h-3 opacity-50" />}
      </Button>
    );
  };

  if (loading) {
    return <LoadingState type="grid" count={6} className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">Trade Management</h1>
            <p className="text-muted-foreground">Manage your trading journal entries</p>
          </div>
          <ShimmerButton variant="default" onClick={() => navigate('/add-trade')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </ShimmerButton>
        </div>

        {/* Filters */}
        <Card shineBorder className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search trades..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="flex-1"
              />
              <Select
                value={filters.type}
                onValueChange={(value: any) => setFilter('type', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.emotion}
                onValueChange={(value: any) => setFilter('emotion', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emotions</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="excited">Excited</SelectItem>
                  <SelectItem value="nervous">Nervous</SelectItem>
                  <SelectItem value="frustrated">Frustrated</SelectItem>
                  <SelectItem value="greedy">Greedy</SelectItem>
                  <SelectItem value="fearful">Fearful</SelectItem>
                  <SelectItem value="fomo">FOMO</SelectItem>
                  <SelectItem value="satisfied">Satisfied</SelectItem>
                  <SelectItem value="disappointed">Disappointed</SelectItem>
                </SelectContent>
              </Select>
              <TimeRangeSelector
                value={filters.timeRange as TimeRange}
                onChange={(value) => setFilter('timeRange', value)}
              />
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <SortButton sortKey="entryTime" label="Date" />
              <SortButton sortKey="symbol" label="Symbol" />
              <SortButton sortKey="pnl" label="P&L" />
              <SortButton sortKey="pnlPercent" label="P&L%" />
            </div>
          </div>
        </Card>

        {/* Trades Grid */}
        {filteredAndSortedTrades.length === 0 ? (
          <EmptyState
            title={
              filters.search || filters.type !== 'all' || filters.emotion !== 'all'
                ? 'No trades found'
                : 'No trades yet'
            }
            description={
              filters.search || filters.type !== 'all' || filters.emotion !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Start tracking your trading activity by adding your first trade'
            }
            action={
              !filters.search && filters.type === 'all' && filters.emotion === 'all'
                ? {
                    label: 'Add Your First Trade',
                    onClick: () => navigate('/add-trade'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onViewDetails={(t) => setDetailTrade(t)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* Trade Detail Sheet - full scrollable panel (Magic MCP / 21st.dev inspired: detail drawer + staggered motion) */}
        <Sheet open={!!detailTrade} onOpenChange={(open) => !open && setDetailTrade(null)}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-2xl flex flex-col overflow-hidden p-0"
            style={{ backgroundColor: themeConfig.bg, borderLeftColor: themeConfig.border }}
          >
            {detailTrade && (
              <>
                <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b" style={{ borderColor: themeConfig.border }}>
                  <SheetTitle className="flex items-center gap-3" style={{ color: themeConfig.foreground }}>
                    <span>{detailTrade.symbol}</span>
                    <span className={`text-sm px-3 py-1 rounded-full ${detailTrade.type === 'buy' || detailTrade.type === 'long' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                      {detailTrade.type.toUpperCase()}
                    </span>
                    {detailTrade.tradeGrade && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${detailTrade.tradeGrade === 'A' ? 'bg-emerald-500/20 text-emerald-700' : detailTrade.tradeGrade === 'B' ? 'bg-blue-500/20 text-blue-700' : 'bg-gray-500/20 text-gray-700'}`}>
                        {detailTrade.tradeGrade}
                      </span>
                    )}
                    <span className={`text-lg font-bold ml-auto ${detailTrade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {detailTrade.pnl >= 0 ? '+' : ''}{formatCurrency(detailTrade.pnl)}
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <motion.div
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-8"
                  style={{ backgroundColor: themeConfig.bg }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Metrics */}
                  <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  >
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4" style={{ color: themeConfig.mutedForeground }} />
                        <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Entry</span>
                      </div>
                      <div className="font-semibold" style={{ color: themeConfig.foreground }}>{formatCurrency(detailTrade.entryPrice)}</div>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4" style={{ color: themeConfig.mutedForeground }} />
                        <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Exit</span>
                      </div>
                      <div className="font-semibold">{detailTrade.exitPrice ? formatCurrency(detailTrade.exitPrice) : 'Open'}</div>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" style={{ color: themeConfig.mutedForeground }} />
                        <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Date</span>
                      </div>
                      <div className="font-semibold">{formatDate(detailTrade.entryTime)}</div>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" style={{ color: themeConfig.mutedForeground }} />
                        <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Duration</span>
                      </div>
                      <div className="font-semibold">{detailTrade.duration > 0 ? formatDuration(detailTrade.duration) : '—'}</div>
                    </div>
                  </motion.div>

                  {((detailTrade.rMultiple != null && Number.isFinite(detailTrade.rMultiple)) || (detailTrade.plannedRR != null && Number.isFinite(detailTrade.plannedRR)) || detailTrade.session) && (
                    <motion.div
                      className="pt-4 border-t border-dashed flex flex-wrap gap-4"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                    >
                      {detailTrade.rMultiple != null && Number.isFinite(detailTrade.rMultiple) && (
                        <span className="text-sm">
                          <span className="text-muted-foreground">R: </span>
                          <span className={`font-semibold ${detailTrade.rMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>{detailTrade.rMultiple}x</span>
                        </span>
                      )}
                      {detailTrade.plannedRR != null && Number.isFinite(detailTrade.plannedRR) && (
                        <span className="text-sm">
                          <span className="text-muted-foreground">Risk/Reward: </span>
                          <span className="font-semibold">1:{detailTrade.plannedRR}</span>
                        </span>
                      )}
                      {detailTrade.session && (
                        <span className="text-sm">
                          <span className="text-muted-foreground">Session: </span>
                          <span className="font-semibold">{detailTrade.session}</span>
                        </span>
                      )}
                    </motion.div>
                  )}

                  {detailTrade.setupType && (
                    <motion.div
                      className="pt-4 border-t border-dashed"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.12 }}
                    >
                      <span className="text-sm text-muted-foreground">Setup: </span>
                      <span className="font-medium">{detailTrade.setupType}</span>
                    </motion.div>
                  )}

                  {(detailTrade.notes && stripVoiceNotePlaceholders(detailTrade.notes)) || (() => {
                    const all = detailTrade.voiceNoteUrls || [];
                    const notesOnly = all.filter((vn: { field?: string }) => (vn as { field?: string }).field === 'notes' || (vn as { field?: string }).field === undefined);
                    return notesOnly.length > 0;
                  })() ? (
                    <motion.div
                      className="pt-4 border-t border-dashed rounded-xl bg-amber-500/5 p-4"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.14 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <EditIcon className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-sm">Notes</span>
                      </div>
                      {detailTrade.notes && stripVoiceNotePlaceholders(detailTrade.notes) && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stripVoiceNotePlaceholders(detailTrade.notes)}</p>
                      )}
                      {(() => {
                        const all = detailTrade.voiceNoteUrls || [];
                        const notesOnly = all.filter((vn: { url?: string; field?: string }) => {
                          const f = (vn as { field?: string }).field;
                          return f === 'notes' || f === undefined;
                        });
                        if (notesOnly.length === 0) return null;
                        return (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Voice notes</p>
                            {notesOnly.map((vn: { url?: string; duration?: number }, idx: number) => {
                              const url = typeof vn === 'string' ? vn : (vn?.url || '');
                              if (!url) return null;
                              return (
                                <div key={idx}>
                                  <AudioPlayer
                                    src={getVoiceNoteAudioUrl(url)}
                                    duration={vn?.duration}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : null}

                  {(detailTrade.lessonsLearned || (detailTrade.voiceNoteUrls && detailTrade.voiceNoteUrls.some((vn: { field?: string }) => (vn as { field?: string }).field === 'lessons'))) && (
                    <motion.div
                      className="pt-4 border-t border-dashed rounded-xl bg-emerald-500/5 p-4"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.16 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-sm">Lessons Learnt</span>
                      </div>
                      {stripVoiceNotePlaceholders(detailTrade.lessonsLearned || '') && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stripVoiceNotePlaceholders(detailTrade.lessonsLearned || '')}</p>
                      )}
                      {(() => {
                        const all = detailTrade.voiceNoteUrls || [];
                        const lessonsOnly = all.filter((vn: { url?: string; field?: string }) => {
                          const f = (vn as { field?: string }).field;
                          return f === 'lessons';
                        });
                        if (lessonsOnly.length === 0) return null;
                        return (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Voice notes</p>
                          {lessonsOnly.map((vn: { url?: string; duration?: number }, idx: number) => {
                            const url = typeof vn === 'string' ? vn : (vn?.url || '');
                            if (!url) return null;
                            return (
                              <div key={idx}>
                                <AudioPlayer
                                  src={getVoiceNoteAudioUrl(url)}
                                  duration={vn?.duration}
                                />
                              </div>
                            );
                          })}
                        </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {((detailTrade.checklistItems?.length ?? 0) + (detailTrade.duringChecklistItems?.length ?? 0) + (detailTrade.postChecklistItems?.length ?? 0) + (detailTrade.ruleItems?.length ?? 0)) > 0 && (
                    <motion.div
                      className="pt-4 border-t border-dashed rounded-xl p-4"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.18 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-sm">Rules & Checklists</span>
                      </div>
                      <div className="space-y-3">
                        {detailTrade.checklistItems && detailTrade.checklistItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Pre: {detailTrade.checklistItems.filter(i => i.completed).length}/{detailTrade.checklistItems.length}</p>
                            <div className="flex flex-wrap gap-1">
                              {detailTrade.checklistItems.map((item, idx) => (
                                <span key={item.id || idx} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/15 text-red-600'}`}>
                                  {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />} {item.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {detailTrade.duringChecklistItems && detailTrade.duringChecklistItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">During: {detailTrade.duringChecklistItems.filter(i => i.completed).length}/{detailTrade.duringChecklistItems.length}</p>
                            <div className="flex flex-wrap gap-1">
                              {detailTrade.duringChecklistItems.map((item, idx) => (
                                <span key={item.id || idx} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/15 text-red-600'}`}>
                                  {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />} {item.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {detailTrade.postChecklistItems && detailTrade.postChecklistItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Post: {detailTrade.postChecklistItems.filter(i => i.completed).length}/{detailTrade.postChecklistItems.length}</p>
                            <div className="flex flex-wrap gap-1">
                              {detailTrade.postChecklistItems.map((item, idx) => (
                                <span key={item.id || idx} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/15 text-red-600'}`}>
                                  {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />} {item.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {detailTrade.ruleItems && detailTrade.ruleItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Rules: {detailTrade.ruleItems.filter(i => i.completed).length}/{detailTrade.ruleItems.length}</p>
                            <div className="flex flex-wrap gap-1">
                              {detailTrade.ruleItems.map((item, idx) => (
                                <span key={item.id || idx} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${item.completed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/15 text-red-600'}`}>
                                  {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />} {item.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {detailTrade.tags && detailTrade.tags.length > 0 && (
                    <motion.div
                      className="pt-4 border-t border-dashed flex flex-wrap gap-2"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.2 }}
                    >
                      {detailTrade.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-muted text-sm" style={{ backgroundColor: themeConfig.muted }}>{tag}</span>
                      ))}
                    </motion.div>
                  )}

                  {detailTrade.screenshot && (
                    <motion.div
                      className="pt-4 border-t border-dashed rounded-xl p-4"
                      style={{ borderColor: themeConfig.border }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.22 }}
                    >
                      <span className="font-semibold text-sm block mb-2">Screenshot</span>
                      <button
                        type="button"
                        onClick={() => setDetailScreenshotUrl(detailTrade.screenshot!)}
                        className="block w-full rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                        aria-label="View screenshot enlarged"
                      >
                        <img
                          src={getScreenshotFullUrl(detailTrade.screenshot)}
                          alt="Trade screenshot"
                          className="max-w-full rounded-lg object-contain max-h-64 w-full"
                        />
                      </button>
                    </motion.div>
                  )}

                  <motion.div
                    className="flex gap-2 pt-4 border-t border-dashed"
                    style={{ borderColor: themeConfig.border }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.25 }}
                  >
                    <Button onClick={() => { handleEdit(detailTrade); setDetailTrade(null); }} className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Trade
                    </Button>
                    <Button variant="outline" onClick={() => setDetailTrade(null)}>Close</Button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete trade?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trade? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ScreenshotViewerModal
          open={!!detailScreenshotUrl}
          onOpenChange={(open) => !open && setDetailScreenshotUrl(null)}
          screenshotUrl={detailScreenshotUrl}
        />
      </PageContainer>
    </div>
  );
}
