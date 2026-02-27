import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Save,
  Bookmark,
  Calendar,
  TrendingUp,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { filterSetsApi } from "@/services/filterSetsApi";

interface FilterSet {
  id: number;
  name: string;
  description: string;
  filters: {
    timeframe?: string;
    symbol?: string;
    tradeType?: string;
    emotion?: string;
    setupType?: string;
    marketCondition?: string;
    minPnL?: number;
    maxPnL?: number;
    minDuration?: number;
    maxDuration?: number;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    notes?: string;
  };
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedFilterSetsProps {
  onApplyFilterSet: (filters: FilterSet['filters']) => void;
  /** Optional: if provided, called after save/update/delete (e.g. for parent refresh) */
  onSaveFilterSet?: (filterSet: Omit<FilterSet, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateFilterSet?: (id: number, filterSet: Partial<FilterSet>) => Promise<void>;
  onDeleteFilterSet?: (id: number) => Promise<void>;
  currentFilters?: FilterSet['filters'];
}

export function SavedFilterSets({ 
  onApplyFilterSet, 
  onSaveFilterSet, 
  onUpdateFilterSet, 
  onDeleteFilterSet,
  currentFilters = {}
}: SavedFilterSetsProps) {
  const [filterSets, setFilterSets] = useState<FilterSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilterSet, setEditingFilterSet] = useState<FilterSet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    filters: {
      timeframe: '',
      symbol: '',
      tradeType: '',
      emotion: '',
      setupType: '',
      marketCondition: '',
      minPnL: undefined as number | undefined,
      maxPnL: undefined as number | undefined,
      minDuration: undefined as number | undefined,
      maxDuration: undefined as number | undefined,
      startDate: '',
      endDate: '',
      tags: [] as string[],
      notes: '',
    },
    isDefault: false,
  });

  // Load filter sets
  useEffect(() => {
    loadFilterSets();
  }, []);

  const loadFilterSets = async () => {
    try {
      setIsLoading(true);
      const data = await filterSetsApi.getAll();
      setFilterSets(data.map(fs => ({
        ...fs,
        isDefault: fs.isDefault ?? (fs as any).is_default ?? false,
      })));
    } catch {
      toast({
        title: "Error",
        description: "Failed to load saved filter sets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingFilterSet) {
        await filterSetsApi.update(editingFilterSet.id, formData);
        await onUpdateFilterSet?.(editingFilterSet.id, formData);
        toast({
          title: "Success",
          description: "Filter set updated successfully",
        });
      } else {
        await filterSetsApi.create(formData);
        await onSaveFilterSet?.(formData);
        toast({
          title: "Success",
          description: "Filter set saved successfully",
        });
      }
      
      setIsDialogOpen(false);
      setEditingFilterSet(null);
      resetForm();
      loadFilterSets();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save filter set",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (filterSet: FilterSet) => {
    setEditingFilterSet(filterSet);
    setFormData({
      name: filterSet.name,
      description: filterSet.description,
      filters: filterSet.filters,
      isDefault: filterSet.isDefault,
    });
    setIsDialogOpen(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterSetToDelete, setFilterSetToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setFilterSetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (filterSetToDelete === null) return;
    const id = filterSetToDelete;
    setFilterSetToDelete(null);
    setDeleteDialogOpen(false);
    try {
      await filterSetsApi.delete(id);
      await onDeleteFilterSet?.(id);
      toast({
        title: "Success",
        description: "Filter set deleted successfully",
      });
      loadFilterSets();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete filter set",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      filters: {
        timeframe: '',
        symbol: '',
        tradeType: '',
        emotion: '',
        setupType: '',
        marketCondition: '',
        minPnL: undefined,
        maxPnL: undefined,
        minDuration: undefined,
        maxDuration: undefined,
        startDate: '',
        endDate: '',
        tags: [],
        notes: '',
      },
      isDefault: false,
    });
  };

  const handleNewFilterSet = () => {
    setEditingFilterSet(null);
    setFormData({
      ...formData,
      filters: currentFilters, // Pre-populate with current filters
    });
    setIsDialogOpen(true);
  };

  const handleApplyFilterSet = (filterSet: FilterSet) => {
    onApplyFilterSet(filterSet.filters);
    toast({
      title: "Filter Applied",
      description: `${filterSet.name} filter set applied`,
    });
  };

  const handleSaveCurrentFilters = () => {
    setEditingFilterSet(null);
    setFormData({
      name: '',
      description: '',
      filters: currentFilters,
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-32 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Bookmark className="w-5 h-5 mr-2" />
            Saved Filter Sets
          </h3>
          <p className="text-sm text-muted-foreground">
            Save and reuse common filter combinations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSaveCurrentFilters} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Current
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewFilterSet} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Filter Set
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFilterSet ? 'Edit Filter Set' : 'Create New Filter Set'}
                </DialogTitle>
                <DialogDescription>
                  Save your current filter settings for quick access
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Filter Set Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Winning Trades, NQ Breakouts"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={formData.filters.timeframe}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, timeframe: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="1d">Today</SelectItem>
                        <SelectItem value="1w">This Week</SelectItem>
                        <SelectItem value="1m">This Month</SelectItem>
                        <SelectItem value="3m">Last 3 Months</SelectItem>
                        <SelectItem value="1y">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this filter set..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      value={formData.filters.symbol}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, symbol: e.target.value }
                      })}
                      placeholder="e.g., NQ, ES, YM"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradeType">Trade Type</Label>
                    <Select
                      value={formData.filters.tradeType}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, tradeType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trade type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emotion">Emotion</Label>
                    <Select
                      value={formData.filters.emotion}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, emotion: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confident">Confident</SelectItem>
                        <SelectItem value="Calm">Calm</SelectItem>
                        <SelectItem value="Excited">Excited</SelectItem>
                        <SelectItem value="Nervous">Nervous</SelectItem>
                        <SelectItem value="Fearful">Fearful</SelectItem>
                        <SelectItem value="Greedy">Greedy</SelectItem>
                        <SelectItem value="Frustrated">Frustrated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupType">Setup Type</Label>
                    <Input
                      id="setupType"
                      value={formData.filters.setupType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, setupType: e.target.value }
                      })}
                      placeholder="e.g., Breakout, Pullback, Reversal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPnL">Min P&L ($)</Label>
                    <Input
                      id="minPnL"
                      type="number"
                      value={formData.filters.minPnL || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, minPnL: parseFloat(e.target.value) || undefined }
                      })}
                      placeholder="Minimum profit/loss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPnL">Max P&L ($)</Label>
                    <Input
                      id="maxPnL"
                      type="number"
                      value={formData.filters.maxPnL || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, maxPnL: parseFloat(e.target.value) || undefined }
                      })}
                      placeholder="Maximum profit/loss"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingFilterSet ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Sets Grid */}
      {filterSets.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Filter Sets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first filter set to save common filter combinations
            </p>
            <Button onClick={handleNewFilterSet}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Filter Set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterSets.map((filterSet) => (
            <Card key={filterSet.id} className="card-modern">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center">
                      {filterSet.name}
                      {filterSet.isDefault && (
                        <Badge variant="default" className="ml-2">Default</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {filterSet.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  {filterSet.filters.timeframe && (
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="capitalize">{filterSet.filters.timeframe}</span>
                    </div>
                  )}
                  
                  {filterSet.filters.symbol && (
                    <div className="flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{filterSet.filters.symbol}</span>
                    </div>
                  )}
                  
                  {filterSet.filters.tradeType && (
                    <div className="flex items-center text-sm">
                      <Target className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{filterSet.filters.tradeType}</span>
                    </div>
                  )}
                  
                  {filterSet.filters.emotion && (
                    <div className="flex items-center text-sm">
                      <span className="w-4 h-4 mr-2 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs">😊</span>
                      </span>
                      <span className="capitalize">{filterSet.filters.emotion}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApplyFilterSet(filterSet)}
                    className="flex-1"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(filterSet)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(filterSet.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete filter set?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this filter set? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
