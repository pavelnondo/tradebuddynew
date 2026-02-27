import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  Plus, 
  Tag, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  conditions: FilterCondition[];
  isPublic: boolean;
  createdAt: string;
  usageCount: number;
}

interface AdvancedFilteringProps {
  trades: any[];
  onFilterChange: (filteredTrades: any[]) => void;
  availableFields: string[];
  availableTags: string[];
  availableSetups: string[];
  availableEmotions: string[];
  /** Optional: real journal/account IDs for Account filter (replaces mock data) */
  accountIds?: string[];
}

const FIELD_OPTIONS = [
  { value: 'asset', label: 'Asset', type: 'text' },
  { value: 'profitLoss', label: 'P&L', type: 'number' },
  { value: 'entryPrice', label: 'Entry Price', type: 'number' },
  { value: 'exitPrice', label: 'Exit Price', type: 'number' },
  { value: 'positionSize', label: 'Position Size', type: 'number' },
  { value: 'duration', label: 'Duration (min)', type: 'number' },
  { value: 'confidenceLevel', label: 'Confidence Level', type: 'number' },
  { value: 'executionQuality', label: 'Execution Quality', type: 'number' },
  { value: 'setup', label: 'Setup', type: 'select' },
  { value: 'emotion', label: 'Emotion', type: 'select' },
  { value: 'tags', label: 'Tags', type: 'multiselect' },
  { value: 'date', label: 'Date', type: 'date' },
  { value: 'accountId', label: 'Account', type: 'select' }
];

const OPERATOR_OPTIONS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
    { value: 'lessThanOrEqual', label: 'Less than or equal' }
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'in', label: 'In' },
    { value: 'notIn', label: 'Not in' }
  ],
  multiselect: [
    { value: 'contains', label: 'Contains any' },
    { value: 'containsAll', label: 'Contains all' },
    { value: 'notContains', label: 'Does not contain' }
  ],
  date: [
    { value: 'equals', label: 'On date' },
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
    { value: 'between', label: 'Between' },
    { value: 'lastDays', label: 'Last N days' },
    { value: 'thisWeek', label: 'This week' },
    { value: 'thisMonth', label: 'This month' }
  ]
};

export function AdvancedFiltering({
  accountIds = [],
  trades, 
  onFilterChange, 
  availableFields,
  availableTags,
  availableSetups,
  availableEmotions
}: AdvancedFilteringProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterDescription, setNewFilterDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [quickFilters, setQuickFilters] = useState({
    profitable: false,
    losing: false,
    highConfidence: false,
    recent: false,
    tagged: false
  });

  // Apply filters to trades
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    // Apply quick filters
    if (quickFilters.profitable) {
      filtered = filtered.filter(trade => trade.profitLoss > 0);
    }
    if (quickFilters.losing) {
      filtered = filtered.filter(trade => trade.profitLoss < 0);
    }
    if (quickFilters.highConfidence) {
      filtered = filtered.filter(trade => trade.confidenceLevel >= 8);
    }
    if (quickFilters.recent) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(trade => new Date(trade.date) >= weekAgo);
    }
    if (quickFilters.tagged) {
      filtered = filtered.filter(trade => trade.tags && trade.tags.length > 0);
    }

    // Apply advanced conditions
    conditions.forEach(condition => {
      filtered = filtered.filter(trade => {
        const fieldValue = getFieldValue(trade, condition.field);
        return evaluateCondition(fieldValue, condition.operator, condition.value);
      });
    });

    return filtered;
  }, [trades, conditions, quickFilters]);

  // Update parent component when filters change
  React.useEffect(() => {
    onFilterChange(filteredTrades);
  }, [filteredTrades, onFilterChange]);

  const getFieldValue = (trade: any, field: string) => {
    switch (field) {
      case 'date':
        return new Date(trade.date);
      case 'tags':
        return trade.tags || [];
      default:
        return trade[field];
    }
  };

  const evaluateCondition = (fieldValue: any, operator: string, conditionValue: any): boolean => {
    switch (operator) {
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'equals':
        return fieldValue === conditionValue;
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case 'greaterThan':
        return Number(fieldValue) > Number(conditionValue);
      case 'lessThan':
        return Number(fieldValue) < Number(conditionValue);
      case 'greaterThanOrEqual':
        return Number(fieldValue) >= Number(conditionValue);
      case 'lessThanOrEqual':
        return Number(fieldValue) <= Number(conditionValue);
      case 'between':
        return Number(fieldValue) >= Number(conditionValue.min) && 
               Number(fieldValue) <= Number(conditionValue.max);
      case 'notEquals':
        return fieldValue !== conditionValue;
      case 'in':
        return Array.isArray(conditionValue) ? conditionValue.includes(fieldValue) : false;
      case 'notIn':
        return Array.isArray(conditionValue) ? !conditionValue.includes(fieldValue) : true;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.some((tag: string) => 
          conditionValue.includes(tag)
        );
      case 'containsAll':
        return Array.isArray(fieldValue) && conditionValue.every((tag: string) => 
          fieldValue.includes(tag)
        );
      case 'notContains':
        return Array.isArray(fieldValue) && !fieldValue.some((tag: string) => 
          conditionValue.includes(tag)
        );
      case 'after':
        return new Date(fieldValue) > new Date(conditionValue);
      case 'before':
        return new Date(fieldValue) < new Date(conditionValue);
      case 'lastDays':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(conditionValue));
        return new Date(fieldValue) >= daysAgo;
      case 'thisWeek':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return new Date(fieldValue) >= weekStart;
      case 'thisMonth':
        const monthStart = new Date();
        monthStart.setDate(1);
        return new Date(fieldValue) >= monthStart;
      default:
        return true;
    }
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: 'asset',
      operator: 'contains',
      value: '',
      label: 'New Condition'
    };
    setConditions(prev => [...prev, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(prev => prev.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(condition => condition.id !== id));
  };

  const clearAllFilters = () => {
    setConditions([]);
    setQuickFilters({
      profitable: false,
      losing: false,
      highConfidence: false,
      recent: false,
      tagged: false
    });
  };

  const saveFilter = () => {
    if (!newFilterName.trim()) return;

    const savedFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName,
      description: newFilterDescription,
      conditions: [...conditions],
      isPublic: isPublic,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setSavedFilters(prev => [...prev, savedFilter]);
    setNewFilterName('');
    setNewFilterDescription('');
    setIsPublic(false);
    setShowSaveDialog(false);
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setConditions(filter.conditions);
    setSavedFilters(prev => prev.map(f => 
      f.id === filter.id ? { ...f, usageCount: f.usageCount + 1 } : f
    ));
  };

  const deleteSavedFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const getFieldType = (field: string) => {
    const fieldOption = FIELD_OPTIONS.find(f => f.value === field);
    return fieldOption?.type || 'text';
  };

  const getOperatorOptions = (field: string) => {
    const fieldType = getFieldType(field);
    return OPERATOR_OPTIONS[fieldType as keyof typeof OPERATOR_OPTIONS] || OPERATOR_OPTIONS.text;
  };

  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'setup':
        return availableSetups;
      case 'emotion':
        return availableEmotions;
      case 'tags':
        return availableTags;
      case 'accountId':
        return accountIds.length > 0 ? accountIds : [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Advanced Filtering</h2>
          <p className="text-muted-foreground">
            Create complex filters to analyze your trading data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={clearAllFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <Card className="tradezella-widget">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">{filteredTrades.length}</span> of{' '}
                <span className="font-medium">{trades.length}</span> trades
              </div>
              {conditions.length > 0 && (
                <Badge variant="secondary">
                  {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {Object.values(quickFilters).some(Boolean) && (
                <Badge variant="outline">Quick filters active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Quick Filters</TabsTrigger>
          <TabsTrigger value="builder">Filter Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-6">
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="text-sm">Quick Filters</CardTitle>
              <CardDescription>Common filter combinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="profitable"
                    checked={quickFilters.profitable}
                    onCheckedChange={(checked) => setQuickFilters(prev => ({ ...prev, profitable: checked as boolean }))}
                  />
                  <Label htmlFor="profitable" className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>Profitable</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="losing"
                    checked={quickFilters.losing}
                    onCheckedChange={(checked) => setQuickFilters(prev => ({ ...prev, losing: checked as boolean }))}
                  />
                  <Label htmlFor="losing" className="flex items-center space-x-1">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span>Losing</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="highConfidence"
                    checked={quickFilters.highConfidence}
                    onCheckedChange={(checked) => setQuickFilters(prev => ({ ...prev, highConfidence: checked as boolean }))}
                  />
                  <Label htmlFor="highConfidence" className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span>High Confidence</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recent"
                    checked={quickFilters.recent}
                    onCheckedChange={(checked) => setQuickFilters(prev => ({ ...prev, recent: checked as boolean }))}
                  />
                  <Label htmlFor="recent" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-purple-500" />
                    <span>Recent</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tagged"
                    checked={quickFilters.tagged}
                    onCheckedChange={(checked) => setQuickFilters(prev => ({ ...prev, tagged: checked as boolean }))}
                  />
                  <Label htmlFor="tagged" className="flex items-center space-x-1">
                    <Tag className="h-3 w-3 text-orange-500" />
                    <span>Tagged</span>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card className="tradezella-widget">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Filter Conditions</CardTitle>
                  <CardDescription>Build custom filters with multiple conditions</CardDescription>
                </div>
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4" />
                  <p>No filter conditions yet</p>
                  <p className="text-sm">Add conditions to filter your trades</p>
                </div>
              ) : (
                conditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateCondition(condition.id, { field: value, operator: 'contains' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorOptions(condition.field).map(operator => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="md:col-span-2">
                        {getFieldType(condition.field) === 'select' || getFieldType(condition.field) === 'multiselect' ? (
                          <Select
                            value={Array.isArray(condition.value) ? condition.value[0] : condition.value}
                            onValueChange={(value) => updateCondition(condition.id, { value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getFieldOptions(condition.field).map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : getFieldType(condition.field) === 'number' && condition.operator === 'between' ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={condition.value?.min || ''}
                              onChange={(e) => updateCondition(condition.id, { 
                                value: { ...condition.value, min: e.target.value }
                              })}
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={condition.value?.max || ''}
                              onChange={(e) => updateCondition(condition.id, { 
                                value: { ...condition.value, max: e.target.value }
                              })}
                            />
                          </div>
                        ) : (
                          <Input
                            type={getFieldType(condition.field) === 'number' ? 'number' : 'text'}
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="Enter value..."
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="text-sm">Saved Filters</CardTitle>
              <CardDescription>Reuse your favorite filter combinations</CardDescription>
            </CardHeader>
            <CardContent>
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-4" />
                  <p>No saved filters yet</p>
                  <p className="text-sm">Save your filter combinations for quick access</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{filter.name}</h4>
                          {filter.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{filter.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span>{filter.conditions.length} conditions</span>
                          <span>Used {filter.usageCount} times</span>
                          <span>{new Date(filter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedFilter(filter)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedFilter(filter.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter conditions for future use
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="Enter filter name..."
              />
            </div>
            
            <div>
              <Label htmlFor="filter-description">Description</Label>
              <Input
                id="filter-description"
                value={newFilterDescription}
                onChange={(e) => setNewFilterDescription(e.target.value)}
                placeholder="Describe this filter..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="is-public">Make this filter public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveFilter} disabled={!newFilterName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
