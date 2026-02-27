import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Eye,
  Image as ImageIcon,
  Activity,
  Target,
  LayoutGrid,
  List,
  Mic
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';
import { useApiTrades } from '@/hooks/useApiTrades';
import { ScreenshotViewerModal } from '@/components/ScreenshotViewerModal';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tradeApi } from '@/services/tradeApi';
import { SavedFilterSets } from '@/components/SavedFilterSets';
import { cn } from "@/lib/utils";
import { PageContainer } from '@/components/layout/PageContainer';
import { stripVoiceNotePlaceholders, getVoiceNoteAudioUrl } from '@/utils/formatting';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function TradeHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { themeConfig } = useTheme();
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  const { journals = [], activeJournal } = useAccountManagement();
  
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') ?? '');

  // Sync search state when URL search param changes (e.g. from Layout header search)
  useEffect(() => {
    const q = searchParams.get('search') ?? '';
    if (q !== searchTerm) setSearchTerm(q);
  }, [searchParams]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [screenshotToView, setScreenshotToView] = useState<string | null>(null);
  const [compactView, setCompactView] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditEmotion, setBulkEditEmotion] = useState('');
  const [bulkEditing, setBulkEditing] = useState(false);
  const [expandedVoiceNotes, setExpandedVoiceNotes] = useState<Set<string>>(new Set());
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  const toggleVoiceNotes = (tradeId: string) => {
    setExpandedVoiceNotes(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const toggleTradeExpanded = (tradeId: string) => {
    setExpandedTrades(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const openScreenshot = (url: string) => {
    setScreenshotToView(url);
    setScreenshotModalOpen(true);
  };

  // Motion variants (Context7 / Framer Motion: stagger list pattern)
  const tradeListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.06,
      },
    },
  };

  const tradeCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  // Emotion color mapping for better visual emphasis
  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      'Confident': '#10b981', // Green
      'Calm': '#3b82f6', // Blue
      'Excited': '#f59e0b', // Amber
      'Nervous': '#ef4444', // Red
      'Frustrated': '#dc2626', // Dark Red
      'Greedy': '#7c3aed', // Purple
      'Fearful': '#6b7280', // Gray
      'FOMO': '#ec4899', // Pink
      'Satisfied': '#059669', // Dark Green
      'Disappointed': '#f97316' // Orange
    };
    return emotionColors[emotion] || '#6b7280';
  };

  // Refetch trades when active journal changes
  useEffect(() => {
    if (activeJournal) {
      fetchTrades();
    }
  }, [activeJournal, fetchTrades]);

  const handleAddTrade = useCallback(() => {
    navigate('/add-trade');
  }, [navigate]);

  const handleViewTrade = useCallback((tradeId: string) => {
    navigate(`/trade/${tradeId}`);
  }, [navigate]);

  const handleEditTrade = useCallback((tradeId: string) => {
    navigate(`/edit-trade/${tradeId}`);
  }, [navigate]);

  // Refresh trades when returning from edit page
  useEffect(() => {
    if (location.pathname === '/trade-history') {
      fetchTrades();
    }
  }, [location.pathname, fetchTrades]);

  const handleDeleteTrade = useCallback(async (tradeId: string) => {
    try {
      await tradeApi.deleteTrade(tradeId);
      await fetchTrades();
      toast({
        title: "Trade deleted",
        description: "The trade has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the trade. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchTrades, toast]);

  const handleBulkEdit = useCallback(async () => {
    if (selectedTrades.length === 0 || !bulkEditEmotion) return;
    setBulkEditing(true);
    try {
      for (const tradeId of selectedTrades) {
        await tradeApi.updateTrade(tradeId, {
          emotion: bulkEditEmotion || undefined,
        } as any);
      }
      setSelectedTrades([]);
      setBulkEditOpen(false);
      setBulkEditEmotion('');
      await fetchTrades();
      toast({ title: 'Bulk edit complete', description: `Updated ${selectedTrades.length} trades.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update trades', variant: 'destructive' });
    } finally {
      setBulkEditing(false);
    }
  }, [selectedTrades, bulkEditEmotion, fetchTrades, toast]);

  const handleBulkDelete = useCallback(async () => {
    try {
      for (const tradeId of selectedTrades) {
        await tradeApi.deleteTrade(tradeId);
      }
      setSelectedTrades([]);
      await fetchTrades();
      toast({
        title: "Trades deleted",
        description: `${selectedTrades.length} trades have been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some trades. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedTrades, fetchTrades, toast]);

  const filteredTrades = useMemo(() => {
    let filtered = trades || [];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.emotion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by account - only filter if a specific account is selected
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(trade => trade.accountId === selectedAccount);
    }
    // If 'all' is selected, show trades from all accounts (no filtering)

    // Sort trades
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'profit':
          aValue = a.profitLoss || 0;
          bValue = b.profitLoss || 0;
          break;
        case 'asset':
          aValue = a.asset || '';
          bValue = b.asset || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, searchTerm, selectedAccount, sortBy, sortOrder, activeJournal]);

  const { totalProfitLoss, winningTrades, losingTrades, winRate } = useMemo(() => {
    const total = filteredTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const wins = filteredTrades.filter(trade => trade.profitLoss > 0).length;
    const losses = filteredTrades.filter(trade => trade.profitLoss < 0).length;
    const rate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    return { totalProfitLoss: total, winningTrades: wins, losingTrades: losses, winRate: rate };
  }, [filteredTrades]);

  const handleExportTrades = useCallback((format: 'csv' | 'json' | 'pdf' = 'json') => {
    try {
      if (filteredTrades.length === 0) {
        toast({
          title: "No trades to export",
          description: "There are no trades to export.",
          variant: "destructive",
        });
        return;
      }

      if (format === 'json') {
        const data = {
          trades: filteredTrades,
          exportedAt: new Date().toISOString(),
          summary: {
            totalTrades: filteredTrades.length,
            totalPnL: totalProfitLoss,
            winRate: winRate,
            winningTrades: winningTrades,
            losingTrades: losingTrades,
          }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const headers = ['Date', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Quantity', 'P&L', 'P&L %', 'Emotion', 'Setup', 'Notes'];
        const rows = filteredTrades.map(trade => [
          new Date(trade.date).toLocaleDateString(),
          trade.asset || '',
          trade.tradeType || '',
          trade.entryPrice || 0,
          trade.exitPrice || '',
          trade.positionSize || 0,
          trade.profitLoss || 0,
          trade.pnlPercent || 0,
          trade.emotion || '',
          trade.setup || '',
          (trade.notes || '').replace(/,/g, ';'), // Replace commas in notes
        ]);
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // For PDF, we'll create a simple HTML table and use browser print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Trade History Export</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; }
                  .summary { margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <h1>Trade History Export</h1>
                <div class="summary">
                  <p><strong>Total Trades:</strong> ${filteredTrades.length}</p>
                  <p><strong>Total P&L:</strong> $${totalProfitLoss.toFixed(2)}</p>
                  <p><strong>Win Rate:</strong> ${winRate.toFixed(2)}%</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>P&L</th>
                      <th>Emotion</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredTrades.map(trade => `
                      <tr>
                        <td>${new Date(trade.date).toLocaleDateString()}</td>
                        <td>${trade.asset || ''}</td>
                        <td>${trade.tradeType || ''}</td>
                        <td>$${trade.entryPrice || 0}</td>
                        <td>$${trade.exitPrice || ''}</td>
                        <td>$${trade.profitLoss || 0}</td>
                        <td>${trade.emotion || ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }

      toast({
        title: "Export successful",
        description: `Your trades have been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export trades. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredTrades, totalProfitLoss, winRate, winningTrades, losingTrades, toast]);

  // Emotion analysis functions - memoized
  const getEmotionPerformance = useCallback(() => {
    const emotionStats = filteredTrades.reduce((acc, trade) => {
      const emotion = trade.emotion || 'Unknown';
      if (!acc[emotion]) {
        acc[emotion] = { trades: 0, wins: 0, totalPnL: 0 };
      }
      acc[emotion].trades++;
      if (trade.profitLoss > 0) acc[emotion].wins++;
      acc[emotion].totalPnL += trade.profitLoss || 0;
      return acc;
    }, {} as Record<string, { trades: number; wins: number; totalPnL: number }>);

    return Object.entries(emotionStats).map(([emotion, stats]) => ({
      emotion,
      trades: stats.trades,
      wins: stats.wins,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
      totalPnL: stats.totalPnL
    })).sort((a, b) => b.trades - a.trades);
  }, [filteredTrades]);

  const getTopPerformingEmotions = useCallback(() => {
    return getEmotionPerformance().filter(e => e.trades >= 2).sort((a, b) => b.totalPnL - a.totalPnL);
  }, [getEmotionPerformance]);

  // Setup grade (A, B, C) performance
  const getGradePerformance = useCallback(() => {
    const gradeOrder = ['A', 'B', 'C'];
    const gradeStats = filteredTrades
      .filter((t: { tradeGrade?: string }) => t.tradeGrade && ['A', 'B', 'C'].includes(String(t.tradeGrade).toUpperCase()))
      .reduce((acc: Record<string, { trades: number; wins: number; totalPnL: number }>, trade: { tradeGrade?: string; profitLoss?: number }) => {
        const grade = String(trade.tradeGrade).toUpperCase();
        if (!acc[grade]) acc[grade] = { trades: 0, wins: 0, totalPnL: 0 };
        acc[grade].trades++;
        if ((trade.profitLoss ?? 0) > 0) acc[grade].wins++;
        acc[grade].totalPnL += trade.profitLoss ?? 0;
        return acc;
      }, {});
    return gradeOrder.map(grade => ({
      grade,
      trades: gradeStats[grade]?.trades ?? 0,
      wins: gradeStats[grade]?.wins ?? 0,
      winRate: (gradeStats[grade]?.trades ?? 0) > 0 ? (gradeStats[grade]!.wins / gradeStats[grade]!.trades) * 100 : 0,
      totalPnL: gradeStats[grade]?.totalPnL ?? 0,
    })).filter(g => g.trades > 0);
  }, [filteredTrades]);

  const getPsychologyTips = useCallback(() => {
    const emotionStats = getEmotionPerformance();
    const tips = [];

    // Find most common emotion
    const mostCommon = emotionStats[0];
    if (mostCommon && mostCommon.trades >= 3) {
      if (mostCommon.emotion === 'Nervous' || mostCommon.emotion === 'Fearful') {
        tips.push("You trade most when nervous/fearful. Consider reducing position sizes during these times.");
      } else if (mostCommon.emotion === 'Greedy' || mostCommon.emotion === 'FOMO') {
        tips.push("Greed/FOMO trades are common. Set strict entry/exit rules to avoid emotional decisions.");
      } else if (mostCommon.emotion === 'Confident' || mostCommon.emotion === 'Calm') {
        tips.push("Great! You trade best when confident/calm. Try to replicate these emotional states.");
      }
    }

    // Find worst performing emotion
    const worstPerforming = emotionStats.find(e => e.trades >= 2 && e.winRate < 40);
    if (worstPerforming) {
      tips.push(`Avoid trading when feeling ${worstPerforming.emotion.toLowerCase()} - your win rate is only ${worstPerforming.winRate.toFixed(1)}%.`);
    }

    // General tips
    if (tips.length === 0) {
      tips.push("Track your emotions consistently to identify patterns in your trading psychology.");
      tips.push("Consider taking breaks when feeling strong emotions like greed or fear.");
      tips.push("Practice mindfulness techniques to maintain emotional balance while trading.");
    }

    return tips.slice(0, 3);
  }, [getEmotionPerformance]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeConfig.bg }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: themeConfig.accent }} />
          <p style={{ color: themeConfig.foreground }}>Loading trades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeConfig.bg }}>
        <Card className="p-6 text-center" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: themeConfig.foreground }}>Error Loading Trades</h3>
          <p className="mb-4" style={{ color: themeConfig.mutedForeground }}>{error}</p>
          <Button onClick={fetchTrades} style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ backgroundColor: themeConfig.bg }}
    >
      <PageContainer>
        {/* Header Section */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pb-8 border-b"
          style={{ borderColor: themeConfig.border }}
        >
          <div className="flex-1">
            <h1 
              className="text-3xl font-semibold tracking-tight mb-2" 
              style={{ color: themeConfig.foreground }}
            >
              Trade <span style={{ color: themeConfig.accent }}>History</span>
            </h1>
            <p 
              className="text-sm"
              style={{ color: themeConfig.mutedForeground }}
            >
              View and manage all your trades across all accounts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" style={{ borderColor: themeConfig.border }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportTrades('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportTrades('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportTrades('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant={compactView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCompactView(!compactView)}
              title={compactView ? 'Detailed view' : 'Compact view'}
              aria-label={compactView ? 'Switch to detailed view' : 'Switch to compact view'}
              style={compactView ? { backgroundColor: themeConfig.accent, color: themeConfig.accentForeground } : { borderColor: themeConfig.border }}
            >
              {compactView ? <LayoutGrid className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
              {compactView ? 'Detailed' : 'Compact'}
            </Button>
            <ShimmerButton 
              onClick={handleAddTrade}
              size="sm"
              style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
              shimmerColor="rgba(255, 255, 255, 0.4)"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </ShimmerButton>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <BlurFade delay={0.05} duration={0.5} y={12} blur={4}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <Activity className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>Total Trades</p>
                <p className="text-3xl font-semibold tracking-tight" style={{ color: themeConfig.foreground }}>{filteredTrades.length}</p>
              </div>
            </div>
            <p className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>All time</p>
          </Card>

          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.success}12`,
                  border: `1px solid ${themeConfig.success}25`
                }}
              >
                <DollarSign className="w-5 h-5" style={{ color: themeConfig.success }} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>Total P&L</p>
                <p 
                  className="text-3xl font-semibold tracking-tight"
                  style={{ color: totalProfitLoss >= 0 ? themeConfig.success : themeConfig.destructive }}
                >
                  {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>Net profit/loss</p>
          </Card>

          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>Win Rate</p>
                <p className="text-3xl font-semibold tracking-tight" style={{ color: winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>{winRate.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>{winningTrades}W / {losingTrades}L</p>
          </Card>

          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>Avg Trade</p>
                <p className="text-3xl font-semibold tracking-tight" style={{ color: themeConfig.foreground }}>
                  {filteredTrades.length > 0 ? `$${(totalProfitLoss / filteredTrades.length).toFixed(2)}` : '$0.00'}
                </p>
              </div>
            </div>
            <p className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>Per trade</p>
          </Card>
          </div>
        </BlurFade>

        {/* Filters and Search */}
        <BlurFade delay={0.07} duration={0.5} y={12} blur={4}>
          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <Filter className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <h3 
                className="text-xl font-semibold"
                style={{ color: themeConfig.foreground }}
              >
                Filters & Search
              </h3>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4 flex-1">
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: themeConfig.mutedForeground }} />
                  <Input
                    placeholder="Search trades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    style={{ 
                      backgroundColor: themeConfig.card, 
                      borderColor: themeConfig.border,
                      color: themeConfig.foreground
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Account</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {journals.map(journal => (
                      <SelectItem key={journal.id} value={journal.id}>
                        {journal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SavedFilterSets
                onApplyFilterSet={(filters) => {
                  if (filters.symbol) setSearchTerm(filters.symbol);
                  else if (filters.setupType) setSearchTerm(filters.setupType);
                  else setSearchTerm('');
                }}
                currentFilters={{ symbol: searchTerm || undefined }}
              />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="profit">Profit/Loss</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>Order</label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </BlurFade>

        {/* Setup Grade Performance Chart */}
        {getGradePerformance().length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="p-2.5 rounded-xl"
                  style={{ 
                    backgroundColor: `${themeConfig.accent}12`,
                    border: `1px solid ${themeConfig.accent}25`
                  }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: themeConfig.accent }} />
                </div>
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: themeConfig.foreground }}
                >
                  Setup Grade Win Rate
                </h3>
              </div>
              <div className="space-y-4">
                {getGradePerformance().map(({ grade, trades, wins, winRate }) => (
                  <div key={grade} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ 
                        color: grade === 'A' ? themeConfig.success : grade === 'B' ? themeConfig.accent : themeConfig.mutedForeground 
                      }}>
                        Grade {grade}
                      </span>
                      <span className="text-sm" style={{ color: winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                        {winRate.toFixed(1)}% win rate ({wins}/{trades} wins)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${themeConfig.border}40` }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
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
          </motion.div>
        )}

        {/* Emotion Insights Section */}
        <motion.div variants={itemVariants}>
          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <h3 
                className="text-xl font-semibold"
                style={{ color: themeConfig.foreground }}
              >
                Trading Psychology Insights
              </h3>
            </div>
            
            {filteredTrades.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Emotion Performance */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold" style={{ color: themeConfig.foreground }}>Emotion Performance</h4>
                  {getEmotionPerformance().map((emotion) => (
                    <div key={emotion.emotion} className="flex items-center justify-between p-3 rounded-lg" 
                         style={{ backgroundColor: `${getEmotionColor(emotion.emotion)}10` }}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getEmotionColor(emotion.emotion) }}
                        />
                        <span className="font-medium" style={{ color: themeConfig.foreground }}>
                          {emotion.emotion}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: emotion.winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                          {emotion.winRate.toFixed(1)}%
                        </div>
                        <div className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                          {emotion.trades} trades
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Performing Emotions */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold" style={{ color: themeConfig.foreground }}>Best Performing Emotions</h4>
                  {getTopPerformingEmotions().slice(0, 3).map((emotion, index) => (
                    <div key={emotion.emotion} className="flex items-center justify-between p-3 rounded-lg" 
                         style={{ backgroundColor: `${themeConfig.success}10` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                             style={{ backgroundColor: themeConfig.success, color: themeConfig.accentForeground }}>
                          {index + 1}
                        </div>
                        <span className="font-medium" style={{ color: themeConfig.foreground }}>
                          {emotion.emotion}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: themeConfig.success }}>
                          +${emotion.totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: emotion.winRate >= 50 ? themeConfig.success : themeConfig.destructive }}>
                          {emotion.winRate.toFixed(1)}% win rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Psychology Tips */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold" style={{ color: themeConfig.foreground }}>Psychology Tips</h4>
                  {getPsychologyTips().map((tip, index) => (
                    <div key={index} className="p-3 rounded-lg" 
                         style={{ backgroundColor: `${themeConfig.accent}10` }}>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                             style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}>
                          💡
                        </div>
                        <p className="text-sm" style={{ color: themeConfig.foreground }}>
                          {tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: themeConfig.mutedForeground }} />
                <p style={{ color: themeConfig.mutedForeground }}>
                  Add trades to see your trading psychology insights
                </p>
              </div>
            )}
            </Card>
          </motion.div>

        {/* Bulk Actions */}
        {selectedTrades.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-4" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
                  {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" style={{ borderColor: themeConfig.border }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Bulk Edit
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-3" style={{ backgroundColor: themeConfig.popover, borderColor: themeConfig.border }}>
                      <label className="text-xs font-medium mb-2 block" style={{ color: themeConfig.foreground }}>Set emotion</label>
                      <select
                        value={bulkEditEmotion}
                        onChange={(e) => setBulkEditEmotion(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
                        style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                      >
                        <option value="">Select emotion</option>
                        {['Confident','Calm','Excited','Nervous','Frustrated','Greedy','Fearful','FOMO','Satisfied','Disappointed'].map(em => (
                          <option key={em} value={em.toLowerCase()}>{em}</option>
                        ))}
                      </select>
                      <Button 
                        size="sm" 
                        onClick={handleBulkEdit} 
                        disabled={!bulkEditEmotion || bulkEditing}
                        style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
                      >
                        {bulkEditing ? 'Updating...' : 'Apply'}
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTrades([])} style={{ borderColor: themeConfig.border }}>
                    Clear Selection
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Trades List */}
        <BlurFade delay={0.1} duration={0.5} y={12} blur={4}>
          <Card className="p-6" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2.5 rounded-xl"
                style={{ 
                  backgroundColor: `${themeConfig.accent}12`,
                  border: `1px solid ${themeConfig.accent}25`
                }}
              >
                <Activity className="w-5 h-5" style={{ color: themeConfig.accent }} />
              </div>
              <div>
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: themeConfig.foreground }}
                >
                  All Trades
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: themeConfig.mutedForeground }}
                >
                  {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            {filteredTrades.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: themeConfig.mutedForeground }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: themeConfig.foreground }}>No trades found</h3>
                <p className="mb-4" style={{ color: themeConfig.mutedForeground }}>
                  {searchTerm || selectedAccount !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start by adding your first trade'
                  }
                </p>
                {!searchTerm && selectedAccount === 'all' && (
                  <ShimmerButton 
                    onClick={handleAddTrade}
                    style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
                    shimmerColor="rgba(255, 255, 255, 0.4)"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Trade
                  </ShimmerButton>
                )}
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={tradeListVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredTrades.map((trade) => {
                  const isExpanded = expandedTrades.has(trade.id);
                  return (
                  <motion.div
                    key={trade.id}
                    variants={tradeCardVariants}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={`rounded-xl transition-shadow duration-200 hover:shadow-lg ${
                      compactView ? 'p-3' : 'p-4'
                    }`}
                    style={{
                      backgroundColor: themeConfig.card,
                      border: `1px solid ${themeConfig.border}`,
                    }}
                    role="article"
                    aria-label={`Trade ${trade.asset || trade.id} ${trade.profitLoss >= 0 ? 'profit' : 'loss'} ${Math.abs(trade.profitLoss || 0).toFixed(2)}`}
                  >
                    {/* Compact view: Symbol, P&L, Rating, Emotion */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {trade.screenshot && (
                          <button
                            type="button"
                            onClick={() => openScreenshot(trade.screenshot!)}
                            className="flex-shrink-0 rounded overflow-hidden border border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                            aria-label="View screenshot enlarged"
                          >
                            <img
                              src={getScreenshotFullUrl(trade.screenshot)}
                              alt="Trade screenshot"
                              className="w-14 h-10 object-cover"
                            />
                          </button>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedTrades.includes(trade.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrades([...selectedTrades, trade.id]);
                            } else {
                              setSelectedTrades(selectedTrades.filter(id => id !== trade.id));
                            }
                          }}
                          className="rounded border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label={`Select trade ${trade.asset || trade.id}`}
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="font-semibold text-lg" style={{ color: themeConfig.foreground }}>{trade.asset}</span>
                          {trade.tradeGrade && (
                            <span
                              className="text-sm font-bold px-2.5 py-1 rounded"
                              style={{
                                backgroundColor: trade.tradeGrade === 'A' ? 'rgba(16,185,129,0.15)' : trade.tradeGrade === 'B' ? `${themeConfig.accent}25` : 'rgba(107,114,128,0.2)',
                                color: trade.tradeGrade === 'A' ? '#10b981' : trade.tradeGrade === 'B' ? themeConfig.accent : themeConfig.mutedForeground,
                              }}
                            >
                              {trade.tradeGrade}
                            </span>
                          )}
                          {trade.emotion && (
                            <div 
                              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${getEmotionColor(trade.emotion)}20`,
                                border: `1px solid ${getEmotionColor(trade.emotion)}`,
                                color: getEmotionColor(trade.emotion)
                              }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getEmotionColor(trade.emotion) }}
                              />
                              {trade.emotion}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleTradeExpanded(trade.id)}
                          aria-label={isExpanded ? 'Show less' : 'Show more'}
                        >
                          {isExpanded ? 'Less' : 'More'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`Actions for trade ${trade.asset || trade.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTrade(trade.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {trade.screenshot && (
                              <DropdownMenuItem
                                onClick={() => openScreenshot(trade.screenshot!)}
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getScreenshotFullUrl(trade.screenshot)}
                                    alt=""
                                    className="w-8 h-6 object-cover rounded"
                                  />
                                  <span>View Screenshot</span>
                                </div>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditTrade(trade.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Trade
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setTradeToDelete(trade.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Trade
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Expanded view: Show all details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: themeConfig.border }}>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-x-3 gap-y-1">
                          <span>{trade.date ? new Date(trade.date).toLocaleDateString() : 'No date'}</span>
                          <span>Size: {trade.positionSize || 'N/A'}</span>
                          {trade.rMultiple != null && Number.isFinite(trade.rMultiple) && (
                            <span title="R Multiple">R: {trade.rMultiple}x</span>
                          )}
                          {trade.plannedRR != null && Number.isFinite(trade.plannedRR) && (
                            <span title="Planned Risk/Reward">R:R 1:{trade.plannedRR}</span>
                          )}
                          {trade.session && (
                            <span>{trade.session}</span>
                          )}
                          {(() => {
                            const cleanNotes = trade.notes ? stripVoiceNotePlaceholders(trade.notes) : '';
                            if (cleanNotes) {
                              return <span className="truncate max-w-xs">{cleanNotes}</span>;
                            }
                            return null;
                          })()}
                          {(() => {
                            // Try multiple ways to access voice notes
                            const voiceNotes = trade.voiceNoteUrls || (trade as any).voiceNoteUrls || (trade as any).voice_note_urls;
                            let voiceNotesArray: Array<{ url: string; duration?: number; transcript?: string }> = [];
                            
                            // Debug: Log what we're getting
                            console.log('[TradeHistory] Checking voice notes for trade', trade.id, {
                              voiceNoteUrls: trade.voiceNoteUrls,
                              voiceNoteUrls_any: (trade as any).voiceNoteUrls,
                              voice_note_urls: (trade as any).voice_note_urls,
                              rawVoiceNotes: voiceNotes,
                              tradeObject: trade,
                            });
                            
                            if (Array.isArray(voiceNotes)) {
                              voiceNotesArray = voiceNotes;
                            } else if (typeof voiceNotes === 'string') {
                              try {
                                const parsed = JSON.parse(voiceNotes);
                                voiceNotesArray = Array.isArray(parsed) ? parsed : [];
                              } catch {
                                voiceNotesArray = [];
                              }
                            }
                            
                            // Filter out invalid entries
                            voiceNotesArray = voiceNotesArray.filter((vn: any) => vn && (vn.url || typeof vn === 'string'));
                            
                            // Debug logging - always log in development
                            console.log('[TradeHistory] Parsed voice notes array for trade', trade.id, ':', voiceNotesArray.length, 'items', voiceNotesArray);
                            
                            if (voiceNotesArray.length > 0) {
                              console.log('[TradeHistory] Will display voice notes button for trade', trade.id);
                              const isExpanded = expandedVoiceNotes.has(trade.id);
                              return (
                                <div className="space-y-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleVoiceNotes(trade.id)}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded"
                                    style={{ backgroundColor: themeConfig.card }}
                                  >
                                    <Mic className="w-4 h-4" style={{ color: themeConfig.accent }} />
                                    <span className="text-xs font-medium" style={{ color: themeConfig.accent }}>
                                      {voiceNotesArray.length} voice note{voiceNotesArray.length !== 1 ? 's' : ''} {isExpanded ? '▼' : '▶'}
                                    </span>
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-5 space-y-2 pt-2 border-l-2 pl-3" style={{ borderColor: themeConfig.border }}>
                                      {voiceNotesArray.map((vn: any, idx: number) => {
                                        const url = typeof vn === 'string' ? vn : (vn?.url || '');
                                        if (!url) return null;
                                        return (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-3 p-2 rounded-lg border"
                                            style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}
                                          >
                                            <AudioPlayer
                                              src={getVoiceNoteAudioUrl(url)}
                                              duration={vn?.duration}
                                              className="flex-1"
                                            />
                                            {vn?.duration != null && (
                                              <span className="text-xs whitespace-nowrap" style={{ color: themeConfig.mutedForeground }}>
                                                {Math.floor(vn.duration / 60)}:{(vn.duration % 60).toFixed(0).padStart(2, '0')}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {trade.tags && trade.tags.length > 0 && (
                            <span className="flex flex-wrap gap-1">
                              {(Array.isArray(trade.tags) ? trade.tags : []).slice(0, 5).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-md border"
                                  style={{ borderColor: themeConfig.border, color: themeConfig.mutedForeground }}
                                >
                                  {typeof tag === 'string' ? tag : String(tag)}
                                </span>
                              ))}
                              {(Array.isArray(trade.tags) ? trade.tags : []).length > 5 && (
                                <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                                  +{(Array.isArray(trade.tags) ? trade.tags : []).length - 5}
                                </span>
                              )}
                            </span>
                          )}
                          {(() => {
                            const t = trade as {
                              checklistItems?: { completed?: boolean }[];
                              duringChecklistItems?: { completed?: boolean }[];
                              postChecklistItems?: { completed?: boolean }[];
                              during_checklist_items?: { completed?: boolean }[];
                              post_checklist_items?: { completed?: boolean }[];
                            };
                            const pre = t.checklistItems ?? [];
                            const dur = t.duringChecklistItems ?? t.during_checklist_items ?? [];
                            const post = t.postChecklistItems ?? t.post_checklist_items ?? [];
                            const preArr = Array.isArray(pre) ? pre : [];
                            const durArr = Array.isArray(dur) ? dur : [];
                            const postArr = Array.isArray(post) ? post : [];
                            const parts: string[] = [];
                            if (preArr.length) parts.push(`Pre ${preArr.filter(i => i?.completed).length}/${preArr.length}`);
                            if (durArr.length) parts.push(`During ${durArr.filter(i => i?.completed).length}/${durArr.length}`);
                            if (postArr.length) parts.push(`Post ${postArr.filter(i => i?.completed).length}/${postArr.length}`);
                            return parts.length > 0 ? <span className="text-xs opacity-80">Checklist: {parts.join(' · ')}</span> : null;
                          })()}
                          </div>
                          {trade.entryPrice && trade.exitPrice && (
                            <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                              Entry: ${trade.entryPrice} → Exit: ${trade.exitPrice}
                            </div>
                          )}
                          {(trade.rMultiple != null && Number.isFinite(trade.rMultiple)) || (trade.plannedRR != null && Number.isFinite(trade.plannedRR)) ? (
                            <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                              {trade.rMultiple != null && Number.isFinite(trade.rMultiple) && <span>R: {trade.rMultiple}x</span>}
                              {trade.rMultiple != null && trade.plannedRR != null && Number.isFinite(trade.plannedRR) && ' · '}
                              {trade.plannedRR != null && Number.isFinite(trade.plannedRR) && <span>R:R 1:{trade.plannedRR}</span>}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
                })}
              </motion.div>
            )}
          </Card>
        </BlurFade>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => {
                  if (tradeToDelete) {
                    handleDeleteTrade(tradeToDelete);
                    setDeleteDialogOpen(false);
                    setTradeToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScreenshotViewerModal
        open={screenshotModalOpen}
        onOpenChange={setScreenshotModalOpen}
        screenshotUrl={screenshotToView}
      />
      </PageContainer>
    </motion.div>
  );
}