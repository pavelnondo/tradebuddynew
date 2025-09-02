import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, Edit, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useApiTrades } from '@/hooks/useApiTrades';
import { API_BASE_URL } from '@/config';
// Removed irrelevant per-trade P&L line chart

export default function TradeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { trades } = useApiTrades();
  const [trade, setTrade] = useState<any>(location.state?.trade || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (trade || !params.id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/trades/${params.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const t = await res.json();
          setTrade({
            id: t.id,
            asset: t.symbol,
            tradeType: t.trade_type || t.type,
            entryPrice: Number(t.entry_price),
            exitPrice: t.exit_price != null ? Number(t.exit_price) : null,
            positionSize: Number(t.quantity),
            date: t.entry_time ? new Date(t.entry_time) : null,
            profitLoss: t.pnl != null ? Number(t.pnl) : 0,
            notes: t.notes || '',
            emotion: t.emotion || '',
            screenshot: t.screenshot_url ? (t.screenshot_url.startsWith('http') ? t.screenshot_url : `${API_BASE_URL}${t.screenshot_url}`) : '',
            checklistItems: Array.isArray(t.checklist_items) ? t.checklist_items : [],
            entryTime: t.entry_time,
            exitTime: t.exit_time,
            duration: t.duration,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, trade]);

  // Fallback: find in list
  useEffect(() => {
    if (!trade && params.id && Array.isArray(trades)) {
      const t = trades.find((tr: any) => String(tr.id) === String(params.id));
      if (t) setTrade(t);
    }
  }, [params.id, trades, trade]);

  // Duration (minutes) and pretty time
  const durationMinutes = useMemo(() => {
    if (typeof trade?.duration === 'number') return trade.duration;
    const start = trade?.entryTime ? new Date(trade.entryTime).getTime() : NaN;
    const end = trade?.exitTime ? new Date(trade.exitTime).getTime() : NaN;
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      return Math.floor((end - start) / 60000);
    }
    return undefined;
  }, [trade]);
  const formatHM = (mins?: number) => {
    if (mins == null) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!trade || loading) {
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

  const completedCount = Array.isArray(trade.checklistItems) ? trade.checklistItems.filter((i: any) => i.completed).length : 0;
  const totalCount = Array.isArray(trade.checklistItems) ? trade.checklistItems.length : 0;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button onClick={() => navigate('/add-trade', { state: { editTrade: trade }})}>
          <Edit className="w-4 h-4 mr-2" /> Edit Trade
        </Button>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>{trade.asset} — {trade.tradeType}</CardTitle>
          <CardDescription>{trade.date ? new Date(trade.date).toLocaleString() : ''}</CardDescription>
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
              <img src={trade.screenshot} alt="Trade screenshot" className="rounded-lg border w-full max-w-3xl" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


