
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { EmotionType, TradeType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define form schema with validation
const tradeFormSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  tradeType: z.enum(["Buy", "Sell", "Long", "Short"] as const),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().positive("Exit price must be positive"),
  positionSize: z.coerce.number().positive("Position size must be positive"),
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
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

export default function AddTrade() {
  // Initialize form
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      asset: "",
      tradeType: "Buy",
      entryPrice: 0,
      exitPrice: 0,
      positionSize: 0,
      date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
      notes: "",
      emotion: "Confident",
    },
  });

  // Calculate profit/loss based on form values
  const calculateProfitLoss = () => {
    const values = form.getValues();
    const { entryPrice, exitPrice, positionSize, tradeType } = values;
    
    if (!entryPrice || !exitPrice || !positionSize) return 0;
    
    let profitLoss = 0;
    
    if (tradeType === "Buy" || tradeType === "Long") {
      profitLoss = (exitPrice - entryPrice) * positionSize;
    } else {
      profitLoss = (entryPrice - exitPrice) * positionSize;
    }
    
    return profitLoss;
  };

  // Form submission handler
  const onSubmit = (data: TradeFormValues) => {
    // Calculate profit/loss
    const profitLoss = calculateProfitLoss();
    
    // In a real app, this would save to a database
    console.log("Submitting trade:", { ...data, profitLoss });
    
    // Show success toast
    toast({
      title: "Trade Added",
      description: "Your trade has been successfully logged.",
    });
    
    // Reset form
    form.reset();
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                
                <FormField
                  control={form.control}
                  name="positionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Size</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Profit/Loss:</span>
                  <span className={`font-bold ${
                    calculateProfitLoss() >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {calculateProfitLoss() >= 0 ? "+" : ""}
                    ${calculateProfitLoss().toFixed(2)}
                  </span>
                </div>
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
                      Upload a screenshot of your chart or trade.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">Log Trade</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
