import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  FileText,
  Target,
  Users,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiTrades } from '@/hooks/useApiTrades';
import { useToast } from "@/hooks/use-toast";
import { tradeApi } from '@/services/tradeApi';
import { BulkOperations } from "@/components/BulkOperations";
import { EnhancedTradeTemplates } from "@/components/EnhancedTradeTemplates";
import { DuplicateTrade } from "@/components/DuplicateTrade";

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

export default function TradeManagement() {
  const navigate = useNavigate();
  const { trades, isLoading, error, refetch } = useApiTrades();
  const { toast } = useToast();
  
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'asset'>('date');

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    
    return trades
      .filter(trade => {
        const matchesSearch = searchQuery === '' || 
          trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (trade.setup && trade.setup.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesAsset = filterAsset === 'all' || trade.asset === filterAsset;
        const matchesType = filterType === 'all' || trade.tradeType === filterType;
        
        return matchesSearch && matchesAsset && matchesType;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'pnl':
            return b.profitLoss - a.profitLoss;
          case 'asset':
            return a.asset.localeCompare(b.asset);
          default:
            return 0;
        }
      });
  }, [trades, searchQuery, filterAsset, filterType, sortBy]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const winningTrades = filteredTrades.filter(trade => trade.profitLoss > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

    return {
      totalTrades,
      totalPnL,
      winRate,
      avgPnL,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
    };
  }, [filteredTrades]);

  // Get unique assets for filtering
  const uniqueAssets = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    return Array.from(new Set(trades.map(trade => trade.asset).filter(Boolean)));
  }, [trades]);

  const handleTradesUpdate = async (updatedTrades: Trade[]) => {
    try {
      // In a real implementation, you would make API calls to update trades
      console.log('Updating trades:', updatedTrades);
      await refetch();
    } catch (error) {
      toast({
        title: "Error updating trades",
        description: "Failed to update trades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTradesDelete = async (tradeIds: string[]) => {
    try {
      // Delete trades via API
      await Promise.all(tradeIds.map(id => tradeApi.deleteTrade(id)));
      await refetch();
      
      toast({
        title: "Trades deleted",
        description: `Successfully deleted ${tradeIds.length} trades.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting trades",
        description: "Failed to delete trades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTrade = async (duplicatedTrade: Omit<Trade, 'id'>) => {
    try {
      await tradeApi.createTrade(duplicatedTrade);
      await refetch();
      
      toast({
        title: "Trade duplicated",
        description: "Trade has been successfully duplicated.",
      });
    } catch (error) {
      toast({
        title: "Error duplicating trade",
        description: "Failed to duplicate trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateCreate = (template: any) => {
    // Template creation is handled within the component via localStorage
    console.log('Template created:', template);
  };

  const handleTemplateSelect = (template: any) => {
    // Navigate to add trade page with template data
    navigate('/add-trade', { 
      state: { 
        template: {
          asset: template.asset,
          tradeType: template.tradeType,
          entryPrice: template.entryPrice,
          exitPrice: template.exitPrice,
          positionSize: template.positionSize,
          setup: template.setup,
          emotion: template.emotion,
          notes: template.notes,
        }
      }
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <TrendingDown className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Error Loading Trades</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Management</h1>
          <p className="text-muted-foreground">
            Advanced tools for managing your trading data and templates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Professional Tools</span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{metrics.totalTrades}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${
                  metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${metrics.totalPnL.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg P&L</p>
                <p className={`text-2xl font-bold ${
                  metrics.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${metrics.avgPnL.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tools Tabs */}
      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="templates">Trade Templates</TabsTrigger>
          <TabsTrigger value="tools">Advanced Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-6">
          {/* Search and Filters */}
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search trades..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterAsset}
                    onChange={(e) => setFilterAsset(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Assets</option>
                    {uniqueAssets.map(asset => (
                      <option key={asset} value={asset}>{asset}</option>
                    ))}
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="pnl">Sort by P&L</option>
                    <option value="asset">Sort by Asset</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          <BulkOperations
            trades={filteredTrades}
            selectedTrades={selectedTrades}
            onSelectionChange={setSelectedTrades}
            onTradesUpdate={handleTradesUpdate}
            onTradesDelete={handleTradesDelete}
          />

          {/* Trades List with Selection */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Trade List</CardTitle>
              <CardDescription>
                Select trades to perform bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded shimmer"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTrades.map(trade => (
                    <div 
                      key={trade.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTrades.includes(trade.id) 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => {
                        if (selectedTrades.includes(trade.id)) {
                          setSelectedTrades(prev => prev.filter(id => id !== trade.id));
                        } else {
                          setSelectedTrades(prev => [...prev, trade.id]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedTrades.includes(trade.id)}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="font-medium">{trade.asset}</div>
                            <div className="text-sm text-muted-foreground">
                              {trade.tradeType} • {new Date(trade.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className={`font-medium ${
                            trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${trade.profitLoss.toFixed(2)}
                          </div>
                          <DuplicateTrade
                            trade={trade}
                            onDuplicate={handleDuplicateTrade}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTrades.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No trades found</p>
                      <p className="text-sm">Adjust your filters or add some trades</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <EnhancedTradeTemplates
            onTemplateSelect={handleTemplateSelect}
            onTemplateCreate={handleTemplateCreate}
            onTemplateUpdate={(id, updates) => {
              console.log('Template updated:', id, updates);
            }}
            onTemplateDelete={(id) => {
              console.log('Template deleted:', id);
            }}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Import/Export Tools */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Import/Export</span>
                </CardTitle>
                <CardDescription>
                  Bulk import trades or export data for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from CSV
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
                <CardDescription>
                  Advanced data management and cleanup tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Auto-Tag Trades
                </Button>
                <Button variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Find Duplicates
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Sync Timestamps
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
