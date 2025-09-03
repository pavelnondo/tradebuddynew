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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Edit className="w-4 h-4 mr-2" />
            Edit Trade
          </Button>
        </div>

        {/* Trade Overview Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{trade.symbol}</span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  trade.trade_type === 'Long' 
                    ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                    : 'bg-red-500/20 text-red-100 border border-red-400/30'
                }`}>
                  {trade.trade_type}
                </span>
              </div>
              <div className={`text-right ${
                isProfit ? 'text-green-300' : isLoss ? 'text-red-300' : 'text-gray-300'
              }`}>
                <div className="text-2xl font-bold">
                  {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                </div>
                <div className="text-sm opacity-80">P&L</div>
              </div>
            </CardTitle>
          </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <div className="text-sm font-medium text-blue-800">Entry Price</div>
              </div>
              <div className="text-xl font-bold text-blue-900">${trade.entry_price.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <div className="text-sm font-medium text-purple-800">Exit Price</div>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'N/A'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <div className="text-sm font-medium text-indigo-800">Quantity</div>
              </div>
              <div className="text-xl font-bold text-indigo-900">{trade.quantity}</div>
            </div>
            <div className={`p-4 rounded-xl border ${
              isProfit 
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                : isLoss 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isProfit ? <TrendingUp className="w-4 h-4 text-green-600" /> : 
                 isLoss ? <TrendingDown className="w-4 h-4 text-red-600" /> : 
                 <DollarSign className="w-4 h-4 text-gray-600" />}
                <div className={`text-sm font-medium ${
                  isProfit ? 'text-green-800' : isLoss ? 'text-red-800' : 'text-gray-800'
                }`}>
                  P&L
                </div>
              </div>
              <div className={`text-xl font-bold ${
                isProfit ? 'text-green-900' : isLoss ? 'text-red-900' : 'text-gray-900'
              }`}>
                {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Trade Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Entry Time</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{formatDateTime(trade.entry_time)}</span>
                </div>
                {trade.exit_time && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Exit Time</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{formatDateTime(trade.exit_time)}</span>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{getDuration(trade)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Emotion</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 capitalize">{trade.emotion || 'N/A'}</span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Checklist Completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {trade.checklist_items.filter(item => item.completed).length}/{trade.checklist_items.length}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${trade.checklist_items.length > 0 ? 
                            (trade.checklist_items.filter(item => item.completed).length / trade.checklist_items.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Edit className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-800">Trade Notes</h4>
              </div>
              <p className="text-amber-700 leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_url && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-slate-600" />
                <h4 className="font-semibold text-slate-800">Trade Screenshot</h4>
              </div>
              <div className="relative group bg-white rounded-lg p-4 shadow-sm">
                <img 
                  src={trade.screenshot_url.startsWith('http') ? trade.screenshot_url : `/uploads/${trade.screenshot_url.split('/').pop()}`}
                  alt="Trade Screenshot"
                  className="max-w-full h-auto rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all duration-300 shadow-md"
                  onClick={() => window.open(
                    trade.screenshot_url!.startsWith('http') ? trade.screenshot_url! : `/uploads/${trade.screenshot_url!.split('/').pop()}`, 
                    '_blank'
                  )}
                  onError={(e) => {
                    console.error('Screenshot failed to load:', trade.screenshot_url);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-gray-500 py-8">Screenshot not available</div>';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          {trade.checklist_items.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-800">Trading Checklist</h4>
              </div>
              <div className="space-y-3">
                {trade.checklist_items.map((item) => (
                  <div key={item.id} className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                    item.completed 
                      ? 'bg-green-100 border border-green-300' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <CheckCircle2 
                      className={`w-5 h-5 flex-shrink-0 ${
                        item.completed 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} 
                    />
                    <span className={`font-medium ${
                      item.completed 
                        ? 'line-through text-green-700' 
                        : 'text-gray-800'
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
    </div>
  );
}
