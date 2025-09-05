import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  date: string;
  asset: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  profitLoss: number;
  notes: string;
  emotion: string;
  setup?: string;
  screenshot?: string;
}

interface DuplicateTradeProps {
  trade: Trade;
  onDuplicate: (duplicatedTrade: Omit<Trade, 'id'>) => void;
  trigger?: React.ReactNode;
}

export function DuplicateTrade({ trade, onDuplicate, trigger }: DuplicateTradeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState({
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format
    asset: trade.asset,
    tradeType: trade.tradeType,
    entryPrice: trade.entryPrice.toString(),
    exitPrice: trade.exitPrice.toString(),
    positionSize: trade.positionSize.toString(),
    profitLoss: '', // Leave empty for new calculation
    notes: `${trade.notes}\n[Duplicated from trade ${trade.id}]`,
    emotion: trade.emotion,
    setup: trade.setup || '',
  });
  const [modifications, setModifications] = useState({
    adjustPrices: false,
    adjustSize: false,
    adjustTime: false,
    keepPnL: false,
  });
  const { toast } = useToast();

  const handleDuplicate = () => {
    if (!duplicateData.asset || !duplicateData.tradeType) {
      toast({
        title: "Missing required fields",
        description: "Please fill in asset and trade type.",
        variant: "destructive",
      });
      return;
    }

    const duplicatedTrade: Omit<Trade, 'id'> = {
      date: duplicateData.date,
      asset: duplicateData.asset,
      tradeType: duplicateData.tradeType,
      entryPrice: parseFloat(duplicateData.entryPrice) || 0,
      exitPrice: parseFloat(duplicateData.exitPrice) || 0,
      positionSize: parseFloat(duplicateData.positionSize) || 1,
      profitLoss: duplicateData.profitLoss ? parseFloat(duplicateData.profitLoss) : 0,
      notes: duplicateData.notes,
      emotion: duplicateData.emotion,
      setup: duplicateData.setup,
      screenshot: trade.screenshot, // Keep original screenshot
    };

    onDuplicate(duplicatedTrade);
    setIsOpen(false);
    
    toast({
      title: "Trade duplicated",
      description: `Trade has been duplicated with your modifications.`,
    });
  };

  const handleReset = () => {
    setDuplicateData({
      date: new Date().toISOString().slice(0, 16),
      asset: trade.asset,
      tradeType: trade.tradeType,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      positionSize: trade.positionSize.toString(),
      profitLoss: '',
      notes: `${trade.notes}\n[Duplicated from trade ${trade.id}]`,
      emotion: trade.emotion,
      setup: trade.setup || '',
    });
    setModifications({
      adjustPrices: false,
      adjustSize: false,
      adjustTime: false,
      keepPnL: false,
    });
  };

  const calculateNewPnL = () => {
    const entry = parseFloat(duplicateData.entryPrice) || 0;
    const exit = parseFloat(duplicateData.exitPrice) || 0;
    const size = parseFloat(duplicateData.positionSize) || 1;
    
    if (duplicateData.tradeType === 'Buy') {
      return (exit - entry) * size;
    } else {
      return (entry - exit) * size;
    }
  };

  const originalPnL = trade.tradeType === 'Buy' 
    ? (trade.exitPrice - trade.entryPrice) * trade.positionSize
    : (trade.entryPrice - trade.exitPrice) * trade.positionSize;

  const newPnL = calculateNewPnL();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="w-5 h-5" />
            <span>Duplicate Trade</span>
          </DialogTitle>
          <DialogDescription>
            Create a copy of this trade with your modifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Trade Summary */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Original Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="ml-2 font-medium">{trade.asset}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium">{trade.tradeType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entry:</span>
                  <span className="ml-2 font-medium">${trade.entryPrice}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit:</span>
                  <span className="ml-2 font-medium">${trade.exitPrice}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-2 font-medium">{trade.positionSize}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">P&L:</span>
                  <span className={`ml-2 font-medium ${originalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${originalPnL.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modification Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium">Quick Modifications:</Label>
              <div className="flex space-x-2">
                <Button
                  variant={modifications.adjustTime ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModifications(prev => ({ ...prev, adjustTime: !prev.adjustTime }))}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Time
                </Button>
                <Button
                  variant={modifications.adjustPrices ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModifications(prev => ({ ...prev, adjustPrices: !prev.adjustPrices }))}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Prices
                </Button>
                <Button
                  variant={modifications.adjustSize ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModifications(prev => ({ ...prev, adjustSize: !prev.adjustSize }))}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Size
                </Button>
              </div>
            </div>
          </div>

          {/* Duplicate Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-date">Date & Time</Label>
                <Input
                  id="duplicate-date"
                  type="datetime-local"
                  value={duplicateData.date}
                  onChange={(e) => setDuplicateData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-asset">Asset *</Label>
                <Input
                  id="duplicate-asset"
                  value={duplicateData.asset}
                  onChange={(e) => setDuplicateData(prev => ({ ...prev, asset: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-type">Trade Type *</Label>
                <Select value={duplicateData.tradeType} onValueChange={(value) => setDuplicateData(prev => ({ ...prev, tradeType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-emotion">Emotion</Label>
                <Select value={duplicateData.emotion} onValueChange={(value) => setDuplicateData(prev => ({ ...prev, emotion: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="nervous">Nervous</SelectItem>
                    <SelectItem value="greedy">Greedy</SelectItem>
                    <SelectItem value="fearful">Fearful</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="satisfied">Satisfied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-entry">Entry Price</Label>
                <Input
                  id="duplicate-entry"
                  type="number"
                  step="0.01"
                  value={duplicateData.entryPrice}
                  onChange={(e) => setDuplicateData(prev => ({ ...prev, entryPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-exit">Exit Price</Label>
                <Input
                  id="duplicate-exit"
                  type="number"
                  step="0.01"
                  value={duplicateData.exitPrice}
                  onChange={(e) => setDuplicateData(prev => ({ ...prev, exitPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-size">Position Size</Label>
                <Input
                  id="duplicate-size"
                  type="number"
                  step="0.01"
                  value={duplicateData.positionSize}
                  onChange={(e) => setDuplicateData(prev => ({ ...prev, positionSize: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duplicate-setup">Setup</Label>
              <Input
                id="duplicate-setup"
                value={duplicateData.setup}
                onChange={(e) => setDuplicateData(prev => ({ ...prev, setup: e.target.value }))}
                placeholder="Trading setup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duplicate-notes">Notes</Label>
              <Textarea
                id="duplicate-notes"
                value={duplicateData.notes}
                onChange={(e) => setDuplicateData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* P&L Calculation */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Calculated P&L</div>
                    <div className={`text-lg font-bold ${newPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${newPnL.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">vs Original</div>
                    <div className={`text-sm font-medium ${newPnL >= originalPnL ? 'text-green-600' : 'text-red-600'}`}>
                      {newPnL >= originalPnL ? '+' : ''}${(newPnL - originalPnL).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate}>
              <Save className="w-4 h-4 mr-1" />
              Duplicate Trade
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
