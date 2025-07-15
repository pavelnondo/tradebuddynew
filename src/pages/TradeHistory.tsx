import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ChecklistItem, Trade } from "@/types";
import { Download, Filter, Image, Search, Trash2, Loader2, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useApiTrades } from '@/hooks/useApiTrades';
import { buildApiUrl, getAuthHeaders } from '@/lib/api';
import TradeForm from "@/components/TradeForm";

export default function TradeHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeTypeFilter, setTradeTypeFilter] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { trades, isLoading, error, fetchTrades } = useApiTrades();
  
  const { toast } = useToast();
  
  // Apply filters to trades
  const filteredTrades = trades.filter((trade) => {
    // Search term filter
    if (
      searchTerm &&
      !trade.asset.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !trade.notes.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    // Trade type filter
    if (tradeTypeFilter !== "all" && trade.tradeType !== tradeTypeFilter) {
      return false;
    }
    
    // Emotion filter
    if (emotionFilter !== "all" && trade.emotion !== emotionFilter) {
      return false;
    }
    
    return true;
  });
  
  // Delete trade
  const handleDeleteTrade = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const res = await fetch(buildApiUrl(`/trades/${id}`), { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchTrades();
        if (selectedTrade && selectedTrade.id === id) setSelectedTrade(null);
        toast({
          title: "Trade Deleted",
          description: "The trade has been removed from your history.",
        });
      } else {
        throw new Error("Failed to delete trade");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Download trade data as CSV
  const downloadCsv = () => {
    // Convert trades to CSV format
    const headers = ["Date", "Asset", "Trade Type", "Entry Price", "Exit Price", "Position Size", "Profit/Loss", "Emotion", "Notes"];
    const rows = filteredTrades.map((trade) => [
      new Date(trade.date).toLocaleString(),
      trade.asset,
      trade.tradeType,
      typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(2) : '0.00',
      typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(2) : '0.00',
      trade.positionSize,
      typeof trade.profitLoss === 'number' ? (trade.profitLoss >= 0 ? "+" : "") + `$${trade.profitLoss.toFixed(2)}` : '$0.00',
      trade.emotion,
      `"${trade.notes.replace(/"/g, '""')}"`, // Handle quotes in notes
    ]);
    
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "trade_history.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // View trade details
  const viewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  // Calculate checklist completion percentage
  const calculateCompletionPercentage = (items: ChecklistItem[] = []) => {
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Add state for editing
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Edit trade handler
  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({
      asset: trade.asset,
      tradeType: trade.tradeType,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      positionSize: trade.positionSize,
      profitLoss: trade.profitLoss,
      notes: trade.notes,
      emotion: trade.emotion,
      setup: trade.setup,
      executionQuality: trade.executionQuality,
      duration: trade.duration,
      checklist_id: trade.checklist_id,
      checklist_completed: trade.checklist_completed,
      screenshot: trade.screenshot,
      date: trade.date,
    });
  };

  // Save edit
  const handleSaveEdit = async (tradeData) => {
    if (!editingTrade) return;
    try {
      const res = await fetch(buildApiUrl(`/trades/${editingTrade.id}`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(tradeData),
      });
      if (res.ok) {
        await fetchTrades();
        setEditingTrade(null);
        toast({ title: 'Trade Updated', description: 'The trade has been updated.' });
      } else {
        throw new Error('Failed to update trade');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update trade. Please try again.', variant: 'destructive' });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingTrade(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trade History</h1>
        <Button variant="outline" onClick={downloadCsv} disabled={filteredTrades.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets or notes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={tradeTypeFilter} onValueChange={setTradeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trade Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trade Types</SelectItem>
                <SelectItem value="Buy">Buy</SelectItem>
                <SelectItem value="Sell">Sell</SelectItem>
                <SelectItem value="Long">Long</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={emotionFilter} onValueChange={setEmotionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Emotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emotions</SelectItem>
                <SelectItem value="Confident">Confident</SelectItem>
                <SelectItem value="Nervous">Nervous</SelectItem>
                <SelectItem value="Greedy">Greedy</SelectItem>
                <SelectItem value="Fearful">Fearful</SelectItem>
                <SelectItem value="Calm">Calm</SelectItem>
                <SelectItem value="Excited">Excited</SelectItem>
                <SelectItem value="Frustrated">Frustrated</SelectItem>
                <SelectItem value="Satisfied">Satisfied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Trades Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>P/L</TableHead>
                  <TableHead>Emotion</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                      <p className="mt-2 text-muted-foreground">Loading trades...</p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-4 text-red-500">
                      Error loading trades: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-4">
                      No trades found. Try adjusting your filters or add new trades.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id} onClick={() => viewTrade(trade)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{new Date(trade.date).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{trade.asset}</TableCell>
                      <TableCell>{trade.tradeType}</TableCell>
                      <TableCell>${typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(2) : '0.00'}</TableCell>
                      <TableCell>${typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(2) : '0.00'}</TableCell>
                      <TableCell>{trade.positionSize}</TableCell>
                      <TableCell className={typeof trade.profitLoss === 'number' ? (trade.profitLoss >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground"}>
                        {typeof trade.profitLoss === 'number' ? (trade.profitLoss >= 0 ? "+" : "") + `$${trade.profitLoss.toFixed(2)}` : '$0.00'}
                      </TableCell>
                      <TableCell>{trade.emotion}</TableCell>
                      <TableCell>
                        {trade.checklist_completed && trade.checklist_completed.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={calculateCompletionPercentage(trade.checklist_completed)} 
                              className="h-2 w-12" 
                            />
                            <span className="text-xs">
                              {calculateCompletionPercentage(trade.checklist_completed)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.screenshot ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Image className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Trade Screenshot</DialogTitle>
                                <DialogDescription>
                                  {trade.asset} {trade.tradeType} on {new Date(trade.date).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <img
                                  src={trade.screenshot}
                                  alt={`${trade.asset} ${trade.tradeType} screenshot`}
                                  className="w-full rounded-md"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{trade.notes}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleEditTrade(trade); }}>
                          Edit
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={e => handleDeleteTrade(trade.id, e)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Trade Details Dialog */}
      {selectedTrade && (
        <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTrade.asset} {selectedTrade.tradeType} Trade
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedTrade.date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="font-semibold mb-2">Trade Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Asset:</dt>
                    <dd className="font-medium">{selectedTrade.asset}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trade Type:</dt>
                    <dd>{selectedTrade.tradeType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Entry Price:</dt>
                    <dd>${typeof selectedTrade.entryPrice === 'number' ? selectedTrade.entryPrice.toFixed(2) : '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Exit Price:</dt>
                    <dd>${typeof selectedTrade.exitPrice === 'number' ? selectedTrade.exitPrice.toFixed(2) : '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Position Size:</dt>
                    <dd>{selectedTrade.positionSize}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Profit/Loss:</dt>
                    <dd className={typeof selectedTrade.profitLoss === 'number' ? (selectedTrade.profitLoss >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold") : "text-muted-foreground"}>
                      {typeof selectedTrade.profitLoss === 'number' ? (selectedTrade.profitLoss >= 0 ? "+" : "") + `$${selectedTrade.profitLoss.toFixed(2)}` : '$0.00'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Emotion:</dt>
                    <dd>{selectedTrade.emotion}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedTrade.notes}</p>
              </div>
            </div>
            
            {/* Display Checklist if available */}
            {selectedTrade.checklist_completed && selectedTrade.checklist_completed.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Trading Checklist Completion
                </h3>
                <div className="mb-2">
                  <Progress 
                    value={calculateCompletionPercentage(selectedTrade.checklist_completed)} 
                    className="h-2 mb-1" 
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {calculateCompletionPercentage(selectedTrade.checklist_completed)}% completed
                  </p>
                </div>
                <Card className="border-dashed">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      {selectedTrade.checklist_completed.map((item) => (
                        <div key={item.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`view-checklist-item-${item.id}`}
                            checked={item.completed}
                            disabled
                          />
                          <label
                            htmlFor={`view-checklist-item-${item.id}`}
                            className={`text-sm ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {selectedTrade.screenshot && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Screenshot</h3>
                <img
                  src={selectedTrade.screenshot}
                  alt={`${selectedTrade.asset} ${selectedTrade.tradeType} screenshot`}
                  className="w-full rounded-md"
                />
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="destructive" 
                onClick={(e) => {
                  handleDeleteTrade(selectedTrade.id, e);
                  setSelectedTrade(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Trade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Render edit form if editingTrade is set */}
      {editingTrade && (
        <TradeForm
          mode="edit"
          initialValues={editingTrade}
          onSubmit={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
