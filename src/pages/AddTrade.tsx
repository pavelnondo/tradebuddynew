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
import { API_BASE_URL } from '@/config';

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
    // If "none" is selected, set to undefined (no checklist)
    if (checklistId === "none") {
      form.setValue('checklist_id', undefined);
      setSelectedChecklist(null);
      setChecklistItems([]);
      return;
    }
    
    form.setValue('checklist_id', checklistId);
    
    const checklist = await getChecklist(checklistId);
    if (checklist) {
      setSelectedChecklist(checklist);
      setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
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
        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
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
        checklist_id: values.checklist_id ? parseInt(values.checklist_id, 10) : null,
        checklist_completed: selectedChecklist && checklistItems.length > 0
          ? checklistItems.map(item => ({ text: item.text, completed: !!item.completed }))
          : null,
        screenshot: screenshotUrl,
      };
      // POST to backend
      const res = await fetch(`${API_BASE_URL}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Trade Details</CardTitle>
              <CardDescription>
                Enter the basic information about your trade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trade Date and Time */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl>
                      <DateTimeInput 
                        date={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Asset */}
              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <FormControl>
                      <Input placeholder="AAPL, EURUSD, BTC, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the ticker or name of the asset you traded.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Trade Type */}
              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-6"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Buy" />
                          </FormControl>
                          <FormLabel className="font-normal">Buy</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sell" />
                          </FormControl>
                          <FormLabel className="font-normal">Sell</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Long" />
                          </FormControl>
                          <FormLabel className="font-normal">Long</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Short" />
                          </FormControl>
                          <FormLabel className="font-normal">Short</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Entry Price */}
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Exit Price */}
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Position Size */}
              <FormField
                control={form.control}
                name="positionSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Size</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of shares, contracts, or units.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Profit/Loss - Now manually entered, not auto-calculated */}
              <FormField
                control={form.control}
                name="profitLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit/Loss</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className={field.value >= 0 ? "text-green-600" : "text-red-600"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your profit or loss manually.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Emotion */}
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emotion During Trade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select emotion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Confident">Confident</SelectItem>
                        <SelectItem value="Nervous">Nervous</SelectItem>
                        <SelectItem value="Greedy">Greedy</SelectItem>
                        <SelectItem value="Fearful">Fearful</SelectItem>
                        <SelectItem value="Calm">Calm</SelectItem>
                        <SelectItem value="Excited">Excited</SelectItem>
                        <SelectItem value="Frustrated">Frustrated</SelectItem>
                        <SelectItem value="Satisfied">Satisfied</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How were you feeling when making this trade?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Advanced features */}
              {showAdvancedFeatures && (
                <>
                  {/* Duration (optional) */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Optional"
                            {...field}
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long did you hold this position?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Setup */}
                  <FormField
                    control={form.control}
                    name="setup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Breakout, Support/Resistance, etc." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          What trading setup did you use for this trade?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Execution Quality */}
                  <FormField
                    control={form.control}
                    name="executionQuality"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>Execution Quality</FormLabel>
                          <span className="text-sm">{field.value}/10</span>
                        </div>
                        <FormControl>
                          <Slider 
                            min={1} 
                            max={10} 
                            step={1} 
                            defaultValue={[field.value || 5]} 
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          How well did you execute this trade according to your plan?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any thoughts or observations about this trade..."
                            className="min-h-[120px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Checklist */}
                  <FormField
                    control={form.control}
                    name="checklist_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Checklist</FormLabel>
                        <Select 
                          value={form.watch('checklist_id') || ''} 
                          onValueChange={val => form.setValue('checklist_id', val)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trading checklist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {checklists.map((checklist) => (
                              <SelectItem key={checklist.id} value={String(checklist.id)}>{checklist.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a trading checklist to ensure discipline and consistency.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Checklist Items */}
                  {selectedChecklist && checklistItems.length > 0 && (
                    <div className="border rounded-md p-4 space-y-3">
                      <h3 className="font-medium">{selectedChecklist.name} Checklist</h3>
                      <div className="space-y-2">
                        {checklistItems.map((item) => (
                          <div key={item.id} className="flex items-start space-x-2">
                            <Checkbox 
                              id={item.id} 
                              checked={item.completed}
                              onCheckedChange={(checked) => handleChecklistItemToggle(item.id, !!checked)}
                            />
                            <label 
                              htmlFor={item.id}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Screenshot Upload */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Screenshot</h3>
                  {screenshotFile && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearScreenshot}>
                      Clear
                    </Button>
                  )}
                </div>
                
                {!screenshotFile ? (
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </p>
                    <label htmlFor="screenshot-upload">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="cursor-pointer"
                        onClick={() => document.getElementById('screenshot-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <Input 
                        id="screenshot-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleScreenshotChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl!} 
                      alt="Trade Screenshot" 
                      className="w-full h-auto max-h-[300px] object-contain" 
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/trades')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
              >
                {(isSubmitting || isUploading) && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Trade
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
