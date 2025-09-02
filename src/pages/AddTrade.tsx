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
    { value: "Confident", label: "Confident", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { value: "Calm", label: "Calm", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "Excited", label: "Excited", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { value: "Nervous", label: "Nervous", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "Fearful", label: "Fearful", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    { value: "Greedy", label: "Greedy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    { value: "Frustrated", label: "Frustrated", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
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
              "p-3 rounded-xl border-2 transition-smooth text-sm font-medium",
              selectedEmotion === emotion.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full mx-auto mb-2", emotion.color)} />
            {emotion.label}
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
    { value: "Long", label: "Long", icon: TrendingUp, color: "text-green-600" },
    { value: "Short", label: "Short", icon: TrendingDown, color: "text-red-600" },
    { value: "Scalp", label: "Scalp", icon: Clock, color: "text-blue-600" },
    { value: "Swing", label: "Swing", icon: Calendar, color: "text-purple-600" },
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
  const [allChecklists, setAllChecklists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<Array<{ id: string; text: string }>>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [useAutoDuration, setUseAutoDuration] = useState(true);
  
  // Check if we're editing an existing trade
  const editTrade = location.state?.editTrade;
  const isEditing = !!editTrade;
  const [formData, setFormData] = useState({
    asset: "",
    tradeType: "",
    entryPrice: "",
    exitPrice: "",
    positionSize: "",
    entryTime: "",
    exitTime: "",
    emotion: "",
    notes: "",
    setup: "",
    executionQuality: "",
    duration: "",
    profitLoss: "",
    checklistId: "none",
  });

  // Load all checklists for selection
  useEffect(() => {
    (async () => {
      const cls = await fetchChecklists();
      setAllChecklists(cls.map(c => ({ id: String(c.id), name: c.name })));
    })();
  }, [fetchChecklists]);

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && editTrade) {
      setFormData(prev => ({
        ...prev,
        asset: editTrade.asset || editTrade.symbol || "",
        tradeType: editTrade.tradeType || editTrade.type || "",
        entryPrice: editTrade.entryPrice?.toString() || editTrade.entry_price?.toString() || "",
        exitPrice: editTrade.exitPrice?.toString() || editTrade.exit_price?.toString() || "",
        positionSize: editTrade.positionSize?.toString() || editTrade.quantity?.toString() || "",
        entryTime: editTrade.date ? new Date(editTrade.date).toISOString().slice(0, 16) : 
                  editTrade.entry_time ? new Date(editTrade.entry_time).toISOString().slice(0, 16) : "",
        exitTime: editTrade.exitTime ? new Date(editTrade.exitTime).toISOString().slice(0, 16) : 
                 editTrade.exit_time ? new Date(editTrade.exit_time).toISOString().slice(0, 16) : "",
        emotion: editTrade.emotion || "",
        notes: editTrade.notes || "",
        setup: editTrade.setup || editTrade.setup_type || "",
        executionQuality: editTrade.executionQuality || editTrade.execution_quality || "",
        duration: editTrade.duration || "",
        profitLoss: (editTrade.profitLoss ?? editTrade.pnl ?? "").toString(),
        checklistId: editTrade.checklist_id ? String(editTrade.checklist_id) : "none",
      }));
    }
  }, [isEditing, editTrade]);

  // When checklist changes, load its items
  useEffect(() => {
    (async () => {
      if (!formData.checklistId || formData.checklistId === "none") {
        setSelectedChecklistItems([]);
        setCheckedItems({});
        return;
      }
      const checklist = await getChecklist(formData.checklistId);
      const items = Array.isArray(checklist?.items) ? checklist!.items : [];
      setSelectedChecklistItems(items.map(i => ({ id: String(i.id), text: i.text })));
      const initialChecks: Record<string, boolean> = {};
      items.forEach(i => { initialChecks[String(i.id)] = false; });
      setCheckedItems(initialChecks);
    })();
  }, [formData.checklistId, getChecklist]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (value: string) => {
    handleInputChange('checklistId', value);
  };

  const toggleItemChecked = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const manualPnL = parseFloat(formData.profitLoss);
      const isValidPnL = !Number.isNaN(manualPnL);

      // duration calculation
      let durationToSend: number | undefined = undefined;
      if (useAutoDuration && formData.entryTime && formData.exitTime) {
        const start = new Date(formData.entryTime).getTime();
        const end = new Date(formData.exitTime).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
          durationToSend = Math.floor((end - start) / 60000);
        }
      } else if (!useAutoDuration && formData.duration) {
        const manualMinutes = parseInt(formData.duration, 10);
        if (!Number.isNaN(manualMinutes)) {
          durationToSend = manualMinutes;
        }
      }

      const tradeData = {
        symbol: formData.asset,
        tradeType: formData.tradeType, // Preserve Long/Short
        type: '',
        direction: '',
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
        pnl: isValidPnL ? manualPnL : 0,
        duration: durationToSend,
        checklistId: formData.checklistId !== 'none' ? parseInt(formData.checklistId, 10) : null,
        checklistItems: formData.checklistId !== 'none'
          ? selectedChecklistItems.map(i => ({ id: i.id, text: i.text, completed: !!checkedItems[i.id] }))
          : null,
      } as any;

      if (isEditing) {
        await tradeApi.updateTrade(editTrade.id, tradeData);
        toast({ title: "✏️ Trade Updated Successfully!", description: `Your ${formData.asset} trade has been updated.`, className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg" });
      } else {
        await tradeApi.addTrade(tradeData);
        toast({ title: "🎉 Trade Added Successfully!", description: `Your ${formData.asset} trade has been added to your portfolio.`, className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg" });
      }
      
      navigate('/trades');
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} trade:`, error);
      toast({ title: `❌ Error ${isEditing ? 'Updating' : 'Adding'} Trade`, description: error.message || "Something went wrong. Please try again.", variant: "destructive", className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg" });
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            </div>

            {/* Manual P&L */}
            <div className="space-y-2">
              <Label htmlFor="profitLoss">Profit / Loss</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="profitLoss"
                  type="number"
                  step="0.01"
                  placeholder="Enter P&L manually (e.g., 150 or -75)"
                  value={formData.profitLoss}
                  onChange={(e) => handleInputChange('profitLoss', e.target.value)}
                  className="input-modern pl-10"
                />
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
                  className="input-modern"
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
                  className="input-modern"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Duration Mode</Label>
                <div className="flex gap-3">
                  <Button type="button" variant={useAutoDuration ? 'default' : 'outline'} onClick={() => setUseAutoDuration(true)} className="btn-apple">
                    Auto (from entry/exit)
                  </Button>
                  <Button type="button" variant={!useAutoDuration ? 'default' : 'outline'} onClick={() => setUseAutoDuration(false)} className="btn-apple-secondary">
                    Manual (minutes)
                  </Button>
                </div>
              </div>
              {!useAutoDuration && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" min={0} placeholder="e.g., 45" value={formData.duration} onChange={(e) => handleInputChange('duration', e.target.value)} className="input-modern" />
                </div>
              )}
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

        {/* Checklist Selection */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Checklist
            </CardTitle>
            <CardDescription>
              Select a checklist and mark completed items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Checklist</Label>
              <Select value={formData.checklistId} onValueChange={handleChecklistChange}>
                <SelectTrigger className="input-modern">
                  <SelectValue placeholder="No Checklist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Checklist</SelectItem>
                  {allChecklists.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChecklistItems.length > 0 && (
              <div className="space-y-2">
                <Label>Checklist Items</Label>
                <div className="space-y-2">
                  {selectedChecklistItems.map((item, idx) => (
                    <label key={item.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!checkedItems[item.id]}
                        onChange={() => toggleItemChecked(item.id)}
                      />
                      <span className="text-sm">{idx + 1}. {item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
