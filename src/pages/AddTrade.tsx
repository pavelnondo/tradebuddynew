
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { EmotionType, Trade, TradeType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

export default function AddTrade() {
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      asset: "",
      tradeType: "Buy",
      entryPrice: 0,
      exitPrice: 0,
      positionSize: 0,
      profitLoss: 0,
      date: new Date().toISOString().slice(0, 16),
      notes: "",
      emotion: "Confident",
    },
  });

  const onSubmit = async (data: TradeFormValues) => {
    try {
      // Handle screenshot if provided
      let screenshotUrl = "";
      if (data.screenshot && data.screenshot[0]) {
        const file = data.screenshot[0];
        screenshotUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Create trade object - ensure all required properties are provided
      const trade: Trade = {
        id: crypto.randomUUID(),
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
      };

      // Get existing trades from localStorage
      const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
      
      // Add new trade
      const updatedTrades = [...existingTrades, trade];
      
      // Save to localStorage
      localStorage.setItem('trades', JSON.stringify(updatedTrades));

      toast({
        title: "Trade Added",
        description: "Your trade has been successfully logged.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trade. Please try again.",
        variant: "destructive",
      });
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <FormField
                  control={form.control}
                  name="profitLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit/Loss</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                      Upload a screenshot of your trade (optional)
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
