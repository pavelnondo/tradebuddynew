
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useEffect } from "react";

// Define settings schema with validation
const settingsFormSchema = z.object({
  currency: z.string(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  initialBalance: z.number().min(0, "Initial balance must be positive"),
  enableNotifications: z.boolean(),
  emailNotifications: z.boolean(),
  emailAddress: z.string().email().optional().or(z.literal("")),
  googleSheetUrl: z.string().url().optional().or(z.literal("")),
  syncWithSheets: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { settings, loading, updateSettings } = useUserSettings();
  
  // Get local settings for notification preferences (not stored in backend yet)
  const savedSettings = localStorage.getItem('tradingSettings');
  const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};

  // Initialize form with backend settings or defaults
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      initialBalance: 10000,
      enableNotifications: parsedSettings.enableNotifications ?? true,
      emailNotifications: parsedSettings.emailNotifications ?? false,
      emailAddress: parsedSettings.emailAddress || "",
      googleSheetUrl: parsedSettings.googleSheetUrl || "",
      syncWithSheets: parsedSettings.syncWithSheets ?? false,
    },
  });

  // Update form when settings are loaded from backend
  useEffect(() => {
    if (settings) {
      form.reset({
        currency: settings.currency,
        dateFormat: settings.date_format as "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD",
        initialBalance: Number(settings.initial_balance),
        enableNotifications: parsedSettings.enableNotifications ?? true,
        emailNotifications: parsedSettings.emailNotifications ?? false,
        emailAddress: parsedSettings.emailAddress || "",
        googleSheetUrl: parsedSettings.googleSheetUrl || "",
        syncWithSheets: parsedSettings.syncWithSheets ?? false,
      });
    }
  }, [settings, parsedSettings]);

  // Form submission handler
  const onSubmit = async (data: SettingsFormValues) => {
    try {
      console.log("Saving settings:", data);
      
      // Save core settings to backend
      await updateSettings({
        initial_balance: data.initialBalance,
        currency: data.currency,
        date_format: data.dateFormat,
      });
      
      // Save notification preferences to localStorage (not in backend yet)
      localStorage.setItem('tradingSettings', JSON.stringify({
        enableNotifications: data.enableNotifications,
        emailNotifications: data.emailNotifications,
        emailAddress: data.emailAddress,
        googleSheetUrl: data.googleSheetUrl,
        syncWithSheets: data.syncWithSheets,
      }));
      
      // Show success toast
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
        className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your trading journal experience with these settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                        <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Displayed currency symbol for profits and losses.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Format used for displaying dates throughout the app.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Trading Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="10000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Your starting balance for calculating performance metrics and returns.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Notifications</FormLabel>
                      <FormDescription>
                        Receive in-app notifications for trade reminders and insights.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Email Notifications</FormLabel>
                      <FormDescription>
                        Receive weekly performance summaries via email.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("emailNotifications") && (
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Where to send your performance summaries.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect with external services to extend functionality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="syncWithSheets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Sync with Google Sheets</FormLabel>
                      <FormDescription>
                        Automatically export your trade data to Google Sheets.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("syncWithSheets") && (
                <FormField
                  control={form.control}
                  name="googleSheetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Sheet URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The URL of your Google Sheet document.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          
          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </form>
      </Form>
    </div>
  );
}
