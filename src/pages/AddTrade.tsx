import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, UploadCloud, RefreshCw, CheckSquare, Settings, ChevronDown, ChevronUp, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

import { Trade, TradeType, EmotionType, Checklist, ChecklistItem } from '@/types';
import { useChecklists } from '@/hooks/useChecklists';
import { DateTimeInput } from '@/components/DateTimeInput';
import { FeatureToggle } from '@/components/FeatureToggle';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { buildApiUrl, getAuthHeaders } from '@/lib/api';
import { TradeForm } from '@/components/TradeForm';

// Form validation schema using Zod
const formSchema = z.object({
  date: z.date({
    required_error: "Trade date is required",
  }),
  asset: z.string().min(1, "Asset is required"),
  tradeType: z.enum(["Buy", "Sell", "Long", "Short"] as const),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().min(0, "Exit price must be non-negative"),
  positionSize: z.coerce.number().positive("Position size must be positive"),
  profitLoss: z.coerce.number(),
  notes: z.string().optional(),
  emotion: z.enum(["Confident", "Nervous", "Greedy", "Fearful", "Calm", "Excited", "Frustrated", "Satisfied"] as const),
  setup: z.string().optional(),
  executionQuality: z.coerce.number().min(1).max(10).optional(),
  duration: z.coerce.number().optional(),
  checklist_id: z.string().optional(),
});

export default function AddTrade() {
  // Get location and navigate for routing
  const location = useLocation();
  const navigate = useNavigate();
  
  // States for handling screenshot and checklist
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  
  // Advanced features toggle
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  
  // Initialize hooks
  const { fetchChecklists, getChecklist } = useChecklists();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      asset: "",
      tradeType: "Buy" as TradeType,
      entryPrice: 0,
      exitPrice: 0,
      positionSize: 0,
      profitLoss: 0,
      notes: "",
      emotion: "Calm" as EmotionType,
      setup: "",
      executionQuality: 5,
      duration: undefined,
      checklist_id: undefined,
    },
  });
  
  // Load checklists on component mount
  useEffect(() => {
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
      
      // Check if we have a checklist ID from location state (from checklist page)
      const locationState = location.state as { checklistId?: string } | undefined;
      if (locationState?.checklistId) {
        handleChecklistChange(locationState.checklistId);
      }
    };
    
    loadChecklists();
  }, [fetchChecklists, location]);
  
  // Handle checklist selection change
  const handleChecklistChange = async (checklistId: string) => {
    console.log('Checklist changed to:', checklistId);
    
    // If "none" is selected, set to undefined (no checklist)
    if (checklistId === "none") {
      form.setValue('checklist_id', undefined);
      setSelectedChecklist(null);
      setChecklistItems([]);
      return;
    }
    
    form.setValue('checklist_id', checklistId);
    
    try {
      const checklist = await getChecklist(checklistId);
      console.log('Loaded checklist:', checklist);
      if (checklist) {
        setSelectedChecklist(checklist);
        setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };
  
  // Handle checklist item toggle
  const handleChecklistItemToggle = (id: string, completed: boolean) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, completed } : item
      )
    );
  };
  
  // Handle screenshot file selection
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };
  
  // Clear screenshot
  const clearScreenshot = () => {
    setScreenshotFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };
  
  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let screenshotUrl = null;
      if (screenshotFile) {
        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        const uploadRes = await fetch(buildApiUrl('/upload'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Failed to upload screenshot');
        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.url;
      }
      // Prepare the trade data for backend
      const tradeData = {
        symbol: values.asset,
        type: values.tradeType,
        entry_price: values.entryPrice,
        exit_price: values.exitPrice,
        quantity: values.positionSize,
        entry_time: values.date,
        exit_time: values.date, // or use a separate field if available
        pnl: values.profitLoss,
        notes: values.notes || '',
        emotion: values.emotion,
        setup: values.setup,
        execution_quality: values.executionQuality,
        duration: values.duration,
        checklist_id: values.checklist_id && values.checklist_id !== "none" ? parseInt(values.checklist_id, 10) : null,
        checklist_completed: selectedChecklist && checklistItems.length > 0
          ? checklistItems.map(item => ({ text: item.text, completed: !!item.completed }))
          : null,
        screenshot: screenshotUrl,
      };
      // POST to backend
      const res = await fetch(buildApiUrl('/trades'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(tradeData),
      });
      if (res.ok) {
        toast.success("Trade Added", {
          description: "Your trade has been successfully added to your journal.",
        });
        navigate('/trades');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add trade");
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to add trade. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add New Trade</h1>
        <Button 
          variant="outline" 
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          {showAdvancedFeatures ? "Hide" : "Show"} Advanced
          {showAdvancedFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      <TradeForm 
        mode="add" 
        onSubmit={onSubmit} 
        isSubmitting={isSubmitting} 
        isUploading={isUploading} 
        screenshotFile={screenshotFile} 
        previewUrl={previewUrl} 
        handleScreenshotChange={handleScreenshotChange} 
        clearScreenshot={clearScreenshot} 
        selectedChecklist={selectedChecklist} 
        checklistItems={checklistItems} 
        handleChecklistChange={handleChecklistChange} 
        handleChecklistItemToggle={handleChecklistItemToggle} 
        showAdvancedFeatures={showAdvancedFeatures} 
        setShowAdvancedFeatures={setShowAdvancedFeatures} 
        form={form} 
        checklists={checklists} 
        onCancel={() => navigate('/trades')} 
      />
    </div>
  );
}
