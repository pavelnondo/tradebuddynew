import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Clock,
  Tag,
  FileText,
  X,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchCriteria {
  query: string;
  searchIn: ('all' | 'notes' | 'tags' | 'symbol' | 'setupType')[];
  dateRange: {
    start: string;
    end: string;
  };
  pnlRange: {
    min: number | undefined;
    max: number | undefined;
  };
  durationRange: {
    min: number | undefined;
    max: number | undefined;
  };
  symbols: string[];
  emotions: string[];
  tradeTypes: string[];
  setupTypes: string[];
  marketConditions: string[];
  tags: string[];
  exactMatch: boolean;
  caseSensitive: boolean;
}

interface AdvancedSearchProps {
  onSearch: (criteria: SearchCriteria) => void;
  onClear: () => void;
  searchResults?: {
    total: number;
    trades: any[];
  };
  isLoading?: boolean;
}

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  searchResults,
  isLoading = false 
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    query: '',
    searchIn: ['all'],
    dateRange: {
      start: '',
      end: '',
    },
    pnlRange: {
      min: undefined,
      max: undefined,
    },
    durationRange: {
      min: undefined,
      max: undefined,
    },
    symbols: [],
    emotions: [],
    tradeTypes: [],
    setupTypes: [],
    marketConditions: [],
    tags: [],
    exactMatch: false,
    caseSensitive: false,
  });

  const [newTag, setNewTag] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const { toast } = useToast();

  const handleSearch = () => {
    if (!criteria.query.trim() && !hasAnyFilters()) {
      toast({
        title: "Search Required",
        description: "Please enter a search query or apply filters",
        variant: "destructive",
      });
      return;
    }

    onSearch(criteria);
  };

  const handleClear = () => {
    setCriteria({
      query: '',
      searchIn: ['all'],
      dateRange: { start: '', end: '' },
      pnlRange: { min: undefined, max: undefined },
      durationRange: { min: undefined, max: undefined },
      symbols: [],
      emotions: [],
      tradeTypes: [],
      setupTypes: [],
      marketConditions: [],
      tags: [],
      exactMatch: false,
      caseSensitive: false,
    });
    onClear();
  };

  const hasAnyFilters = () => {
    return (
      criteria.dateRange.start ||
      criteria.dateRange.end ||
      criteria.pnlRange.min !== undefined ||
      criteria.pnlRange.max !== undefined ||
      criteria.durationRange.min !== undefined ||
      criteria.durationRange.max !== undefined ||
      criteria.symbols.length > 0 ||
      criteria.emotions.length > 0 ||
      criteria.tradeTypes.length > 0 ||
      criteria.setupTypes.length > 0 ||
      criteria.marketConditions.length > 0 ||
      criteria.tags.length > 0
    );
  };

  const addTag = () => {
    if (newTag.trim() && !criteria.tags.includes(newTag.trim())) {
      setCriteria({
        ...criteria,
        tags: [...criteria.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCriteria({
      ...criteria,
      tags: criteria.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const addSymbol = () => {
    if (newSymbol.trim() && !criteria.symbols.includes(newSymbol.trim().toUpperCase())) {
      setCriteria({
        ...criteria,
        symbols: [...criteria.symbols, newSymbol.trim().toUpperCase()],
      });
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbolToRemove: string) => {
    setCriteria({
      ...criteria,
      symbols: criteria.symbols.filter(symbol => symbol !== symbolToRemove),
    });
  };

  const toggleArrayValue = (array: string[], value: string, setter: (value: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Advanced Search
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
        <CardDescription>
          Search through your trades with advanced filters and criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Search Query</Label>
          <div className="flex space-x-2">
            <Input
              id="search-query"
              value={criteria.query}
              onChange={(e) => setCriteria({ ...criteria, query: e.target.value })}
              placeholder="Search in notes, tags, symbols, or setup types..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Options */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="exact-match"
              checked={criteria.exactMatch}
              onChange={(e) => setCriteria({ ...criteria, exactMatch: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="exact-match" className="text-sm">Exact Match</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="case-sensitive"
              checked={criteria.caseSensitive}
              onChange={(e) => setCriteria({ ...criteria, caseSensitive: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="case-sensitive" className="text-sm">Case Sensitive</Label>
          </div>
        </div>

        {/* Search Results Summary */}
        {searchResults && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Found {searchResults.total} trade{searchResults.total !== 1 ? 's' : ''}
              </span>
              {searchResults.total > 0 && (
                <Badge variant="outline">
                  {searchResults.trades.length} displayed
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={criteria.dateRange.start}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      dateRange: { ...criteria.dateRange, start: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={criteria.dateRange.end}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      dateRange: { ...criteria.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* P&L Range */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                P&L Range ($)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-pnl" className="text-sm">Minimum P&L</Label>
                  <Input
                    id="min-pnl"
                    type="number"
                    value={criteria.pnlRange.min || ''}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      pnlRange: { ...criteria.pnlRange, min: parseFloat(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <Label htmlFor="max-pnl" className="text-sm">Maximum P&L</Label>
                  <Input
                    id="max-pnl"
                    type="number"
                    value={criteria.pnlRange.max || ''}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      pnlRange: { ...criteria.pnlRange, max: parseFloat(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>
            </div>

            {/* Duration Range */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Duration Range (minutes)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-duration" className="text-sm">Minimum Duration</Label>
                  <Input
                    id="min-duration"
                    type="number"
                    value={criteria.durationRange.min || ''}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      durationRange: { ...criteria.durationRange, min: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <Label htmlFor="max-duration" className="text-sm">Maximum Duration</Label>
                  <Input
                    id="max-duration"
                    type="number"
                    value={criteria.durationRange.max || ''}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      durationRange: { ...criteria.durationRange, max: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 60"
                  />
                </div>
              </div>
            </div>

            {/* Symbols */}
            <div className="space-y-2">
              <Label>Symbols</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {criteria.symbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary" className="flex items-center gap-1">
                    {symbol}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeSymbol(symbol)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="Add symbol (e.g., NQ, ES)"
                  onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
                />
                <Button type="button" onClick={addSymbol} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Emotions */}
            <div className="space-y-2">
              <Label>Emotions</Label>
              <div className="flex flex-wrap gap-2">
                {['Confident', 'Calm', 'Excited', 'Nervous', 'Fearful', 'Greedy', 'Frustrated'].map((emotion) => (
                  <Badge
                    key={emotion}
                    variant={criteria.emotions.includes(emotion) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue(criteria.emotions, emotion, (value) => 
                      setCriteria({ ...criteria, emotions: value })
                    )}
                  >
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Trade Types */}
            <div className="space-y-2">
              <Label>Trade Types</Label>
              <div className="flex flex-wrap gap-2">
                {['Buy', 'Sell'].map((type) => (
                  <Badge
                    key={type}
                    variant={criteria.tradeTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue(criteria.tradeTypes, type, (value) => 
                      setCriteria({ ...criteria, tradeTypes: value })
                    )}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Setup Types */}
            <div className="space-y-2">
              <Label>Setup Types</Label>
              <div className="flex flex-wrap gap-2">
                {['Breakout', 'Pullback', 'Reversal', 'Scalp', 'Swing', 'Momentum'].map((setup) => (
                  <Badge
                    key={setup}
                    variant={criteria.setupTypes.includes(setup) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue(criteria.setupTypes, setup, (value) => 
                      setCriteria({ ...criteria, setupTypes: value })
                    )}
                  >
                    {setup}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Market Conditions */}
            <div className="space-y-2">
              <Label>Market Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {['trending', 'ranging', 'volatile', 'calm', 'news'].map((condition) => (
                  <Badge
                    key={condition}
                    variant={criteria.marketConditions.includes(condition) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleArrayValue(criteria.marketConditions, condition, (value) => 
                      setCriteria({ ...criteria, marketConditions: value })
                    )}
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {criteria.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add custom tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
