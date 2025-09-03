import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useApiTrades } from '@/hooks/useApiTrades';
import { useToast } from "@/hooks/use-toast";
import { tradeApi } from '@/services/tradeApi';
import { cn } from "@/lib/utils";

// Trade card component  
const TradeCard = ({ 
  trade, 
  onEdit, 
  onDelete,
  onOpen
}: { 
  trade: any; 
  onEdit: (trade: any) => void;
  onDelete: (trade: any) => void;
  onOpen: (trade: any) => void;
}) => {
  const isProfit = trade.profitLoss >= 0;
  
  return (
    <Card className="card-modern hover:shadow-lg transition-smooth group cursor-pointer" onClick={() => onOpen(trade)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isProfit ? "bg-green-500" : "bg-red-500"
            )} />
            <div>
              <h3 className="font-semibold text-lg">{trade.asset}</h3>
              <p className="text-sm text-muted-foreground">{trade.tradeType}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(trade)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Trade
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => onDelete(trade)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Trade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Entry Price</p>
            <p className="font-semibold">${trade.entryPrice?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Exit Price</p>
            <p className="font-semibold">${trade.exitPrice?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Position Size</p>
            <p className="font-semibold">{trade.positionSize?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P&L</p>
            <p className={cn(
              "font-semibold",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {isProfit ? "+" : ""}${trade.profitLoss?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        
        {/* Duration display */}
        {trade.duration && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="text-sm font-medium">
                {trade.duration >= 60 
                  ? `${Math.floor(trade.duration / 60)}h ${trade.duration % 60}m`
                  : `${trade.duration}m`
                }
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {trade.date ? new Date(trade.date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {trade.emotion && (
            <Badge variant="secondary" className="text-xs">
              {trade.emotion}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Filter component
const FilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedType, 
  setSelectedType,
  selectedEmotion,
  setSelectedEmotion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  durationFilter,
  setDurationFilter,
  customDuration,
  setCustomDuration
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedEmotion: string;
  setSelectedEmotion: (emotion: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  durationFilter: string;
  setDurationFilter: (duration: string) => void;
  customDuration: string;
  setCustomDuration: (duration: string) => void;
}) => {
  const tradeTypes = ["All", "Buy", "Sell"];
  const emotions = ["All", "Confident", "Calm", "Nervous", "Excited", "Fearful", "Greedy", "Frustrated"];
  const durations = ["All", "< 5min", "5-15min", "15-30min", "30-60min", "> 1hr", "Custom"];

  return (
    <Card className="card-modern mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* First Row - Search and Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search - Reduced width to accommodate date filters */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search trades by asset, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-modern"
                />
              </div>
            </div>

            {/* Date Filters - Wider inputs for calendar button visibility */}
            <div className="flex gap-2">
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8 input-modern w-44"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8 input-modern w-44"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Second Row - Type, Duration, and Emotion Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Trade Type Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center mr-2">Type:</span>
              {tradeTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="text-xs"
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Duration Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground flex items-center mr-2">Duration:</span>
              {durations.map((duration) => (
                <Button
                  key={duration}
                  variant={durationFilter === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDurationFilter(duration)}
                  className="text-xs"
                >
                  {duration}
                </Button>
              ))}
              {durationFilter === "Custom" && (
                <div className="flex items-center gap-1 ml-2">
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="w-20 h-8 text-xs"
                    min="1"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              )}
            </div>

            {/* Emotion Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground flex items-center mr-2 shrink-0">Emotion:</span>
              {emotions.map((emotion) => (
                <Button
                  key={emotion}
                  variant={selectedEmotion === emotion ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedEmotion(emotion);
                  }}
                  className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                  type="button"
                >
                  {emotion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Stats component
const TradeStats = ({ trades }: { trades: any[] }) => {
  const stats = useMemo(() => {
    // Ensure trades is always an array to prevent filter/reduce errors
    const safeTrades = Array.isArray(trades) ? trades : [];
    const totalTrades = safeTrades.length;
    const winningTrades = safeTrades.filter(t => t.profitLoss > 0).length;
    const totalProfit = safeTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

    return { totalTrades, winningTrades, totalProfit, winRate, avgProfit };
  }, [trades]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{stats.totalTrades}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={cn(
                "text-2xl font-bold",
                stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg P&L</p>
              <p className={cn(
                "text-2xl font-bold",
                stats.avgProfit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {stats.avgProfit >= 0 ? "+" : ""}${stats.avgProfit.toFixed(2)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function TradeHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEmotion, setSelectedEmotion] = useState("All");
  const [durationFilter, setDurationFilter] = useState("All");
  const [customDuration, setCustomDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get date filter from calendar navigation
  const dateFilter = location.state?.filterDate;

  // Filter trades based on search, filters, and date
  const filteredTrades = useMemo(() => {
    // Ensure trades is always an array to prevent filter errors
    const safeTrades = Array.isArray(trades) ? trades : [];
    return safeTrades.filter(trade => {
      const matchesSearch = searchTerm === "" || 
        trade.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Map trade types: Buy/Sell from UI to backend data
      let matchesType = selectedType === "All";
      if (!matchesType) {
        // Check both tradeType and type fields to handle different data formats
        const buyMatch = selectedType === "Buy" && (trade.tradeType === "Buy" || trade.type === "buy" || trade.tradeType === "Long");
        const sellMatch = selectedType === "Sell" && (trade.tradeType === "Sell" || trade.type === "sell" || trade.tradeType === "Short");
        matchesType = buyMatch || sellMatch;
      }
      
      const matchesEmotion = selectedEmotion === "All" || trade.emotion === selectedEmotion;
      
      // Duration filtering
      let matchesDuration = durationFilter === "All";
      if (!matchesDuration && trade.duration) {
        const duration = parseInt(trade.duration);
        switch (durationFilter) {
          case "< 5min":
            matchesDuration = duration < 5;
            break;
          case "5-15min":
            matchesDuration = duration >= 5 && duration <= 15;
            break;
          case "15-30min":
            matchesDuration = duration >= 15 && duration <= 30;
            break;
          case "30-60min":
            matchesDuration = duration >= 30 && duration <= 60;
            break;
          case "> 1hr":
            matchesDuration = duration > 60;
            break;
          case "Custom":
            if (customDuration) {
              const customDurationNum = parseInt(customDuration);
              matchesDuration = duration === customDurationNum;
            }
            break;
        }
      }
      
      // Date filtering from calendar
      let matchesDate = true;
      if (dateFilter && trade.date) {
        const tradeDate = new Date(trade.date).toLocaleDateString('sv-SE');
        matchesDate = tradeDate === dateFilter;
      }
      
      // Date range filtering
      let matchesDateRange = true;
      if ((startDate || endDate) && trade.date) {
        const tradeDate = new Date(trade.date).toLocaleDateString('sv-SE');
        if (startDate && tradeDate < startDate) matchesDateRange = false;
        if (endDate && tradeDate > endDate) matchesDateRange = false;
      }
      
      return matchesSearch && matchesType && matchesEmotion && matchesDuration && matchesDate && matchesDateRange;
    });
  }, [trades, searchTerm, selectedType, selectedEmotion, durationFilter, customDuration, dateFilter, startDate, endDate]);

  const handleEditTrade = (trade: any) => {
    // Navigate to edit trade page with trade data
    navigate('/add-trade', { state: { editTrade: trade } });
  };

  const handleDeleteTrade = (trade: any) => {
    setTradeToDelete(trade);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    setIsDeleting(true);
    try {
      await tradeApi.deleteTrade(tradeToDelete.id);
      
      toast({
        title: "🗑️ Trade Deleted Successfully!",
        description: `Your ${tradeToDelete.asset} trade has been removed from your portfolio.`,
        className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg",
      });
      
      // Refresh the trades list
      fetchTrades();
      
    } catch (error: any) {
      toast({
        title: "❌ Error Deleting Trade",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTradeToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trade History</h1>
            <p className="text-muted-foreground">Your trading activity</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern p-6">
              <div className="h-4 w-24 bg-muted rounded shimmer mb-2"></div>
              <div className="h-8 w-16 bg-muted rounded shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Error Loading Trades</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="btn-apple">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trade History</h1>
          <p className="text-muted-foreground">
            View and manage your trading activity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {/* Export functionality */}}
            className="btn-apple-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => navigate('/add-trade')}
            className="btn-apple"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TradeStats trades={trades} />

      {/* Date Filter Indicator */}
      {dateFilter && (
        <Card className="card-modern border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  Showing trades for {new Date(dateFilter).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/trades', { replace: true })}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedEmotion={selectedEmotion}
        setSelectedEmotion={selectedEmotion}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        durationFilter={durationFilter}
        setDurationFilter={setDurationFilter}
        customDuration={customDuration}
        setCustomDuration={setCustomDuration}
      />

      {/* Trades Grid */}
      {filteredTrades.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No trades found</h3>
            <p className="text-muted-foreground mb-6">
              {trades.length === 0 
                ? "Start by adding your first trade to see your trading history here."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            {trades.length === 0 && (
              <Button onClick={() => navigate('/add-trade')} className="btn-apple">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Trade
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrades.map((trade) => (
            <TradeCard 
              key={trade.id} 
              trade={trade} 
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onOpen={(t) => navigate('/trade/'+t.id, { state: { trade: t }})}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your{" "}
              <strong>{tradeToDelete?.asset}</strong> trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTrade}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Trade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
