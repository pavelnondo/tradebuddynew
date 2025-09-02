import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiTrades } from '@/hooks/useApiTrades';
import { cn } from "@/lib/utils";

// Calendar day component
const CalendarDay = ({ 
  date, 
  isCurrentMonth, 
  isToday, 
  trades, 
  onClick 
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  trades: any[];
  onClick: (date: Date) => void;
}) => {
  // Ensure trades is always an array to prevent filter/reduce errors
  const safeTrades = Array.isArray(trades) ? trades : [];
  const dayTrades = safeTrades.filter(trade => {
    const tradeDate = new Date(trade.date);
    return tradeDate.toDateString() === date.toDateString();
  });

  const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const isProfit = totalPnL >= 0;

  return (
    <button
      onClick={() => onClick(date)}
      className={cn(
        "relative p-3 h-24 text-left transition-smooth hover:bg-muted/50 rounded-xl group",
        !isCurrentMonth && "text-muted-foreground/50",
        isToday && "bg-primary/10 border-2 border-primary"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "text-sm font-medium",
          isToday && "text-primary font-semibold"
        )}>
          {date.getDate()}
        </span>
        {dayTrades.length > 0 && (
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-1.5 py-0.5",
              isProfit ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {dayTrades.length}
          </Badge>
        )}
      </div>
      
      {dayTrades.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            {isProfit ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={cn(
              "text-xs font-medium",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {isProfit ? "+" : ""}${Math.abs(totalPnL).toFixed(0)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </button>
  );
};

// Trade details modal component
const TradeDetailsModal = ({ 
  date, 
  trades, 
  isOpen, 
  onClose 
}: {
  date: Date;
  trades: any[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  // Ensure trades is always an array to prevent filter/reduce errors
  const safeTrades = Array.isArray(trades) ? trades : [];
  const dayTrades = safeTrades.filter(trade => {
    const tradeDate = new Date(trade.date);
    return tradeDate.toDateString() === date.toDateString();
  });

  const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const isProfit = totalPnL >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="card-modern w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <CardDescription>
                {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''} • 
                <span className={cn(
                  "ml-1 font-medium",
                  isProfit ? "text-green-600" : "text-red-600"
                )}>
                  {isProfit ? "+" : ""}${totalPnL.toFixed(2)} P&L
                </span>
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {dayTrades.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Trades</h3>
                <p className="text-muted-foreground">No trades recorded for this date</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {dayTrades.map((trade, index) => (
                  <div key={trade.id} className="p-4 hover:bg-muted/30 transition-smooth">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          trade.profitLoss >= 0 ? "bg-green-500" : "bg-red-500"
                        )} />
                        <div>
                          <h4 className="font-semibold">{trade.asset}</h4>
                          <p className="text-sm text-muted-foreground">{trade.tradeType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {trade.profitLoss >= 0 ? "+" : ""}${trade.profitLoss?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <span className="ml-2 font-medium">${trade.entryPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exit:</span>
                        <span className="ml-2 font-medium">${trade.exitPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <span className="ml-2 font-medium">{trade.positionSize?.toLocaleString() || '0'}</span>
                      </div>
                      {trade.emotion && (
                        <div>
                          <span className="text-muted-foreground">Emotion:</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {trade.emotion}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { trades, isLoading, error } = useApiTrades();
  const navigate = useNavigate();

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return days;
  }, [currentDate]);

  // Calendar stats
  const calendarStats = useMemo(() => {
    // Ensure trades is always an array to prevent filter/reduce errors
    const safeTrades = Array.isArray(trades) ? trades : [];
    const currentMonthTrades = safeTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === currentDate.getMonth() && 
             tradeDate.getFullYear() === currentDate.getFullYear();
    });

    const totalTrades = currentMonthTrades.length;
    const totalPnL = currentMonthTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const winningTrades = currentMonthTrades.filter(trade => trade.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return { totalTrades, totalPnL, winRate };
  }, [trades, currentDate]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Calendar</h1>
            <p className="text-muted-foreground">Plan and review your trading schedule</p>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl shimmer"></div>
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
            <h2 className="text-xl font-bold mb-2">Error Loading Calendar</h2>
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
          <h1 className="text-3xl font-bold mb-2">Trading Calendar</h1>
          <p className="text-muted-foreground">
            Plan and review your trading schedule
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={goToToday}
            className="btn-apple-secondary"
          >
            Today
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

      {/* Calendar Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Month Trades</p>
                <p className="text-2xl font-bold">{calendarStats.totalTrades}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Month P&L</p>
                <p className={cn(
                  "text-2xl font-bold",
                  calendarStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {calendarStats.totalPnL >= 0 ? "+" : ""}${calendarStats.totalPnL.toFixed(2)}
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
                <p className="text-sm text-muted-foreground">Month Win Rate</p>
                <p className="text-2xl font-bold">{calendarStats.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center">
                <span className="text-sm font-medium text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <CalendarDay
                key={index}
                date={day.date}
                isCurrentMonth={day.isCurrentMonth}
                isToday={day.isToday}
                trades={trades}
                onClick={handleDayClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trade Details Modal */}
      <TradeDetailsModal
        date={selectedDate || new Date()}
        trades={trades}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
} 