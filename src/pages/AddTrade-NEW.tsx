import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tradeApi } from '@/services/tradeApi';
import { useChecklists } from '@/hooks/useChecklists';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  DollarSign,
  Save,
  Heart,
} from 'lucide-react';

interface TradeFormData {
  asset: string;
  tradeType: string;
  entryPrice: string;
  exitPrice: string;
  positionSize: string;
  profitLoss: string;
  entryTime: string;
  exitTime: string;
  emotion: string;
  notes: string;
  setup: string;
  duration: string;
  checklistId: string;
}

const emotions = [
  { value: 'confident', label: 'Confident', emoji: '😎', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950/30' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { value: 'fearful', label: 'Fearful', emoji: '😨', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
];

const tradeTypes = [
  { value: "Long", label: "Long", icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
  { value: "Short", label: "Short", icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
  { value: "Scalp", label: "Scalp", icon: Clock, color: "text-blue-600 dark:text-blue-400" },
  { value: "Swing", label: "Swing", icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
];

export default function AddTradeNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { fetchChecklists, getChecklist } = useChecklists();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  
  // Check if we're editing an existing trade
  const editTrade = location.state?.editTrade;
  const isEditing = !!editTrade;

  const [formData, setFormData] = useState<TradeFormData>({
    asset: "",
    tradeType: "",
    entryPrice: "",
    exitPrice: "",
    positionSize: "",
    profitLoss: "",
    entryTime: "",
    exitTime: "",
    emotion: "",
    notes: "",
    setup: "",
    duration: "",
    checklistId: "",
  });

  // Load checklists on mount
  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const checklistsData = await fetchChecklists();
        setChecklists(checklistsData);
        console.log('📋 Loaded checklists:', checklistsData);
      } catch (error) {
        console.error('Failed to fetch checklists:', error);
      }
    };
    loadChecklists();
  }, [fetchChecklists]);

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && editTrade) {
      console.log('✏️ Editing trade:', editTrade);
      setFormData({
        asset: editTrade.asset || editTrade.symbol || "",
        tradeType: editTrade.tradeType || editTrade.trade_type || "",
        entryPrice: editTrade.entryPrice?.toString() || editTrade.entry_price?.toString() || "",
        exitPrice: editTrade.exitPrice?.toString() || editTrade.exit_price?.toString() || "",
        positionSize: editTrade.positionSize?.toString() || editTrade.quantity?.toString() || "",
        profitLoss: editTrade.profitLoss?.toString() || editTrade.pnl?.toString() || "",
        entryTime: editTrade.date ? new Date(editTrade.date).toISOString().slice(0, 16) : 
                  editTrade.entry_time ? new Date(editTrade.entry_time).toISOString().slice(0, 16) : "",
        exitTime: editTrade.exitTime ? new Date(editTrade.exitTime).toISOString().slice(0, 16) : 
                 editTrade.exit_time ? new Date(editTrade.exit_time).toISOString().slice(0, 16) : "",
        emotion: editTrade.emotion || "",
        notes: editTrade.notes || "",
        setup: editTrade.setup || editTrade.setup_type || "",
        duration: editTrade.duration || "",
        checklistId: editTrade.checklist_id?.toString() || "",
      });
    }
  }, [isEditing, editTrade]);

  // Handle input changes
  const handleInputChange = (field: keyof TradeFormData, value: string) => {
    console.log(`🔄 Field ${field} changed to:`, value);
    if (field === 'profitLoss') {
      console.log('💰 P&L field updated to:', value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle checklist selection
  const handleChecklistChange = async (checklistId: string) => {
    console.log('📋 Checklist selected:', checklistId);
    handleInputChange('checklistId', checklistId);
    
    if (checklistId && checklistId !== "none") {
      try {
        console.log('🔄 Fetching checklist data...');
        const checklist = await getChecklist(checklistId);
        console.log('📋 Received checklist:', checklist);
        
        if (checklist && checklist.items && Array.isArray(checklist.items)) {
          console.log('✅ Setting checklist items:', checklist.items);
          setSelectedChecklistItems(checklist.items);
          
          // Initialize all items as unchecked
          const initialChecked: {[key: string]: boolean} = {};
          checklist.items.forEach((item: any) => {
            initialChecked[item.id] = false;
          });
          setCheckedItems(initialChecked);
          console.log('📝 Initialized checked items:', initialChecked);
        } else {
          console.warn('⚠️ No valid items found in checklist');
          setSelectedChecklistItems([]);
          setCheckedItems({});
        }
      } catch (error) {
        console.error('❌ Failed to load checklist items:', error);
        setSelectedChecklistItems([]);
        setCheckedItems({});
      }
    } else {
      console.log('🔄 Clearing checklist items');
      setSelectedChecklistItems([]);
      setCheckedItems({});
    }
  };

  // Handle checklist item checking
  const handleItemCheck = (itemId: string, checked: boolean) => {
    console.log(`✅ Checklist item ${itemId} set to:`, checked);
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🚀 Form submission started');
    console.log('📊 Form data:', formData);
    console.log('💰 Raw P&L value:', formData.profitLoss);
    
    // Parse P&L value carefully
    const pnlValue = parseFloat(formData.profitLoss);
    console.log('🔢 Parsed P&L value:', pnlValue);
    console.log('🔢 Is valid number:', !isNaN(pnlValue));

    try {
      // Prepare trade data with explicit P&L handling
      const tradeData = {
        symbol: formData.asset,
        tradeType: formData.tradeType,
        type: formData.tradeType.toLowerCase() === 'long' ? 'buy' : 
              formData.tradeType.toLowerCase() === 'short' ? 'sell' : 
              formData.tradeType.toLowerCase(),
        direction: formData.tradeType.toLowerCase() === 'long' ? 'long' : 
                  formData.tradeType.toLowerCase() === 'short' ? 'short' : 
                  formData.tradeType.toLowerCase(),
        entryPrice: parseFloat(formData.entryPrice) || 0,
        exitPrice: parseFloat(formData.exitPrice) || 0,
        quantity: parseFloat(formData.positionSize) || 0,
        positionSize: parseFloat(formData.positionSize) || 0,
        entryTime: formData.entryTime,
        exitTime: formData.exitTime,
        emotion: formData.emotion,
        notes: formData.notes,
        setupType: formData.setup,
        executionQuality: formData.executionQuality || 5,
        confidenceLevel: 5,
        marketCondition: 'normal',
        tags: [],
        pnl: pnlValue,  // Use the carefully parsed value
        duration: formData.duration,
        checklistId: (formData.checklistId && formData.checklistId !== "none") ? parseInt(formData.checklistId) : null,
        checklistItems: selectedChecklistItems.length > 0 ? selectedChecklistItems.map(item => ({
          ...item,
          completed: checkedItems[item.id] || false
        })) : null
      };

      console.log('📤 Final trade data being sent:', tradeData);

      if (isEditing) {
        await tradeApi.updateTrade(editTrade.id, tradeData);
        toast({
          title: "✏️ Trade Updated Successfully!",
          description: `Your ${formData.asset} trade has been updated.`,
          className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg",
        });
      } else {
        await tradeApi.addTrade(tradeData);
        toast({
          title: "🎉 Trade Added Successfully!",
          description: `Your ${formData.asset} trade has been added.`,
          className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg",
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Trade submission error:', error);
      toast({
        title: "❌ Error",
        description: error.message || 'Failed to save trade',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isEditing ? '✏️ Edit Trade' : '📈 Add New Trade'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update your trade details' : 'Record your trading activity and track your performance'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Trade Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trade Details
            </CardTitle>
            <CardDescription>
              Enter the basic information about your trade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset/Symbol *</Label>
                <Input
                  id="asset"
                  placeholder="e.g., AAPL, NQ, ES"
                  value={formData.asset}
                  onChange={(e) => handleInputChange('asset', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Trade Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tradeTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('tradeType', type.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-smooth text-center",
                          formData.tradeType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className={cn("w-6 h-6 mx-auto mb-2", type.color)} />
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-gray-400" />
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitPrice">Exit Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-gray-400" />
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.exitPrice}
                    onChange={(e) => handleInputChange('exitPrice', e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionSize">Position Size</Label>
                <Input
                  id="positionSize"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.positionSize}
                  onChange={(e) => handleInputChange('positionSize', e.target.value)}
                  className="input-modern"
                />
              </div>
            </div>

            {/* CRITICAL: Manual P&L Input */}
            <div className="space-y-2">
              <Label htmlFor="profitLoss">Profit/Loss *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-gray-400" />
                <Input
                  id="profitLoss"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.profitLoss}
                  onChange={(e) => handleInputChange('profitLoss', e.target.value)}
                  className="input-modern pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter positive values for profit, negative for loss (e.g., 100 for $100 profit, -50 for $50 loss)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timing Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timing
            </CardTitle>
            <CardDescription>
              When did you enter and exit the trade?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryTime">Entry Time</Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  value={formData.entryTime}
                  onChange={(e) => handleInputChange('entryTime', e.target.value)}
                  className="input-modern [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitTime">Exit Time</Label>
                <Input
                  id="exitTime"
                  type="datetime-local"
                  value={formData.exitTime}
                  onChange={(e) => handleInputChange('exitTime', e.target.value)}
                  className="input-modern [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Psychology & Analysis */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Psychology & Analysis
            </CardTitle>
            <CardDescription>
              Track your emotions and trading psychology
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emotion Selector */}
            <div className="space-y-3">
              <Label>How did you feel during this trade?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.value}
                    type="button"
                    onClick={() => handleInputChange('emotion', emotion.value)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-smooth text-sm font-medium",
                      formData.emotion === emotion.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{emotion.emoji}</span>
                      <span>{emotion.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup">Setup/Strategy</Label>
              <Input
                id="setup"
                placeholder="e.g., Breakout, Pullback, Support/Resistance"
                value={formData.setup}
                onChange={(e) => handleInputChange('setup', e.target.value)}
                className="input-modern"
              />
            </div>

            {/* Checklist Selection */}
            <div className="space-y-2">
              <Label htmlFor="checklistId">Trading Checklist (Optional)</Label>
              <Select value={formData.checklistId} onValueChange={handleChecklistChange}>
                <SelectTrigger className="input-modern">
                  <SelectValue placeholder="Select a checklist..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Checklist</SelectItem>
                  {checklists.map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id.toString()}>
                      {checklist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checklist Items */}
            {selectedChecklistItems.length > 0 && (
              <div className="space-y-3">
                <Label>Pre-Trade Checklist</Label>
                <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Check off each item you completed before executing this trade:
                  </p>
                  <div className="space-y-2">
                    {selectedChecklistItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={checkedItems[item.id] || false}
                          onChange={(e) => handleItemCheck(item.id, e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <label 
                          htmlFor={`item-${item.id}`} 
                          className={cn(
                            "text-sm cursor-pointer transition-colors",
                            checkedItems[item.id] 
                              ? "text-muted-foreground line-through" 
                              : "text-foreground hover:text-primary"
                          )}
                        >
                          {item.text}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Completed: {Object.values(checkedItems).filter(Boolean).length} / {selectedChecklistItems.length}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Observations</Label>
              <Textarea
                id="notes"
                placeholder="What went well? What could you improve? Market conditions, etc."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-modern min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="btn-apple-secondary"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="btn-apple"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Trade' : 'Save Trade'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}



