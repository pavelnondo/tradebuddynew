import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Heart,
  FileText,
  Upload
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { tradeApi } from "@/services/tradeApi";
import { API_BASE_URL } from "@/config";
import { cn } from "@/lib/utils";
import { useChecklists } from "@/hooks/useChecklists";

// Emotion selector component
const EmotionSelector = ({ 
  selectedEmotion, 
  onEmotionSelect 
}: {
  selectedEmotion: string;
  onEmotionSelect: (emotion: string) => void;
}) => {
  const emotions = [
    { value: "Confident", label: "Confident", dotColor: "bg-green-500", bgColor: "bg-green-100 dark:bg-green-900/20" },
    { value: "Calm", label: "Calm", dotColor: "bg-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    { value: "Excited", label: "Excited", dotColor: "bg-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
    { value: "Nervous", label: "Nervous", dotColor: "bg-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
    { value: "Fearful", label: "Fearful", dotColor: "bg-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
    { value: "Greedy", label: "Greedy", dotColor: "bg-red-500", bgColor: "bg-red-100 dark:bg-red-900/20" },
    { value: "Frustrated", label: "Frustrated", dotColor: "bg-gray-500", bgColor: "bg-gray-100 dark:bg-gray-900/20" },
  ];

  return (
    <div className="space-y-3">
      <Label>How did you feel during this trade?</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {emotions.map((emotion) => (
          <button
            key={emotion.value}
            type="button"
            onClick={() => onEmotionSelect(emotion.value)}
            className={cn(
              "p-3 rounded-xl border-2 transition-smooth text-sm font-medium relative overflow-hidden",
              selectedEmotion === emotion.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn("absolute inset-0 opacity-10", emotion.bgColor)} />
            <div className="relative z-10">
              <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", emotion.dotColor)} />
              {emotion.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Trade type selector component
const TradeTypeSelector = ({ 
  selectedType, 
  onTypeSelect 
}: {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}) => {
  const types = [
    { value: "Long", label: "Long", icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
    { value: "Short", label: "Short", icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
    { value: "Scalp", label: "Scalp", icon: Clock, color: "text-blue-600 dark:text-blue-400" },
    { value: "Swing", label: "Swing", icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-3">
      <Label>Trade Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onTypeSelect(type.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-smooth text-center",
                selectedType === type.value
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
  );
};

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { fetchChecklists, getChecklist } = useChecklists();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  
  // Check if we're editing an existing trade
  const editTrade = location.state?.editTrade;
  const isEditing = !!editTrade;
  const [formData, setFormData] = useState({
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
    executionQuality: "",
    duration: "",
    checklistId: "",
  });

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && editTrade) {
      console.log('Editing trade:', editTrade);
      setFormData({
        asset: editTrade.asset || editTrade.symbol || "",
        tradeType: editTrade.tradeType || editTrade.type || "",
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
        executionQuality: editTrade.executionQuality || editTrade.execution_quality || "",
        duration: editTrade.duration || "",
        checklistId: editTrade.checklist_id?.toString() || "",
      });
    }
  }, [isEditing, editTrade]);

  // Fetch checklists on mount
  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const checklistsData = await fetchChecklists();
        setChecklists(checklistsData);
      } catch (error) {
        console.error('Failed to fetch checklists:', error);
      }
    };
    loadChecklists();
  }, [fetchChecklists]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'profitLoss') {
      console.log('💰 P&L field changed:', value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle checklist selection and load items
  const handleChecklistChange = async (checklistId: string) => {
    console.log('📋 Checklist selected:', checklistId);
    handleInputChange('checklistId', checklistId);
    
    if (checklistId && checklistId !== "none") {
      try {
        console.log('🔄 Fetching checklist data...');
        const checklist = await getChecklist(checklistId);
        console.log('📋 Received checklist:', checklist);
        
        if (checklist && checklist.items) {
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
          console.warn('⚠️ No items found in checklist');
        }
      } catch (error) {
        console.error('❌ Failed to load checklist items:', error);
      }
    } else {
      console.log('🔄 Clearing checklist items');
      setSelectedChecklistItems([]);
      setCheckedItems({});
    }
  };

  // Handle checking/unchecking individual items
  const handleItemCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔍 Form submission started');
    console.log('📊 Raw P&L value from form:', formData.profitLoss);
    console.log('🔢 Parsed P&L value:', parseFloat(formData.profitLoss));

    try {
      const tradeData = {
        symbol: formData.asset,
        tradeType: formData.tradeType, // Keep original trade type (Long/Short/Scalp/Swing)
        type: formData.tradeType.toLowerCase() === 'long' ? 'buy' : 
              formData.tradeType.toLowerCase() === 'short' ? 'sell' : 
              formData.tradeType.toLowerCase(),
        direction: formData.tradeType.toLowerCase() === 'long' ? 'long' : 
                  formData.tradeType.toLowerCase() === 'short' ? 'short' : 
                  formData.tradeType.toLowerCase(),
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        quantity: parseFloat(formData.positionSize),
        positionSize: parseFloat(formData.positionSize),
        entryTime: formData.entryTime,
        exitTime: formData.exitTime,
        emotion: formData.emotion,
        notes: formData.notes,
        setupType: formData.setup,
        executionQuality: formData.executionQuality,
        confidenceLevel: 5,
        marketCondition: 'normal',
        tags: [],
        pnl: parseFloat(formData.profitLoss),
        duration: formData.duration,
        checklistId: (formData.checklistId && formData.checklistId !== "none") ? parseInt(formData.checklistId) : null,
        checklistItems: selectedChecklistItems.length > 0 ? selectedChecklistItems.map(item => ({
          ...item,
          completed: checkedItems[item.id] || false
        })) : null
      };

      console.log('📤 Trade data being sent:', tradeData);

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
          description: `Your ${formData.asset} trade has been added to your portfolio.`,
          className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg",
        });
      }
      
      navigate('/trades');
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} trade:`, error);
      toast({
        title: `❌ Error ${isEditing ? 'Updating' : 'Adding'} Trade`,
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Edit Trade' : 'Add New Trade'}</h1>
            <p className="text-muted-foreground">{isEditing ? 'Update your trading record' : 'Record your latest trading activity'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Trade Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the essential details of your trade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset/Symbol</Label>
                <Input
                  id="asset"
                  placeholder="e.g., AAPL, TSLA, BTC"
                  value={formData.asset}
                  onChange={(e) => handleInputChange('asset', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <TradeTypeSelector
                  selectedType={formData.tradeType}
                  onTypeSelect={(type) => handleInputChange('tradeType', type)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionSize">Position Size</Label>
                <Input
                  id="positionSize"
                  type="number"
                  placeholder="100"
                  value={formData.positionSize}
                  onChange={(e) => handleInputChange('positionSize', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitLoss">Profit/Loss</Label>
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
              </div>
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
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                                         <SelectItem value="Scalp">Scalp (&lt; 5 min)</SelectItem>
                    <SelectItem value="Day">Day Trade</SelectItem>
                    <SelectItem value="Swing">Swing (1-7 days)</SelectItem>
                                         <SelectItem value="Position">Position (&gt; 7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionQuality">Execution Quality</Label>
                <Select value={formData.executionQuality} onValueChange={(value) => handleInputChange('executionQuality', value)}>
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Rate your execution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
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
            <EmotionSelector
              selectedEmotion={formData.emotion}
              onEmotionSelect={(emotion) => handleInputChange('emotion', emotion)}
            />

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
                    Check off each item you've completed before executing this trade:
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
                Save Trade
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
