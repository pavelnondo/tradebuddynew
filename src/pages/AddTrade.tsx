
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { EmotionType, Trade, TradeType, Checklist, ChecklistItem } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Loader2, FileCheck, InfoIcon } from "lucide-react";
import { useChecklists } from "@/hooks/useChecklists";
import { useLocation } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const tradeFormSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  tradeType: z.enum(["Buy", "Sell", "Long", "Short"] as const),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().positive("Exit price must be positive"),
  positionSize: z.coerce.number().positive("Position size must be positive"),
  profitLoss: z.coerce.number(),
  date: z.string(),
  notes: z.string().optional(),
  emotion: z.enum([
    "Confident",
    "Nervous",
    "Greedy",
    "Fearful",
    "Calm",
    "Excited",
    "Frustrated",
    "Satisfied",
  ] as const),
  screenshot: z.instanceof(FileList).optional(),
  checklist_id: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

export default function AddTrade() {
  const { toast } = useToast();
  const { addTrade, uploadScreenshot, isLoading } = useSupabaseTrades();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [checklistItems, setChecklistItems] = useState<(ChecklistItem & { completed: boolean })[]>([]);
  const location = useLocation();
  const { fetchChecklists, getChecklist, isLoading: isLoadingChecklists } = useChecklists();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      asset: "",
      tradeType: "Buy",
      entryPrice: undefined,
      exitPrice: undefined,
      positionSize: undefined,
      profitLoss: undefined,
      date: new Date().toISOString().slice(0, 16),
      notes: "",
      emotion: "Confident",
      checklist_id: undefined,
    },
  });

  // Load checklists on component mount
  useEffect(() => {
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
      
      // Check if a checklist ID was passed via location state
      const { state } = location;
      if (state && state.checklistId) {
        const checklist = await getChecklist(state.checklistId);
        if (checklist) {
          form.setValue('checklist_id', checklist.id);
          setSelectedChecklist(checklist);
          setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
        }
      }
    };
    
    loadChecklists();
  }, [fetchChecklists, getChecklist, location, form]);

  // Handle checklist selection change
  const handleChecklistChange = async (checklistId: string) => {
    form.setValue('checklist_id', checklistId);
    
    if (!checklistId) {
      setSelectedChecklist(null);
      setChecklistItems([]);
      return;
    }
    
    const checklist = await getChecklist(checklistId);
    if (checklist) {
      setSelectedChecklist(checklist);
      setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
    }
  };

  // Toggle checklist item completion
  const toggleChecklistItem = (id: string, completed: boolean) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, completed } : item
      )
    );
  };

  const onSubmit = async (data: TradeFormValues) => {
    setIsSubmitting(true);
    try {
      // Handle screenshot if provided
      let screenshotUrl = "";
      if (data.screenshot && data.screenshot[0]) {
        screenshotUrl = await uploadScreenshot(data.screenshot[0]);
        if (!screenshotUrl) {
          toast({
            title: "Screenshot upload failed",
            description: "The screenshot could not be uploaded, but the trade will still be saved.",
            variant: "destructive",
          });
        }
      }

      // Create trade object
      const trade: Omit<Trade, "id"> = {
        date: data.date,
        asset: data.asset,
        tradeType: data.tradeType,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        positionSize: data.positionSize,
        profitLoss: data.profitLoss,
        notes: data.notes || "",
        emotion: data.emotion,
        screenshot: screenshotUrl || undefined,
        setup: undefined,
        duration: undefined,
        executionQuality: undefined,
        checklist_id: data.checklist_id,
        checklist_completed: checklistItems,
      };

      // Save to Supabase
      const savedTrade = await addTrade(trade as Trade);
      
      if (savedTrade) {
        // If there's a screenshot, add it to the screenshots gallery
        if (screenshotUrl) {
          const storedScreenshots = localStorage.getItem('screenshots');
          let screenshots = storedScreenshots ? JSON.parse(storedScreenshots) : [];
          
          // Add the new screenshot
          const newScreenshot = {
            id: `trade-${savedTrade.id}`,
            title: `${data.asset} ${data.tradeType} Trade`,
            asset: data.asset,
            date: data.date,
            tags: [data.tradeType, data.emotion, 'Trade Screenshot'],
            url: screenshotUrl
          };
          
          // Check if screenshot already exists by URL
          if (!screenshots.some((s: any) => s.url === screenshotUrl)) {
            screenshots.push(newScreenshot);
            localStorage.setItem('screenshots', JSON.stringify(screenshots));
          }
        }
        
        toast({
          title: "Trade Added",
          description: "Your trade has been successfully logged to Supabase.",
        });

        // Reset form
        form.reset({
          asset: "",
          tradeType: "Buy",
          entryPrice: undefined,
          exitPrice: undefined,
          positionSize: undefined,
          profitLoss: undefined,
          date: new Date().toISOString().slice(0, 16),
          notes: "",
          emotion: "Confident",
          checklist_id: undefined,
        });
        
        // Reset checklist state
        setSelectedChecklist(null);
        setChecklistItems([]);
      } else {
        throw new Error("Failed to save trade");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add New Trade</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
          <CardDescription>
            Log a new trade with all relevant information to track your performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="asset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <FormControl>
                        <Input placeholder="BTC, AAPL, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tradeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trade type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["Buy", "Sell", "Long", "Short"] as TradeType[]).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotion</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How did you feel?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["Confident", "Nervous", "Greedy", "Fearful", "Calm", "Excited", "Frustrated", "Satisfied"] as EmotionType[]).map((emotion) => (
                            <SelectItem key={emotion} value={emotion}>
                              {emotion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Trading Checklist Selection */}
              <FormField
                control={form.control}
                name="checklist_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Trading Checklist
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Apply a trading checklist to ensure you're following your strategy. Create checklists in the Checklists page.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleChecklistChange(value);
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a checklist (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {checklists.map((checklist) => (
                          <SelectItem key={checklist.id} value={checklist.id}>
                            {checklist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Apply a trading checklist to track your strategy adherence.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              {/* Display Checklist Items if a checklist is selected */}
              {selectedChecklist && (
                <Card className="border-dashed">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base font-medium flex items-center">
                      <FileCheck className="mr-2 h-4 w-4" />
                      {selectedChecklist.name} Checklist
                    </CardTitle>
                    {selectedChecklist.description && (
                      <CardDescription>{selectedChecklist.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-3">
                      {checklistItems.map((item) => (
                        <div key={item.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`checklist-item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              toggleChecklistItem(item.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`checklist-item-${item.id}`}
                            className={`text-sm ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={value === undefined ? "" : value}
                          onChange={onChange}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Exit Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={value === undefined ? "" : value}
                          onChange={onChange}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="positionSize"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Position Size</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={value === undefined ? "" : value}
                          onChange={onChange}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profitLoss"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Profit/Loss</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={value === undefined ? "" : value}
                          onChange={onChange}
                          {...fieldProps} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant notes about this trade..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="screenshot"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Screenshot</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a screenshot of your trade (optional). It will be saved to your screenshots gallery too.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Trade...
                  </>
                ) : (
                  "Log Trade"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
