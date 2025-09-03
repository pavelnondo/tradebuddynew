import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, Edit, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/config';
// Removed irrelevant per-trade P&L line chart

// Helper function to format trade date without timezone conversion
const formatTradeDate = (date: string | Date | null | undefined) => {
  if (!date) return '';
  
  if (typeof date === 'string') {
    // If it's a string, extract time directly without timezone conversion
    if (date.includes('T')) {
      return date.replace('T', ' ').slice(0, 16); // "2025-09-02T10:37:00.000Z" -> "2025-09-02 10:37"
    } else if (date.includes(' ')) {
      return date.slice(0, 16); // "2025-09-02 10:37:00" -> "2025-09-02 10:37"
    }
    return date.slice(0, 16);
  } else if (date instanceof Date) {
    // If it's a Date object, convert it back to the original time string format
    // This is less ideal but handles legacy data from location.state
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }
  return '';
};

export default function TradeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [trade, setTrade] = useState<any>(location.state?.trade || null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Simple in-memory cache to avoid repeated fetches across remounts
  const tradeCacheRef = useRef<Record<string, any>>({});
  const lastFetchRef = useRef<Record<string, number>>({});

  // Load from sessionStorage cache immediately if available
  useEffect(() => {
    if (!params.id) return;
    try {
      const key = `td_cache_${params.id}`;
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setTrade(parsed);
        }
      }
    } catch {}
  }, [params.id]);
  
  console.log('🔍 Trade Details - Initial state:', { trade: location.state?.trade, params: params.id });

  useEffect(() => {
    if (!params.id) return;
    // If we already have the trade (from navigation state or cache), use it
    if (location.state?.trade) {
      setTrade(location.state.trade);
      return;
    }
    if (tradeCacheRef.current[params.id]) {
      setTrade(tradeCacheRef.current[params.id]);
      return;
    }
    // Throttle re-fetching the same id within 2 seconds
    const last = lastFetchRef.current[params.id];
    if (last && Date.now() - last < 2000) {
      return;
    }
    lastFetchRef.current[params.id] = Date.now();
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/trades/${params.id}`, { 
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });
        if (res.status === 401) {
          navigate('/');
          return;
        }
        if (!res.ok) {
          console.error('Failed to load trade', res.status);
          return;
        }
        const t = await res.json();
        console.log('🔍 Trade Details - Raw API Response:', t);
        const tradeData = {
          id: t.id,
          asset: t.symbol,
          tradeType: t.trade_type || t.type,
          entryPrice: Number(t.entry_price),
          exitPrice: t.exit_price != null ? Number(t.exit_price) : null,
          positionSize: Number(t.quantity),
          date: t.entry_time,
          profitLoss: t.pnl != null ? Number(t.pnl) : 0,
          notes: t.notes || '',
          emotion: t.emotion || '',
          screenshot: t.screenshot_url ? (t.screenshot_url.startsWith('http') ? t.screenshot_url : `https://www.mytradebuddy.ru${t.screenshot_url}`) : '',
          checklistItems: Array.isArray(t.checklist_items) ? t.checklist_items : [],
          entryTime: t.entry_time,
          exitTime: t.exit_time,
          duration: t.duration != null ? Number(t.duration) : (t.duration_minutes != null ? Number(t.duration_minutes) : null),
        };
        tradeCacheRef.current[String(tradeData.id)] = tradeData;
        try {
          sessionStorage.setItem(`td_cache_${tradeData.id}`, JSON.stringify(tradeData));
        } catch {}
        setTrade(tradeData);
      } catch (e) {
        if ((e as any).name !== 'AbortError') {
          console.error('Trade load error', e);
        }
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => controller.abort();
  }, [params.id, navigate]);

  // Removed trades fallback to avoid extra fetching and re-renders

  // Duration (minutes) and pretty time
  const durationMinutes = useMemo(() => {
    console.log('🔍 Duration calculation - trade:', trade);
    console.log('🔍 Duration calculation - trade.duration:', trade?.duration, 'type:', typeof trade?.duration);
    if (typeof trade?.duration === 'number') return trade.duration;
    if (typeof trade?.duration === 'string' && trade.duration) return Number(trade.duration);
    const start = trade?.entryTime ? new Date(trade.entryTime).getTime() : NaN;
    const end = trade?.exitTime ? new Date(trade.exitTime).getTime() : NaN;
    console.log('🔍 Duration calculation - start:', start, 'end:', end);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      const calculated = Math.floor((end - start) / 60000);
      console.log('🔍 Duration calculation - calculated:', calculated);
      return calculated;
    }
    console.log('🔍 Duration calculation - returning undefined');
    return undefined;
  }, [trade]);
  const formatHM = (mins?: number) => {
    if (mins == null) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!trade && loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card className="card-modern">
          <CardContent className="p-8">Loading trade...</CardContent>
        </Card>
      </div>
    );
  }

  if (!trade && !loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card className="card-modern">
          <CardContent className="p-8">Trade not found.</CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = Array.isArray(trade.checklistItems) ? trade.checklistItems.filter((i: any) => i.completed).length : 0;
  const totalCount = Array.isArray(trade.checklistItems) ? trade.checklistItems.length : 0;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Trade Details</h1>
            <p className="text-muted-foreground">Detailed view of your trade</p>
          </div>
        </div>
        <Button onClick={() => navigate('/add-trade', { state: { editTrade: trade }})}>
          <Edit className="w-4 h-4 mr-2" /> Edit Trade
        </Button>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>{trade.asset} — {trade.tradeType}</CardTitle>
          <CardDescription>{trade.date ? formatTradeDate(trade.date) : ''}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Entry / Exit</div>
              <div className="font-semibold">{trade.entryPrice} → {trade.exitPrice ?? '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Size</div>
              <div className="font-semibold">{trade.positionSize}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">P&L</div>
              <div className="font-semibold">{trade.profitLoss}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Emotion</div>
              <div className="font-semibold">{trade.emotion || '-'}</div>
            </div>
          </div>

          {/* Time in trade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <div className="text-sm text-muted-foreground">Time in Trade</div>
              <div className="font-semibold">{formatHM(durationMinutes)}</div>
            </div>
            <div className="md:col-span-2">
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (durationMinutes ?? 0) / 180 * 100)}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {durationMinutes ? `${durationMinutes} minutes` : 'No duration data'}
              </div>
            </div>
          </div>

          {/* Checklist completion */}
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Checklist Completion</div>
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full" style={{ background: `conic-gradient(#10b981 ${completionPct}%, #e5e7eb 0)` }} />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{completionPct}%</div>
                </div>
                <div className="space-y-1">
                  {trade.checklistItems.map((i: any) => (
                    <div key={i.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 ${i.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span>{i.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {trade.notes && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Notes</div>
              <div className="p-3 rounded-lg bg-muted/30">{trade.notes}</div>
            </div>
          )}

          {trade.screenshot && (
            <div>
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Screenshot
              </div>
              <div 
                className="cursor-pointer rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => window.open(trade.screenshot, '_blank')}
              >
                <img 
                  src={trade.screenshot} 
                  alt="Trade screenshot" 
                  className="w-full max-w-3xl hover:scale-105 transition-transform" 
                  onLoad={() => console.log('🔍 Screenshot loaded successfully:', trade.screenshot)}
                  onError={(e) => console.log('🔍 Screenshot failed to load:', trade.screenshot, e)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click to open in full size</p>
            </div>
          )}
          {!trade.screenshot && (
            <div>
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Screenshot
              </div>
              <div className="text-muted-foreground">No screenshot available</div>
              <div className="text-xs text-muted-foreground">Debug: trade.screenshot = {JSON.stringify(trade.screenshot)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


