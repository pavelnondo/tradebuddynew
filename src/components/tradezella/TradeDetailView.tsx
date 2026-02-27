import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Share, 
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Tag,
  MessageSquare,
  Image,
  BarChart3,
  Maximize2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { tradeApi } from '@/services/tradeApi';
import { convertToStandardTrades } from '@/utils/tradeUtils';

interface Trade {
  id: string;
  asset: string;
  tradeType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  date: string;
  profitLoss: number;
  notes: string;
  emotion: string;
  setup: string;
  accountId: string;
  confidenceLevel: number;
  executionQuality: number;
  screenshot: string;
  duration: number;
}

export function TradeDetailView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('No trade ID');
      return;
    }
    let cancelled = false;
    tradeApi.getTrade(id)
      .then((apiTrade) => {
        if (cancelled) return;
        const [t] = convertToStandardTrades([apiTrade as any]);
        if (t) {
          setTrade({
            id: String(t.id),
            asset: t.symbol,
            tradeType: t.type === 'buy' || t.type === 'long' ? 'Long' : 'Short',
            direction: t.type === 'buy' || t.type === 'long' ? 'buy' : 'sell',
            entryPrice: t.entryPrice,
            exitPrice: t.exitPrice ?? 0,
            positionSize: t.positionSize,
            date: t.entryTime?.toISOString?.() ?? '',
            profitLoss: t.pnl,
            notes: t.notes ?? '',
            emotion: t.emotion ?? 'calm',
            setup: t.setupType ?? '',
            accountId: t.accountId ?? '',
            confidenceLevel: 0,
            executionQuality: 0,
            screenshot: t.screenshot ?? '',
            duration: t.duration ?? 0,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load trade');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (error || !trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error ?? 'Trade not found'}</p>
        <Button variant="outline" onClick={() => navigate('/trades')}>Back to Trades</Button>
      </div>
    );
  }

  const isProfit = trade.profitLoss >= 0;
  const returnPercentage = trade.entryPrice > 0 ? ((trade.profitLoss / (trade.entryPrice * trade.positionSize)) * 100) : 0;
  const riskRewardRatio = trade.entryPrice > 0 ? (trade.profitLoss / (trade.entryPrice * trade.positionSize * 0.01)) : 0;

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      'confident': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'calm': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'excited': 'bg-green-500/10 text-green-500 border-green-500/20',
      'nervous': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'frustrated': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'greedy': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'fearful': 'bg-red-500/10 text-red-500 border-red-500/20',
      'fomo': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'satisfied': 'bg-green-500/10 text-green-500 border-green-500/20',
      'disappointed': 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };
    return colors[emotion?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
  };

  const getSetupColor = (setup: string) => {
    const colors: Record<string, string> = {
      'breakout': 'bg-green-500/10 text-green-500 border-green-500/20',
      'reversal': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'momentum': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'scalp': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'swing': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    };
    return colors[setup] || 'bg-muted text-muted-foreground border-border';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return 'text-green-500';
    if (grade >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/trades')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trades
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {trade.asset} Trade Analysis
              </h1>
              <p className="text-muted-foreground">
                {new Date(trade.date).toLocaleDateString()} • {trade.tradeType}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsStarred(!isStarred)}
            >
              {isStarred ? <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> : <StarOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 hover:text-red-600"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="tradezella-metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                P&L
              </CardTitle>
              {isProfit ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", isProfit ? "text-green-500" : "text-red-500")}>
                {isProfit ? '+' : ''}${trade.profitLoss.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {returnPercentage.toFixed(2)}% return
              </p>
            </CardContent>
          </Card>

          <Card className="tradezella-metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risk/Reward
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {riskRewardRatio.toFixed(2)}R
              </div>
              <p className="text-xs text-muted-foreground">
                Risk multiple
              </p>
            </CardContent>
          </Card>

          <Card className="tradezella-metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {trade.duration}m
              </div>
              <p className="text-xs text-muted-foreground">
                Trade length
              </p>
            </CardContent>
          </Card>

          <Card className="tradezella-metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Position Size
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {trade.positionSize}
              </div>
              <p className="text-xs text-muted-foreground">
                Shares/units
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trade Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trade Execution */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Trade Execution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Entry Price</Label>
                    <div className="text-lg font-semibold">${trade.entryPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Exit Price</Label>
                    <div className="text-lg font-semibold">${trade.exitPrice.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Confidence Level</Label>
                    <div className="flex items-center space-x-2">
                      <div className={cn("text-lg font-semibold", getGradeColor(trade.confidenceLevel))}>
                        {trade.confidenceLevel}/10
                      </div>
                      {trade.confidenceLevel >= 8 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : trade.confidenceLevel >= 6 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Execution Quality</Label>
                    <div className="flex items-center space-x-2">
                      <div className={cn("text-lg font-semibold", getGradeColor(trade.executionQuality))}>
                        {trade.executionQuality}/10
                      </div>
                      {trade.executionQuality >= 8 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : trade.executionQuality >= 6 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Analysis */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Trade Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Setup</Label>
                  <div className="mt-1">
                    <Badge className={cn("text-sm", getSetupColor(trade.setup))}>
                      {trade.setup}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Emotion</Label>
                  <div className="mt-1">
                    <Badge className={cn("text-sm", getEmotionColor(trade.emotion))}>
                      {trade.emotion}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Notes</Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{trade.notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart Placeholder */}
            <Card className="tradezella-widget">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Price Chart</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Maximize2 className="h-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Price chart with entry/exit markers</p>
                    <p className="text-xs">Chart integration coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata & Actions */}
          <div className="space-y-6">
            {/* Trade Metadata */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm">Trade Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trade ID</span>
                  <span className="text-sm font-mono">{trade.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">{new Date(trade.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="text-sm">{new Date(trade.date).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <span className="text-sm">Main Account</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">momentum</Badge>
                  <Badge variant="secondary">tech</Badge>
                  <Badge variant="secondary">breakout</Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Screenshots */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Image className="h-4 w-4" />
                  <span>Screenshots</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Image className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">No screenshots</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Screenshot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Trade
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Share className="h-4 w-4 mr-2" />
                  Share Trade
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Trade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              // Handle delete
              setShowDeleteDialog(false);
              navigate('/trades');
            }}>
              Delete Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Trade</DialogTitle>
            <DialogDescription>
              Share this trade analysis with others or export it for external use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-link">Share Link</Label>
              <Input 
                id="share-link" 
                value={`${window.location.origin}/trade/${trade.id}`}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="share-notes">Additional Notes</Label>
              <Textarea 
                id="share-notes"
                placeholder="Add any additional context for sharing..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle share
              setShowShareDialog(false);
            }}>
              Share Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
