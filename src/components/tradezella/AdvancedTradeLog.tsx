import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Star,
  StarOff,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

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
  tags: string[];
  isStarred: boolean;
}

interface AdvancedTradeLogProps {
  trades: Trade[];
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onToggleStar?: (tradeId: string) => void;
  onBulkAction?: (tradeIds: string[], action: string) => void;
}

export function AdvancedTradeLog({ 
  trades, 
  onEditTrade, 
  onDeleteTrade, 
  onToggleStar,
  onBulkAction 
}: AdvancedTradeLogProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedSetup, setSelectedSetup] = useState('all');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTrade, setEditingTrade] = useState<string | null>(null);

  // Get unique values for filters
  const uniqueSetups = useMemo(() => {
    const setups = new Set(trades.map(trade => trade.setup).filter(Boolean));
    return Array.from(setups);
  }, [trades]);

  const uniqueEmotions = useMemo(() => {
    const emotions = new Set(trades.map(trade => trade.emotion).filter(Boolean));
    return Array.from(emotions);
  }, [trades]);

  const uniqueTags = useMemo(() => {
    const tags = new Set(trades.flatMap(trade => trade.tags || []));
    return Array.from(tags);
  }, [trades]);

  const uniqueAccounts = useMemo(() => {
    const accounts = new Set(trades.map(trade => trade.accountId));
    return Array.from(accounts);
  }, [trades]);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!trade.asset.toLowerCase().includes(searchLower) &&
            !trade.notes.toLowerCase().includes(searchLower) &&
            !trade.setup.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Account filter
      if (selectedAccount !== 'all' && trade.accountId !== selectedAccount) {
        return false;
      }

      // Setup filter
      if (selectedSetup !== 'all' && trade.setup !== selectedSetup) {
        return false;
      }

      // Emotion filter
      if (selectedEmotion !== 'all' && trade.emotion !== selectedEmotion) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => 
          trade.tags && trade.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const tradeDate = new Date(trade.date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
        }
      }

      return true;
    });

    // Sort trades
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'profit':
          aValue = a.profitLoss;
          bValue = b.profitLoss;
          break;
        case 'asset':
          aValue = a.asset;
          bValue = b.asset;
          break;
        case 'setup':
          aValue = a.setup;
          bValue = b.setup;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, searchTerm, selectedAccount, selectedSetup, selectedEmotion, selectedTags, dateRange, sortBy, sortOrder]);

  const handleSelectTrade = (tradeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTrades(prev => [...prev, tradeId]);
    } else {
      setSelectedTrades(prev => prev.filter(id => id !== tradeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrades(filteredAndSortedTrades.map(trade => trade.id));
    } else {
      setSelectedTrades([]);
    }
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedTrades.length > 0) {
      onBulkAction(selectedTrades, action);
      setSelectedTrades([]);
    }
  };

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

  return (
    <Card className="tradezella-widget">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Trade Log</span>
              <Badge variant="secondary">{filteredAndSortedTrades.length} trades</Badge>
            </CardTitle>
            <CardDescription>
              Advanced filtering and management of your trading history
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </Button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trades by asset, notes, or setup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="profit">P&L</SelectItem>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="setup">Setup</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {uniqueAccounts.map(account => (
                    <SelectItem key={account} value={account}>
                      Account {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Setup</label>
              <Select value={selectedSetup} onValueChange={setSelectedSetup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Setups</SelectItem>
                  {uniqueSetups.map(setup => (
                    <SelectItem key={setup} value={setup}>
                      {setup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Emotion</label>
              <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emotions</SelectItem>
                  {uniqueEmotions.map(emotion => (
                    <SelectItem key={emotion} value={emotion}>
                      {emotion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedTrades.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {selectedTrades.length} trades selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('tag')}>
                <Tag className="h-4 w-4 mr-2" />
                Add Tags
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTrades.length === filteredAndSortedTrades.length && filteredAndSortedTrades.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Emotion</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTrades.map((trade) => (
                <TableRow key={trade.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedTrades.includes(trade.id)}
                      onCheckedChange={(checked) => handleSelectTrade(trade.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{trade.asset}</span>
                      {trade.isStarred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.direction === 'buy' ? 'default' : 'secondary'}>
                      {trade.tradeType}
                    </Badge>
                  </TableCell>
                  <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className={cn(
                      "flex items-center space-x-1",
                      trade.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {trade.profitLoss >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-medium">
                        {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getSetupColor(trade.setup))}>
                      {trade.setup}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getEmotionColor(trade.emotion))}>
                      {trade.emotion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(trade.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trade.date).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/trade/${trade.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTrade?.(trade)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Trade
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStar?.(trade.id)}>
                          {trade.isStarred ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove Star
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Star Trade
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteTrade?.(trade.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Trade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedTrades.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-2" />
              <p>No trades found matching your criteria</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedAccount('all');
              setSelectedSetup('all');
              setSelectedEmotion('all');
              setSelectedTags([]);
              setDateRange('all');
            }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}