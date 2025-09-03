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
    { value: "Confident", label: "Confident", color: "bg-green-500" },
    { value: "Calm", label: "Calm", color: "bg-blue-500" },
    { value: "Excited", label: "Excited", color: "bg-yellow-500" },
    { value: "Nervous", label: "Nervous", color: "bg-orange-500" },
    { value: "Fearful", label: "Fearful", color: "bg-purple-500" },
    { value: "Greedy", label: "Greedy", color: "bg-red-500" },
    { value: "Frustrated", label: "Frustrated", color: "bg-gray-500" },
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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  
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
    const hydrateFromFullTrade = async (tradeId: string | number) => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const t = await res.json();
        console.log('✏️ Full trade data from API:', t);
        console.log('✏️ Entry Time from API:', t.entry_time);
        console.log('✏️ Exit Time from API:', t.exit_time);
        console.log('✏️ Duration from API:', t.duration);
        
        // Extract times from database preserving the user's original input
        const extractTimeFromDB = (dbTime: string) => {
          if (!dbTime) return "";
          
          try {
            // Handle different time formats from database
            let dateToProcess = dbTime;
            
            // If it's already in the correct format, just return it
            if (dbTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
              console.log('✏️ Time already in correct format:', dbTime);
              return dbTime;
            }
            
            // Parse the date (handles both UTC and local formats)
            const utcDate = new Date(dateToProcess);
            if (isNaN(utcDate.getTime())) {
              console.error('Invalid date:', dbTime);
              // Try direct string manipulation as fallback
              if (dbTime.includes('T')) {
                const fallback = dbTime.slice(0, 16);
                console.log('✏️ Using fallback format:', fallback);
                return fallback;
              }
              return "";
            }
            
            // Convert to local time for datetime-local input
            const localYear = utcDate.getFullYear();
            const localMonth = String(utcDate.getMonth() + 1).padStart(2, '0');
            const localDay = String(utcDate.getDate()).padStart(2, '0');
            const localHours = String(utcDate.getHours()).padStart(2, '0');
            const localMinutes = String(utcDate.getMinutes()).padStart(2, '0');
            
            const result = `${localYear}-${localMonth}-${localDay}T${localHours}:${localMinutes}`;
            console.log('✏️ Time conversion:', dbTime, '->', result);
            return result;
          } catch (error) {
            console.error('Error parsing time:', dbTime, error);
            // Try direct string manipulation as final fallback
            if (dbTime.includes('T')) {
              const fallback = dbTime.slice(0, 16);
              console.log('✏️ Using error fallback format:', fallback);
              return fallback;
            }
            return "";
          }
        };
        
        // Never pass full ISO with seconds/ms into datetime-local; keep only YYYY-MM-DDTHH:MM
        const entryIso = extractTimeFromDB(String(t.entry_time || ''));
        const exitIso = extractTimeFromDB(String(t.exit_time || ''));
        console.log('✏️ Raw Entry Time from DB:', t.entry_time);
        console.log('✏️ Raw Exit Time from DB:', t.exit_time);
        console.log('✏️ Extracted Entry Time:', entryIso);
        console.log('✏️ Extracted Exit Time:', exitIso);
        
        setFormData(prev => ({
          ...prev,
          asset: t.symbol || prev.asset,
          tradeType: t.trade_type || t.type || prev.tradeType,
          entryPrice: t.entry_price != null ? String(t.entry_price) : prev.entryPrice,
          exitPrice: t.exit_price != null ? String(t.exit_price) : prev.exitPrice,
          positionSize: t.quantity != null ? String(t.quantity) : prev.positionSize,
          entryTime: entryIso,
          exitTime: exitIso,
          emotion: t.emotion || prev.emotion,
          notes: t.notes || prev.notes,
          setup: t.setup_type || prev.setup,
          executionQuality: t.execution_quality || prev.executionQuality,
          duration: t.duration != null ? String(t.duration) : prev.duration,
          profitLoss: t.pnl != null ? String(t.pnl) : prev.profitLoss,
          checklistId: t.checklist_id ? String(t.checklist_id) : prev.checklistId,
        }));
        
        // Checklist items + checked states - preserve existing if already set
        if (t.checklist_items && Array.isArray(t.checklist_items)) {
          const items = t.checklist_items.map((i: any) => ({ id: String(i.id), text: i.text }));
          setSelectedChecklistItems(items);
          const initialChecks: Record<string, boolean> = {};
          t.checklist_items.forEach((i: any) => { 
            initialChecks[String(i.id)] = !!i.completed; 
          });
          setCheckedItems(initialChecks);
        }
        
        // Screenshot - preserve existing if already set
        if (t.screenshot_url && !screenshotUrl) {
          setScreenshotUrl(t.screenshot_url);
        }
      } catch (e) {
        console.error('Error hydrating trade:', e);
        // ignore, fall back to existing location.state
      }
    };

    if (isEditing && editTrade) {
              // Always fetch the full trade data to ensure we have everything
        console.log('🔍 AddTrade - Edit Trade Data:', editTrade);
        hydrateFromFullTrade(editTrade.id);
      
      // Also set initial data from editTrade for immediate display
      setFormData(prev => ({
        ...prev,
        asset: editTrade.asset || editTrade.symbol || prev.asset,
        tradeType: editTrade.tradeType || editTrade.type || prev.tradeType,
        entryPrice: editTrade.entryPrice?.toString() || editTrade.entry_price?.toString() || prev.entryPrice,
        exitPrice: editTrade.exitPrice?.toString() || editTrade.exit_price?.toString() || prev.exitPrice,
        positionSize: editTrade.positionSize?.toString() || editTrade.quantity?.toString() || prev.positionSize,
        entryTime: editTrade.entryTime || editTrade.entry_time || (editTrade.date ? new Date(editTrade.date).toLocaleString('sv-SE').slice(0, 16) : prev.entryTime),
        exitTime: editTrade.exitTime || editTrade.exit_time || prev.exitTime,
        emotion: editTrade.emotion || prev.emotion,
        notes: editTrade.notes || prev.notes,
        setup: editTrade.setup || editTrade.setup_type || prev.setup,
        executionQuality: editTrade.executionQuality || editTrade.execution_quality || prev.executionQuality,
        duration: editTrade.duration ? String(editTrade.duration) : prev.duration,
        profitLoss: (editTrade.profitLoss ?? editTrade.pnl ?? prev.profitLoss)?.toString?.() || prev.profitLoss,
        checklistId: editTrade.checklist_id ? String(editTrade.checklist_id) : prev.checklistId,
      }));
      
      // Set checklist items from editTrade if available
      if (Array.isArray(editTrade.checklistItems)) {
        setSelectedChecklistItems(editTrade.checklistItems.map((i: any) => ({ id: String(i.id), text: i.text })));
        const initialChecks: Record<string, boolean> = {};
        editTrade.checklistItems.forEach((i: any) => { initialChecks[String(i.id)] = !!i.completed; });
        setCheckedItems(initialChecks);
      }
      
      if (editTrade.screenshot) setScreenshotUrl(editTrade.screenshot);
    }
  }, [isEditing, editTrade, screenshotUrl]);

  // When checklist changes, load its items
  useEffect(() => {
    // Don't override checklist items when editing - they should come from the trade data
    if (isEditing) return;
    
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
  }, [formData.checklistId, getChecklist, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (value: string) => {
    handleInputChange('checklistId', value);
  };

  const toggleItemChecked = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log('📸 Screenshot file selected:', file);
    setScreenshotFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log('📸 Screenshot data URL created:', dataUrl.slice(0, 100) + '...');
        setScreenshotUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('📸 No file selected, clearing screenshot URL');
      setScreenshotUrl("");
    }
  };

  const uploadScreenshotIfNeeded = async (): Promise<string> => {
    if (!screenshotFile) return screenshotUrl;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', screenshotFile);
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } as any : undefined,
      body: formData,
    });
    if (!res.ok) throw new Error('Screenshot upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const manualPnL = parseFloat(formData.profitLoss);
      const isValidPnL = !Number.isNaN(manualPnL);
      const uploadedUrl = await uploadScreenshotIfNeeded();

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

      const baseData: any = {
        symbol: formData.asset,
        tradeType: formData.tradeType || undefined, // Preserve Long/Short if provided
        entryPrice: formData.entryPrice ? parseFloat(formData.entryPrice) : undefined,
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
        quantity: formData.positionSize ? parseFloat(formData.positionSize) : undefined,
        positionSize: formData.positionSize ? parseFloat(formData.positionSize) : undefined,
        entryTime: formData.entryTime || undefined,
        exitTime: formData.exitTime || undefined,
        emotion: formData.emotion || undefined,
        notes: formData.notes || undefined,
        setupType: formData.setup || undefined,
        executionQuality: formData.executionQuality || undefined,
        confidenceLevel: 5,
        marketCondition: 'normal',
        tags: [],
        pnl: isValidPnL ? manualPnL : 0,
        duration: durationToSend,
        checklistId: formData.checklistId !== 'none' ? parseInt(formData.checklistId, 10) : undefined,
        checklistItems: formData.checklistId !== 'none'
          ? selectedChecklistItems.map(i => ({ id: i.id, text: i.text, completed: !!checkedItems[i.id] }))
          : undefined,
      };

      // Only include screenshot if newly uploaded or already present
      if (uploadedUrl) {
        baseData.screenshot = uploadedUrl;
      } else if (screenshotUrl) {
        // keep existing on update by not sending anything; backend leaves as-is
      }

      if (isEditing) {
        await tradeApi.updateTrade(editTrade.id, baseData);
        toast({
          title: "✏️ Trade Updated Successfully!",
          description: `Your ${formData.asset} trade has been updated.`,
          className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg",
        });
      } else {
        await tradeApi.addTrade(baseData);
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

            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot</Label>
              <Input id="screenshot" type="file" accept="image/*" onChange={handleScreenshotChange} />
              {screenshotUrl ? (
                <div className="mt-2">
                  <img src={screenshotUrl} alt="Preview" className="max-h-40 rounded border" />
                  <div className="text-xs text-muted-foreground mt-1">
                    Preview loaded: {screenshotUrl.length > 100 ? 'Data URL' : screenshotUrl}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-muted-foreground">
                  No screenshot selected (screenshotUrl: {JSON.stringify(screenshotUrl)})
                </div>
              )}
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
