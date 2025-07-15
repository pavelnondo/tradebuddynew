import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Upload, UploadCloud, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { DateTimeInput } from '@/components/DateTimeInput';
import { useChecklists } from '@/hooks/useChecklists';
import { Trade, TradeType, EmotionType, Checklist, ChecklistItem } from '@/types';

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

function TradeForm({
  mode = 'add',
  initialValues = {},
  onSubmit,
  onCancel,
}: {
  mode?: 'add' | 'edit',
  initialValues?: Partial<Trade>,
  onSubmit: (tradeData: any) => Promise<void> | void,
  onCancel: () => void,
}) {
  // State for advanced features, screenshot, checklist, etc.
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const { fetchChecklists, getChecklist } = useChecklists();

  // Form setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialValues.date ? new Date(initialValues.date) : new Date(),
      asset: initialValues.asset || '',
      tradeType: initialValues.tradeType || 'Buy',
      entryPrice: initialValues.entryPrice || 0,
      exitPrice: initialValues.exitPrice || 0,
      positionSize: initialValues.positionSize || 0,
      profitLoss: initialValues.profitLoss || 0,
      notes: initialValues.notes || '',
      emotion: initialValues.emotion || 'Calm',
      setup: initialValues.setup || '',
      executionQuality: initialValues.executionQuality || 5,
      duration: initialValues.duration,
      checklist_id: initialValues.checklist_id ? String(initialValues.checklist_id) : undefined,
    },
  });

  // Load checklists
  useEffect(() => {
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
      if (initialValues.checklist_id) {
        handleChecklistChange(String(initialValues.checklist_id), initialValues.checklist_completed);
      }
    };
    loadChecklists();
    // eslint-disable-next-line
  }, []);

  // Checklist change handler
  const handleChecklistChange = async (checklistId, completedItems) => {
    if (checklistId === 'none') {
      form.setValue('checklist_id', undefined);
      setSelectedChecklist(null);
      setChecklistItems([]);
      return;
    }
    form.setValue('checklist_id', checklistId);
    try {
      const checklist = await getChecklist(checklistId);
      if (checklist) {
        setSelectedChecklist(checklist);
        if (completedItems) {
          setChecklistItems(
            checklist.items.map((item, idx) => ({
              ...item,
              completed: completedItems[idx]?.completed || false,
            }))
          );
        } else {
          setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
        }
      }
    } catch (error) {
      // handle error
    }
  };

  // Checklist item toggle
  const handleChecklistItemToggle = (id, completed) => {
    setChecklistItems(
      checklistItems.map(item =>
        item.id === id ? { ...item, completed } : item
      )
    );
  };

  // Screenshot handlers
  const handleScreenshotChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };
  const clearScreenshot = () => {
    setScreenshotFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Form submit handler
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    let screenshotUrl = initialValues.screenshot || null;
    try {
      if (screenshotFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Failed to upload screenshot');
        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.url;
        setIsUploading(false);
      }
      const tradeData = {
        symbol: values.asset,
        type: values.tradeType,
        entry_price: values.entryPrice,
        exit_price: values.exitPrice,
        quantity: values.positionSize,
        entry_time: values.date,
        exit_time: values.date,
        pnl: values.profitLoss,
        notes: values.notes || '',
        emotion: values.emotion,
        setup: values.setup,
        execution_quality: values.executionQuality,
        duration: values.duration,
        checklist_id: values.checklist_id && values.checklist_id !== 'none' ? parseInt(values.checklist_id, 10) : null,
        checklist_completed: selectedChecklist && checklistItems.length > 0
          ? checklistItems.map(item => ({ text: item.text, completed: !!item.completed }))
          : null,
        screenshot: screenshotUrl,
      };
      await onSubmit(tradeData);
    } catch (error) {
      // handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{mode === 'edit' ? 'Edit Trade' : 'Add New Trade'}</h1>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          {showAdvancedFeatures ? 'Hide' : 'Show'} Advanced
          {showAdvancedFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
              {/* Profit/Loss */}
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
                        className={field.value >= 0 ? 'text-green-600' : 'text-red-600'}
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
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
                            onValueChange={vals => field.onChange(vals[0])}
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
                          onValueChange={id => handleChecklistChange(id, checklistItems)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trading checklist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {checklists.map(checklist => (
                              <SelectItem key={checklist.id} value={String(checklist.id)}>
                                {checklist.name}
                              </SelectItem>
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
                        {checklistItems.map(item => (
                          <div key={item.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={item.id}
                              checked={item.completed}
                              onCheckedChange={checked => handleChecklistItemToggle(item.id, !!checked)}
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
                      src={previewUrl || initialValues.screenshot}
                      alt="Trade Screenshot"
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                {mode === 'edit' ? 'Save Changes' : 'Add Trade'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default TradeForm; 