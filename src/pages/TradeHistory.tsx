import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trade, TradeType } from "@/types";
import { Download, Filter, Image, Search } from "lucide-react";
import { useState } from "react";

export default function TradeHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeTypeFilter, setTradeTypeFilter] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  // Get trades from localStorage
  const trades = JSON.parse(localStorage.getItem('trades') || '[]') as Trade[];
  
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
  
  // Download trade data as CSV
  const downloadCsv = () => {
    // Convert trades to CSV format
    const headers = ["Date", "Asset", "Trade Type", "Entry Price", "Exit Price", "Position Size", "Profit/Loss", "Emotion", "Notes"];
    const rows = filteredTrades.map((trade) => [
      new Date(trade.date).toLocaleString(),
      trade.asset,
      trade.tradeType,
      trade.entryPrice,
      trade.exitPrice,
      trade.positionSize,
      trade.profitLoss,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trade History</h1>
        <Button variant="outline" onClick={downloadCsv}>
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
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">
                      No trades found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewTrade(trade)}>
                      <TableCell>{new Date(trade.date).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{trade.asset}</TableCell>
                      <TableCell>{trade.tradeType}</TableCell>
                      <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell>{trade.positionSize}</TableCell>
                      <TableCell className={trade.profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                        {trade.profitLoss >= 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                      </TableCell>
                      <TableCell>{trade.emotion}</TableCell>
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
                    <dd>${selectedTrade.entryPrice.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Exit Price:</dt>
                    <dd>${selectedTrade.exitPrice.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Position Size:</dt>
                    <dd>{selectedTrade.positionSize}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Profit/Loss:</dt>
                    <dd className={selectedTrade.profitLoss >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                      {selectedTrade.profitLoss >= 0 ? "+" : ""}${selectedTrade.profitLoss.toFixed(2)}
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
            {selectedTrade.screenshot && (
              <div>
                <h3 className="font-semibold mb-2">Screenshot</h3>
                <img
                  src={selectedTrade.screenshot}
                  alt={`${selectedTrade.asset} ${selectedTrade.tradeType} screenshot`}
                  className="w-full rounded-md"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
