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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Edit, 
  Copy, 
  Tag, 
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle
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
}

interface BulkOperationsProps {
  trades: Trade[];
  selectedTrades: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onTradesUpdate: (updatedTrades: Trade[]) => void;
  onTradesDelete: (deletedIds: string[]) => void;
}

export function BulkOperations({ 
  trades, 
  selectedTrades, 
  onSelectionChange, 
  onTradesUpdate, 
  onTradesDelete 
}: BulkOperationsProps) {
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    emotion: '',
    setup: '',
    notes: '',
    tags: ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const selectedTradesData = trades.filter(trade => selectedTrades.includes(trade.id));

  const handleSelectAll = () => {
    if (selectedTrades.length === trades.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trades.map(trade => trade.id));
    }
  };

  const handleBulkEdit = () => {
    if (selectedTrades.length === 0) {
      toast({
        title: "No trades selected",
        description: "Please select trades to edit.",
        variant: "destructive",
      });
      return;
    }

    const updatedTrades = trades.map(trade => {
      if (selectedTrades.includes(trade.id)) {
        return {
          ...trade,
          emotion: bulkEditData.emotion || trade.emotion,
          setup: bulkEditData.setup || trade.setup,
          notes: bulkEditData.notes ? `${trade.notes}\n[Bulk Edit]: ${bulkEditData.notes}` : trade.notes,
        };
      }
      return trade;
    });

    onTradesUpdate(updatedTrades);
    setBulkEditMode(false);
    setBulkEditData({ emotion: '', setup: '', notes: '', tags: '' });
    
    toast({
      title: "Bulk edit completed",
      description: `Updated ${selectedTrades.length} trades.`,
    });
  };

  const handleBulkDelete = () => {
    onTradesDelete(selectedTrades);
    onSelectionChange([]);
    setShowDeleteDialog(false);
    
    toast({
      title: "Trades deleted",
      description: `Deleted ${selectedTrades.length} trades.`,
    });
  };

  const handleDuplicateTrades = () => {
    if (selectedTrades.length === 0) {
      toast({
        title: "No trades selected",
        description: "Please select trades to duplicate.",
        variant: "destructive",
      });
      return;
    }

    const duplicatedTrades = selectedTradesData.map(trade => ({
      ...trade,
      id: `${trade.id}_copy_${Date.now()}`,
      date: new Date().toISOString(),
      notes: `${trade.notes}\n[Duplicated from ${trade.id}]`,
    }));

    // Add duplicated trades to the list
    onTradesUpdate([...trades, ...duplicatedTrades]);
    
    toast({
      title: "Trades duplicated",
      description: `Duplicated ${selectedTrades.length} trades.`,
    });
  };

  const handleExportSelected = () => {
    if (selectedTrades.length === 0) {
      toast({
        title: "No trades selected",
        description: "Please select trades to export.",
        variant: "destructive",
      });
      return;
    }

    const csvData = selectedTradesData.map(trade => ({
      Date: trade.date,
      Asset: trade.asset,
      Type: trade.tradeType,
      'Entry Price': trade.entryPrice,
      'Exit Price': trade.exitPrice,
      'Position Size': trade.positionSize,
      'P&L': trade.profitLoss,
      Emotion: trade.emotion,
      Setup: trade.setup || '',
      Notes: trade.notes,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: `Exported ${selectedTrades.length} trades to CSV.`,
    });
  };

  const totalPnL = selectedTradesData.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const winRate = selectedTradesData.length > 0 
    ? (selectedTradesData.filter(trade => trade.profitLoss > 0).length / selectedTradesData.length) * 100 
    : 0;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Bulk Operations</span>
          {selectedTrades.length > 0 && (
            <Badge variant="secondary">{selectedTrades.length} selected</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage multiple trades at once with bulk operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedTrades.length === trades.length && trades.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all">
              Select All ({trades.length} trades)
            </Label>
          </div>
          
          {selectedTrades.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Total P&L: <span className={totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>${totalPnL.toFixed(2)}</span></span>
              <span>•</span>
              <span>Win Rate: {winRate.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        {selectedTrades.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkEditMode(!bulkEditMode)}
              className="flex items-center space-x-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicateTrades}
              className="flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Delete Selected Trades</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedTrades.length} selected trades? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                    Delete {selectedTrades.length} Trades
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Bulk Edit Form */}
        {bulkEditMode && selectedTrades.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg">Bulk Edit Selected Trades</CardTitle>
              <CardDescription>
                Update {selectedTrades.length} selected trades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-emotion">Emotion</Label>
                  <Select value={bulkEditData.emotion} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, emotion: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select emotion" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-setup">Setup</Label>
                  <Input
                    id="bulk-setup"
                    placeholder="Trading setup"
                    value={bulkEditData.setup}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, setup: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bulk-notes">Additional Notes</Label>
                <Textarea
                  id="bulk-notes"
                  placeholder="Add notes to all selected trades"
                  value={bulkEditData.notes}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleBulkEdit} className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Apply Changes</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBulkEditMode(false)}
                  className="flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
