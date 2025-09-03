import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, Edit, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '@/config';

// Helper function to format trade date without timezone conversion
const formatTradeDate = (date: string | Date | null | undefined) => {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.includes('T')) {
      return date.replace('T', ' ').slice(0, 16);
    } else if (date.includes(' ')) {
      return date.slice(0, 16);
    }
    return date.slice(0, 16);
  } else if (date instanceof Date) {
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }
  return '';
};

// Duration calculation helper
const calculateDuration = (trade: any) => {
  if (typeof trade?.duration === 'number') return trade.duration;
  if (typeof trade?.duration === 'string' && trade.duration) return Number(trade.duration);
  const start = trade?.entryTime ? new Date(trade.entryTime).getTime() : NaN;
  const end = trade?.exitTime ? new Date(trade.exitTime).getTime() : NaN;
  if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
    return Math.floor((end - start) / 60000);
  }
  return undefined;
};

const formatHM = (mins?: number) => {
  if (mins == null) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function TradeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Use navigation state if available, otherwise null
  const trade = location.state?.trade || null;
  
  // If no trade data, show error immediately
  if (!trade) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card className="card-modern">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Trade Not Found</h2>
              <p className="text-muted-foreground mb-4">
                Please navigate to this page from the Trades list.
              </p>
              <Button onClick={() => navigate('/trades')} className="btn-apple">
                Go to Trades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  // Calculate duration and completion data (no more useMemo logging loops)
  const durationMinutes = calculateDuration(trade);
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


