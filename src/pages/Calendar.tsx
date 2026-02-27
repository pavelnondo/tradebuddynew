/**
 * Calendar Page - Trading Activity Heatmap
 * Fixed: P&L heatmap with intensity, day clicks, navigation, weekly view
 * Supports No Trade Days with chart observation notes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useApiTrades } from '../hooks/useApiTrades';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { useNoTradeDays, NoTradeDay } from '../hooks/useNoTradeDays';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatting';
import { Trade } from '@/types/trade';
import { NeonCard } from '@/components/ui/NeonCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { TradeCard } from '@/components/shared/TradeCard';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, FileText, Trash2, Upload, X, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DayData {
  date: Date;
  trades: Trade[];
  totalPnL: number;
  tradeCount: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  noTradeDay: NoTradeDay | null;
}

import { convertToStandardTrades } from '@/utils/tradeUtils';
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';
import { API_BASE_URL } from '@/config';
import { PageContainer } from '@/components/layout/PageContainer';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Calendar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeConfig, currentTheme } = useTheme();
  const { toast } = useToast();
  const { trades: apiTrades, isLoading, error, fetchTrades } = useApiTrades();
  const { activeJournal } = useAccountManagement();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [noTradeNotes, setNoTradeNotes] = useState('');
  const [noTradeScreenshot, setNoTradeScreenshot] = useState<string | null>(null);
  const [noTradeSaving, setNoTradeSaving] = useState(false);
  const [noTradeEditing, setNoTradeEditing] = useState(false);

  // Compute date range for calendar grid (must be before useNoTradeDays / fetch)
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - d.getDay());
      const start = new Date(d);
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - lastDay.getDay()));
    return { start, end };
  }, [currentDate, viewMode]);

  const { noTradeDays, fetchNoTradeDays, updateNoTradeDay, deleteNoTradeDay, error: noTradeError } = useNoTradeDays();

  useEffect(() => {
    if (activeJournal) {
      fetchTrades();
    }
  }, [activeJournal, fetchTrades]);

  useEffect(() => {
    if (activeJournal && location.pathname === '/calendar') {
      fetchNoTradeDays({
        journalId: activeJournal.id,
        startDate: toDateStr(dateRange.start),
        endDate: toDateStr(dateRange.end),
      });
    }
  }, [activeJournal?.id, dateRange.start.getTime(), dateRange.end.getTime(), fetchNoTradeDays, location.pathname, location.key]);

  // Refetch no-trade days when tab becomes visible (e.g. returning from Add No Trade Day)
  useEffect(() => {
    const onFocus = () => {
      if (activeJournal) {
        fetchNoTradeDays({
          journalId: activeJournal.id,
          startDate: toDateStr(dateRange.start),
          endDate: toDateStr(dateRange.end),
        });
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [activeJournal?.id, dateRange.start.getTime(), dateRange.end.getTime(), fetchNoTradeDays]);

  const allTrades = useMemo(() => convertToStandardTrades(apiTrades || []), [apiTrades]);
  
  const filteredTrades = useMemo(() => {
    if (!activeJournal) return allTrades;
    return allTrades.filter(t => t.accountId === activeJournal.id);
  }, [allTrades, activeJournal]);

  // Calculate P&L range for heatmap intensity
  const pnlRange = useMemo(() => {
    const pnls = filteredTrades.map(t => t.pnl);
    const maxPnL = Math.max(...pnls, 0);
    const minPnL = Math.min(...pnls, 0);
    const maxAbs = Math.max(Math.abs(maxPnL), Math.abs(minPnL));
    return { max: maxPnL, min: minPnL, maxAbs };
  }, [filteredTrades]);

  const getCalendarData = (): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'week') {
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay();
      startDate = new Date(d);
      startDate.setDate(d.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
      startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
      endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    }
    
    const days: DayData[] = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return (
          tradeDate.getFullYear() === date.getFullYear() &&
          tradeDate.getMonth() === date.getMonth() &&
          tradeDate.getDate() === date.getDate()
        );
      });
      const dateStr = toDateStr(date);
      const foundNoTrade = noTradeDays.find(n => {
        const nDate = (n.date || '').slice(0, 10);
        const jMatch = !activeJournal || String(n.journalId || '') === String(activeJournal.id || '');
        return nDate === dateStr && jMatch;
      }) || null;
      // Never show no-trade day on days that have trades (no-trade day = day without trades)
      const noTradeDay = dayTrades.length > 0 ? null : foundNoTrade;
      
      days.push({
        date: new Date(date),
        trades: dayTrades,
        totalPnL: dayTrades.reduce((sum, t) => sum + t.pnl, 0),
        tradeCount: dayTrades.length,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: date.getMonth() === month,
        noTradeDay,
      });
    }
    
    return days;
  };

  const calendarData = getCalendarData();
  const totalPnLForPeriod = useMemo(
    () => calendarData.reduce((sum, d) => sum + d.totalPnL, 0),
    [calendarData]
  );
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      } else {
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (dayData: DayData) => {
    setSelectedDate(dayData.date);
  };

  // Calculate heatmap color and intensity
  const getDayColor = (dayData: DayData): { bg: string; intensity: number } => {
    if (dayData.tradeCount === 0) {
      if (dayData.noTradeDay) {
        return { bg: 'rgba(59, 130, 246, 0.5)', intensity: 0.5 }; // Blue for no-trade days with notes
      }
      return { bg: themeConfig.card, intensity: 0 }; // Theme card color for empty days
    }

    const pnl = dayData.totalPnL;
    const intensity = pnlRange.maxAbs > 0 
      ? Math.min(Math.abs(pnl) / pnlRange.maxAbs, 1) 
      : 0;

    if (pnl > 0) {
      // Green gradient based on profit size
      return { 
        bg: `rgba(34, 197, 94, ${0.4 + intensity * 0.5})`, 
        intensity 
      };
    } else if (pnl < 0) {
      // Red gradient based on loss size
      return { 
        bg: `rgba(239, 68, 68, ${0.4 + intensity * 0.5})`, 
        intensity 
      };
    } else {
      return { bg: 'rgba(156, 163, 175, 0.4)', intensity: 0.3 }; // Grey for break-even
    }
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return calendarData.find(d => 
      d.date.getDate() === selectedDate.getDate() &&
      d.date.getMonth() === selectedDate.getMonth() &&
      d.date.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate, calendarData]);

  useEffect(() => {
    if (selectedDayData?.noTradeDay) {
      setNoTradeNotes(selectedDayData.noTradeDay.notes || '');
      setNoTradeScreenshot(selectedDayData.noTradeDay.screenshotUrl || null);
      setNoTradeEditing(false);
    } else if (selectedDate) {
      setNoTradeNotes('');
      setNoTradeScreenshot(null);
      setNoTradeEditing(false);
    }
  }, [selectedDate, selectedDayData?.noTradeDay?.id, selectedDayData?.noTradeDay?.notes, selectedDayData?.noTradeDay?.screenshotUrl]);

  const handleSaveNoTradeDay = async (): Promise<boolean> => {
    const existing = selectedDayData?.noTradeDay;
    if (!existing || !activeJournal) return false;
    setNoTradeSaving(true);
    try {
      const ok = await updateNoTradeDay(existing.id, { notes: noTradeNotes, screenshotUrl: noTradeScreenshot });
      if (ok) {
        toast({ title: 'Notes updated', description: 'Chart observations saved.' });
        await fetchNoTradeDays({
          journalId: activeJournal.id,
          startDate: toDateStr(dateRange.start),
          endDate: toDateStr(dateRange.end),
        });
        setNoTradeEditing(false);
        return true;
      } else {
        toast({ title: 'Failed to save', description: noTradeError || 'Could not update notes.', variant: 'destructive' });
        return false;
      }
    } finally {
      setNoTradeSaving(false);
    }
  };

  const handleNoTradeScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setNoTradeSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setNoTradeScreenshot(data.url || data.path || null);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setNoTradeSaving(false);
    }
  };

  const handleDeleteNoTradeDay = async () => {
    const existing = selectedDayData?.noTradeDay;
    if (!existing || !activeJournal) return;
    setNoTradeSaving(true);
    const ok = await deleteNoTradeDay(existing.id);
    if (ok) {
      setNoTradeNotes('');
      setNoTradeScreenshot(null);
      toast({ title: 'No Trade Day removed', description: 'Notes deleted.' });
      await fetchNoTradeDays({
        journalId: activeJournal.id,
        startDate: toDateStr(dateRange.start),
        endDate: toDateStr(dateRange.end),
      });
    }
    setNoTradeSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ color: themeConfig.mutedForeground }}>
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" style={{ color: themeConfig.destructive }}>
        <CalendarIcon className="w-12 h-12" />
        <p>Error loading calendar: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageContainer>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b"
        style={{ borderColor: themeConfig.border }}
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: themeConfig.foreground }}>
            <span style={{ color: themeConfig.accent }}>Trading</span> Calendar
          </h1>
          <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            Visualize your trading activity and performance over time
          </p>
        </div>
          <div className="flex gap-2">
          <NeonButton
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
          </NeonButton>
          <NeonButton
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
          </NeonButton>
        </div>
      </div>

      {/* Calendar Navigation */}
      <NeonCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => navigatePeriod('prev')}
              aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
            >
              <ChevronLeft className="w-4 h-4" />
            </NeonButton>
            
            <div className="flex flex-col">
            <h2 className="text-2xl font-bold" style={{ color: themeConfig.foreground }}>
                {viewMode === 'week' 
                  ? (() => {
                      const weekStart = new Date(currentDate);
                      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                      return `Week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()}`;
                    })()
                  : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                }
            </h2>
              <span
                className={`text-lg font-semibold ${totalPnLForPeriod > 0 ? 'text-green-500' : totalPnLForPeriod < 0 ? 'text-red-500' : ''}`}
                style={totalPnLForPeriod === 0 ? { color: themeConfig.mutedForeground } : {}}
              >
                {viewMode === 'week' ? 'Week' : 'Month'} total: {formatCurrency(totalPnLForPeriod)}
              </span>
            </div>
            
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => navigatePeriod('next')}
              aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
            >
              <ChevronRight className="w-4 h-4" />
            </NeonButton>
          </div>
          <NeonButton variant="secondary" size="sm" onClick={goToToday}>
            Today
          </NeonButton>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center p-2 text-sm font-medium" style={{ color: themeConfig.mutedForeground }}>
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarData.map((dayData, index) => {
            const { bg, intensity } = getDayColor(dayData);
            
            return (
              <motion.div
                key={index}
                className={`relative p-2 rounded-xl cursor-pointer transition-all duration-200 min-h-[80px] ${
                  !dayData.isCurrentMonth ? 'opacity-30' : ''
                } ${dayData.isToday ? 'ring-2' : ''}`}
                style={{
                  backgroundColor: bg,
                  border: `1px solid ${themeConfig.border}`,
                  ...(dayData.isToday ? { boxShadow: `0 0 0 2px ${themeConfig.accent}` } : {}),
                }}
                onClick={() => handleDayClick(dayData)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: dayData.tradeCount > 0
                        ? currentTheme === 'light'
                          ? 'rgba(0,0,0,0.9)'
                          : 'white'
                        : (dayData.noTradeDay ? 'white' : themeConfig.mutedForeground),
                      textShadow: (dayData.tradeCount > 0 || dayData.noTradeDay)
                        ? (currentTheme === 'light' ? '0 1px 2px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.4)')
                        : 'none',
                    }}
                  >
                  {dayData.date.getDate()}
                  </span>
                </div>
                {dayData.tradeCount > 0 && (
                  <div className="space-y-0.5 mt-0.5">
                    <div
                      className="text-xs font-bold"
                      style={{
                        color: currentTheme === 'light' ? 'rgba(0,0,0,0.9)' : 'white',
                        textShadow: currentTheme === 'light' ? '0 1px 2px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    >
                      {dayData.totalPnL >= 0 ? '+' : ''}{formatCurrency(dayData.totalPnL)}
                    </div>
                    <div
                      className="text-[10px] font-medium"
                      style={{
                        color: currentTheme === 'light' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)',
                        textShadow: currentTheme === 'light' ? '0 1px 2px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    >
                      {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </NeonCard>

      {/* Legend */}
      <NeonCard className="p-6" hover={false}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: themeConfig.foreground }}>Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }} />
            <span className="text-sm" style={{ color: themeConfig.foreground }}>Profitable Day</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
            <span className="text-sm" style={{ color: themeConfig.foreground }}>Loss Day</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: themeConfig.card, border: `1px solid ${themeConfig.border}` }} />
            <span className="text-sm" style={{ color: themeConfig.foreground }}>No Trades</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)', border: `1px solid ${themeConfig.border}` }} />
            <span className="text-sm" style={{ color: themeConfig.foreground }}>No Trade Day (notes)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg border-2 border-primary" />
            <span className="text-sm" style={{ color: themeConfig.foreground }}>Today</span>
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: themeConfig.mutedForeground }}>
          Color intensity indicates P&L magnitude
        </p>
      </NeonCard>

      {/* Day Details Sheet */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent
          className="w-full sm:max-w-2xl overflow-y-auto"
          style={{ backgroundColor: themeConfig.popover }}
        >
          <SheetHeader>
            <SheetTitle>
              {selectedDate && formatDate(selectedDate)}
            </SheetTitle>
            <SheetDescription>
              {selectedDayData?.tradeCount 
                ? `${selectedDayData.tradeCount} trade${selectedDayData.tradeCount !== 1 ? 's' : ''} on this day`
                : selectedDayData?.noTradeDay 
                  ? 'No trades — chart notes recorded'
                  : 'No trades on this date'}
            </SheetDescription>
          </SheetHeader>
          
          {selectedDayData && (
            <div className="mt-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{selectedDayData.tradeCount}</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${
                  selectedDayData.totalPnL > 0 ? 'bg-green-500/10' :
                  selectedDayData.totalPnL < 0 ? 'bg-red-500/10' :
                  'bg-muted'
                }`}>
                  <div className={`text-2xl font-bold ${
                    selectedDayData.totalPnL > 0 ? 'text-green-500' :
                    selectedDayData.totalPnL < 0 ? 'text-red-500' :
                    ''
                  }`}>
                    {formatCurrency(selectedDayData.totalPnL)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">
                    {selectedDayData.tradeCount > 0 
                      ? formatPercent((selectedDayData.trades.filter(t => t.pnl > 0).length / selectedDayData.tradeCount) * 100)
                      : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>

              {/* Trades List - each trade separated */}
              {selectedDayData.trades.length > 0 && (
                <div className="space-y-4">
                <h4 className="font-semibold">Trade Details</h4>
                  {selectedDayData.trades.map((trade, idx) => (
                    <div key={trade.id} className="space-y-2">
                      <div
                        className="text-xs font-medium px-2 py-0.5 rounded w-fit"
                        style={{ color: themeConfig.mutedForeground, backgroundColor: themeConfig.card }}
                      >
                        Trade {idx + 1} of {selectedDayData.trades.length}
                  </div>
                    <TradeCard
                      trade={trade}
                      showDetails={true}
                        onEdit={(t) => navigate(`/edit-trade/${t.id}`)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* No Trade Day - Card style like trade days, with Edit/Delete buttons */}
              {selectedDayData.tradeCount === 0 && selectedDayData.noTradeDay && (
                <motion.div
                  className="rounded-2xl p-4 transition-all duration-300"
                  style={{
                    backgroundColor: themeConfig.bg,
                    border: `1px solid ${themeConfig.border}`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {!noTradeEditing ? (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4" style={{ color: themeConfig.accent }} />
                            <span className="text-base font-semibold" style={{ color: themeConfig.foreground }}>
                              No trades taken
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: themeConfig.foreground }}>
                            {selectedDayData.noTradeDay.notes?.trim() || (
                              <span style={{ color: themeConfig.mutedForeground }}>Chart observations recorded</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <NeonButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setNoTradeEditing(true)}
                            className="!px-2 !py-1.5 !text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </NeonButton>
                          <NeonButton
                            variant="secondary"
                            size="sm"
                            onClick={handleDeleteNoTradeDay}
                            disabled={noTradeSaving}
                            className="!px-2 !py-1.5 !text-xs"
                          >
                            {noTradeSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3 mr-1" />Delete</>}
                          </NeonButton>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                          <FileText className="w-4 h-4" style={{ color: themeConfig.accent }} />
                          Edit chart observations
                        </h4>
                        <NeonButton variant="secondary" size="sm" onClick={() => setNoTradeEditing(false)}>
                          Cancel
                        </NeonButton>
                      </div>
                      <Textarea
                        placeholder="e.g. Consolidation, no clear setup, choppy market..."
                        value={noTradeNotes}
                        onChange={(e) => setNoTradeNotes(e.target.value)}
                        className="min-h-[100px]"
                        style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Screenshot</label>
                        {noTradeScreenshot ? (
                          <div className="relative inline-block">
                            <img
                              src={getScreenshotFullUrl(noTradeScreenshot)}
                              alt="Chart"
                              className="max-h-40 rounded-lg border object-cover"
                              style={{ borderColor: themeConfig.border }}
                            />
                            <button
                              type="button"
                              onClick={() => setNoTradeScreenshot(null)}
                              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: themeConfig.destructive, color: '#fff' }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed w-fit" style={{ borderColor: themeConfig.border }}>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Add screenshot</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleNoTradeScreenshotChange}
                            />
                          </label>
                )}
              </div>
                      <div className="flex gap-2">
                        <NeonButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveNoTradeDay()}
                          disabled={noTradeSaving}
                        >
                          {noTradeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </NeonButton>
                        <NeonButton variant="secondary" size="sm" onClick={() => setNoTradeEditing(false)}>
                          Cancel
                        </NeonButton>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      </PageContainer>
    </motion.div>
  );
}
