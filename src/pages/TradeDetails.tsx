import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Image as ImageIcon, CheckCircle2, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config';

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number;
  notes: string;
  emotion: string;
  screenshot_url: string | null;
  entry_time: string;
  exit_time: string | null;
  duration: number | null;
  checklist_items: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
}

interface TradeDetailsState {
  trade: Trade | null;
  loading: boolean;
  error: string | null;
}

export default function TradeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [state, setState] = useState<TradeDetailsState>({
    trade: null,
    loading: false,
    error: null
  });

  // Memoized fetch function to prevent recreation
  const fetchTrade = useCallback(async (tradeId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const tradeData = await response.json();
      
      // Transform API data to our interface
      const trade: Trade = {
        id: tradeData.id,
        symbol: tradeData.symbol || '',
        trade_type: tradeData.trade_type || tradeData.type || '',
        entry_price: Number(tradeData.entry_price) || 0,
        exit_price: tradeData.exit_price ? Number(tradeData.exit_price) : null,
        quantity: Number(tradeData.quantity) || 0,
        pnl: Number(tradeData.pnl) || 0,
        notes: tradeData.notes || '',
        emotion: tradeData.emotion || '',
        screenshot_url: tradeData.screenshot_url,
        entry_time: tradeData.entry_time || '',
        exit_time: tradeData.exit_time || null,
        duration: tradeData.duration ? Number(tradeData.duration) : null,
        checklist_items: Array.isArray(tradeData.checklist_items) 
          ? tradeData.checklist_items.map((item: any) => ({
              id: Number(item.id) || 0,
              text: String(item.text || ''),
              completed: Boolean(item.completed)
            }))
          : []
      };

      setState({
        trade,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Failed to fetch trade:', error);
      setState({
        trade: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load trade'
      });
    }
  }, [navigate]);

  // Load trade data
  useEffect(() => {
    if (!params.id) {
      setState(prev => ({ ...prev, error: 'No trade ID provided' }));
      return;
    }

    // If we have trade data from navigation, use it temporarily
    if (location.state?.trade) {
      setState({
        trade: location.state.trade,
        loading: false,
        error: null
      });
    }

    // Always fetch fresh data from database
    fetchTrade(params.id);
  }, [params.id, location.state?.trade, fetchTrade]);

  // Format date without timezone conversion
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  };

  // Calculate duration
  const getDuration = (trade: Trade) => {
    if (trade.duration) {
      const hours = Math.floor(trade.duration / 60);
      const minutes = trade.duration % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    if (trade.entry_time && trade.exit_time) {
      try {
        const start = new Date(trade.entry_time).getTime();
        const end = new Date(trade.exit_time).getTime();
        const durationMs = end - start;
        const durationMins = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMins / 60);
        const minutes = durationMins % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      } catch {
        return 'N/A';
      }
    }
    
    return 'N/A';
  };

  // Handle edit trade
  const handleEdit = () => {
    if (state.trade) {
      navigate(`/edit-trade/${state.trade.id}`, { 
        state: { trade: state.trade } 
      });
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading trade details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Trade</h2>
              <p className="text-muted-foreground mb-4">{state.error}</p>
              <div className="space-x-2">
                <Button onClick={() => fetchTrade(params.id!)} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/trades')}>
                  Go to Trades
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No trade state
  if (!state.trade) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-600 mb-2">Trade Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested trade could not be found.
              </p>
              <Button onClick={() => navigate('/trades')}>
                Go to Trades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trade = state.trade;
  const isProfit = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button onClick={handleEdit} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Trade
        </Button>
      </div>

      {/* Trade Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl font-bold">{trade.symbol}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              trade.trade_type === 'Long' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {trade.trade_type}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Entry Price</div>
              <div className="text-lg font-semibold">${trade.entry_price.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Exit Price</div>
              <div className="text-lg font-semibold">
                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Quantity</div>
              <div className="text-lg font-semibold">{trade.quantity}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">P&L</div>
              <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                isProfit ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-600'
              }`}>
                {isProfit ? <TrendingUp className="w-4 h-4" /> : isLoss ? <TrendingDown className="w-4 h-4" /> : null}
                ${trade.pnl.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Entry Time:</span>
                <span className="font-medium">{formatDateTime(trade.entry_time)}</span>
              </div>
              {trade.exit_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Exit Time:</span>
                  <span className="font-medium">{formatDateTime(trade.exit_time)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">{getDuration(trade)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Emotion:</span>
                <span className="font-medium capitalize">{trade.emotion || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checklist Items:</span>
                <span className="font-medium">
                  {trade.checklist_items.filter(item => item.completed).length}/{trade.checklist_items.length}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-muted-foreground">{trade.notes}</p>
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_url && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Screenshot</h4>
              <div className="relative group">
                <img 
                  src={trade.screenshot_url.startsWith('http') ? trade.screenshot_url : `${API_BASE_URL}${trade.screenshot_url}`}
                  alt="Trade Screenshot"
                  className="max-w-full h-auto rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(trade.screenshot_url!, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          {trade.checklist_items.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Checklist Items</h4>
              <div className="space-y-2">
                {trade.checklist_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 
                      className={`w-5 h-5 ${
                        item.completed 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} 
                    />
                    <span className={`${
                      item.completed 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-700'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
