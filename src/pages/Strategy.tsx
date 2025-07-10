import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checklist, ChecklistItem, Trade } from "@/types";
import { useChecklists } from "@/hooks/useChecklists";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckSquare, 
  FileText, 
  Image as ImageIcon, 
  BarChart, 
  Loader2, 
  PlusCircle, 
  X 
} from "lucide-react";
import { useApiTrades } from '@/hooks/useApiTrades';

export default function Strategy() {
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [completedItems, setCompletedItems] = useState<ChecklistItem[]>([]);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [strategyNotes, setStrategyNotes] = useState("");
  const [strategyImages, setStrategyImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  const { fetchChecklists, getChecklist } = useChecklists();
  const { toast } = useToast();
  const { trades: apiTrades, isLoading: apiTradesLoading, error: apiTradesError, fetchTrades: fetchApiTrades } = useApiTrades();

  // Load checklists and trades on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const checklistsData = await fetchChecklists();
        setChecklists(checklistsData);
        
        const tradesData = await fetchApiTrades();
        setTrades(tradesData);
        
        // Set the first checklist as selected by default if available
        if (checklistsData.length > 0) {
          setSelectedChecklistId(checklistsData[0].id);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchChecklists, toast, fetchApiTrades]);

  // Load selected checklist details when ID changes
  useEffect(() => {
    const loadChecklist = async () => {
      if (!selectedChecklistId) {
        setSelectedChecklist(null);
        setCompletedItems([]);
        return;
      }
      
      try {
        const checklist = await getChecklist(selectedChecklistId);
        if (checklist) {
          setSelectedChecklist(checklist);
          // Initialize completed items with the checklist items, but marked as not completed
          setCompletedItems(
            checklist.items.map(item => ({
              ...item,
              completed: false
            }))
          );
        }
      } catch (error) {
        console.error("Error loading checklist:", error);
        toast({
          title: "Error",
          description: "Failed to load checklist details.",
          variant: "destructive",
        });
      }
    };
    
    loadChecklist();
  }, [selectedChecklistId, getChecklist, toast]);

  // Update progress when completed items change
  useEffect(() => {
    if (completedItems.length === 0) {
      setChecklistProgress(0);
      return;
    }
    
    const completedCount = completedItems.filter(item => item.completed).length;
    const progress = Math.round((completedCount / completedItems.length) * 100);
    setChecklistProgress(progress);
  }, [completedItems]);

  // Handle checkbox change
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCompletedItems(
      completedItems.map(item => 
        item.id === id ? { ...item, completed: checked } : item
      )
    );
  };

  // Handle checklist selection
  const handleChecklistChange = (checklistId: string) => {
    setSelectedChecklistId(checklistId);
  };

  // Handle strategy notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStrategyNotes(e.target.value);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = files[0];
      const imageUrl = await uploadScreenshot(file);
      
      if (imageUrl) {
        setStrategyImages([...strategyImages, imageUrl]);
        toast({
          title: "Image Uploaded",
          description: "Strategy image was uploaded successfully.",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setShowImageUpload(false);
      // Clear the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setStrategyImages(images => images.filter((_, i) => i !== index));
  };

  // Calculate strategy adherence metrics
  const calculateAdherenceMetrics = () => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        tradesWithChecklist: 0,
        averageAdherence: 0,
        profitableAdherence: 0,
        unprofitableAdherence: 0
      };
    }
    
    const tradesWithChecklist = trades.filter(
      trade => trade.checklist_completed && trade.checklist_completed.length > 0
    );
    
    if (tradesWithChecklist.length === 0) {
      return {
        totalTrades: trades.length,
        tradesWithChecklist: 0,
        averageAdherence: 0,
        profitableAdherence: 0,
        unprofitableAdherence: 0
      };
    }
    
    // Calculate average adherence for all trades with checklists
    const adherenceScores = tradesWithChecklist.map(trade => {
      const total = trade.checklist_completed?.length || 0;
      if (total === 0) return 0;
      
      const completed = trade.checklist_completed?.filter(item => item.completed).length || 0;
      return (completed / total) * 100;
    });
    
    const averageAdherence = adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length;
    
    // Calculate adherence for profitable vs unprofitable trades
    const profitableTrades = tradesWithChecklist.filter(trade => trade.profitLoss > 0);
    const unprofitableTrades = tradesWithChecklist.filter(trade => trade.profitLoss <= 0);
    
    const profitableAdherenceScores = profitableTrades.map(trade => {
      const total = trade.checklist_completed?.length || 0;
      if (total === 0) return 0;
      
      const completed = trade.checklist_completed?.filter(item => item.completed).length || 0;
      return (completed / total) * 100;
    });
    
    const unprofitableAdherenceScores = unprofitableTrades.map(trade => {
      const total = trade.checklist_completed?.length || 0;
      if (total === 0) return 0;
      
      const completed = trade.checklist_completed?.filter(item => item.completed).length || 0;
      return (completed / total) * 100;
    });
    
    const profitableAdherence = profitableAdherenceScores.length > 0
      ? profitableAdherenceScores.reduce((sum, score) => sum + score, 0) / profitableAdherenceScores.length
      : 0;
    
    const unprofitableAdherence = unprofitableAdherenceScores.length > 0
      ? unprofitableAdherenceScores.reduce((sum, score) => sum + score, 0) / unprofitableAdherenceScores.length
      : 0;
    
    return {
      totalTrades: trades.length,
      tradesWithChecklist: tradesWithChecklist.length,
      averageAdherence: Math.round(averageAdherence),
      profitableAdherence: Math.round(profitableAdherence),
      unprofitableAdherence: Math.round(unprofitableAdherence)
    };
  };

  const metrics = calculateAdherenceMetrics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Strategy</h1>
      </div>
      
      <p className="text-muted-foreground">
        Define and refine your trading strategy using checklists, notes, and visual aids. Track your strategy adherence over time.
      </p>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading strategy data...</p>
        </div>
      ) : (
        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="checklist" className="flex items-center">
              <CheckSquare className="mr-2 h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Notes & Visuals
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>
          
          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Checklist</CardTitle>
                <CardDescription>
                  Select a checklist and mark items as you review your strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {checklists.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You don't have any checklists yet.</p>
                    <Button asChild>
                      <a href="/checklists">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Checklist
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {checklists.map(checklist => (
                        <Card 
                          key={checklist.id} 
                          className={`cursor-pointer hover:bg-accent transition-colors ${
                            selectedChecklistId === checklist.id ? 'border-primary' : ''
                          }`}
                          onClick={() => handleChecklistChange(checklist.id)}
                        >
                          <CardHeader className="p-4">
                            <CardTitle className="text-base">{checklist.name}</CardTitle>
                            {checklist.description && (
                              <CardDescription className="text-xs line-clamp-2">
                                {checklist.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                    
                    {selectedChecklist && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">{selectedChecklist.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {checklistProgress}% Complete
                            </span>
                            <Progress value={checklistProgress} className="w-[100px]" />
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          {completedItems.map(item => (
                            <div key={item.id} className="flex items-start space-x-2">
                              <Checkbox 
                                id={`item-${item.id}`} 
                                checked={item.completed}
                                onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)} 
                              />
                              <Label 
                                htmlFor={`item-${item.id}`}
                                className={`${item.completed ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {item.text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notes & Visuals Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Notes</CardTitle>
                <CardDescription>
                  Document your trading strategy with notes and visual aids
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="strategy-notes">Strategy Notes</Label>
                    <Textarea
                      id="strategy-notes"
                      placeholder="Describe your trading strategy, rules, or observations..."
                      className="min-h-[200px]"
                      value={strategyNotes}
                      onChange={handleNotesChange}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Strategy Visuals</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowImageUpload(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                    
                    {showImageUpload && (
                      <div className="border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Upload Image</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowImageUpload(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {strategyImages.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {strategyImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Strategy visualization ${index + 1}`}
                              className="w-full h-[180px] object-cover rounded-md"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ImageIcon className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Strategy Visualization</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img
                                    src={image}
                                    alt={`Strategy visualization ${index + 1}`}
                                    className="w-full rounded-md"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No strategy images yet. Add visual aids to help understand your strategy.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Adherence Insights</CardTitle>
                <CardDescription>
                  Analysis of how well you stick to your strategy across your trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.totalTrades === 0 ? (
                  <div className="text-center py-8">
                    <BarChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-2">
                      No trade data available yet to generate insights.
                    </p>
                    <Button asChild>
                      <a href="/add-trade">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Your First Trade
                      </a>
                    </Button>
                  </div>
                ) : metrics.tradesWithChecklist === 0 ? (
                  <div className="text-center py-8">
                    <BarChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-2">
                      You have {metrics.totalTrades} trades, but none with completed checklists.
                      Use checklists when adding trades to see insights here.
                    </p>
                    <Button asChild>
                      <a href="/add-trade">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Trade With Checklist
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Overall Adherence</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex flex-col items-center">
                            <Progress value={metrics.averageAdherence} className="w-full mb-2" />
                            <span className="text-2xl font-bold">{metrics.averageAdherence}%</span>
                            <span className="text-xs text-muted-foreground">
                              Average across {metrics.tradesWithChecklist} trades
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Profitable Trades Adherence</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex flex-col items-center">
                            <Progress value={metrics.profitableAdherence} className="w-full mb-2" />
                            <span className="text-2xl font-bold text-green-500">{metrics.profitableAdherence}%</span>
                            <span className="text-xs text-muted-foreground">
                              Average for profitable trades
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Unprofitable Trades Adherence</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex flex-col items-center">
                            <Progress value={metrics.unprofitableAdherence} className="w-full mb-2" />
                            <span className="text-2xl font-bold text-red-500">{metrics.unprofitableAdherence}%</span>
                            <span className="text-xs text-muted-foreground">
                              Average for unprofitable trades
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Analysis & Insights</h3>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          {metrics.profitableAdherence > metrics.unprofitableAdherence ? (
                            <div className="space-y-2">
                              <p className="font-medium">Higher adherence correlates with profitability</p>
                              <p className="text-sm text-muted-foreground">
                                Your data shows that when you stick to your strategy more closely ({metrics.profitableAdherence}% adherence), 
                                your trades tend to be more profitable compared to when you deviate from your strategy ({metrics.unprofitableAdherence}% adherence).
                              </p>
                              <p className="text-sm text-muted-foreground">
                                This suggests your strategy has merit, and strict adherence could lead to more consistent results.
                              </p>
                            </div>
                          ) : metrics.profitableAdherence < metrics.unprofitableAdherence ? (
                            <div className="space-y-2">
                              <p className="font-medium">Consider revising your strategy checklist</p>
                              <p className="text-sm text-muted-foreground">
                                Interestingly, your unprofitable trades show higher strategy adherence ({metrics.unprofitableAdherence}%) 
                                than your profitable ones ({metrics.profitableAdherence}%).
                              </p>
                              <p className="text-sm text-muted-foreground">
                                This might indicate that some items in your strategy checklist need adjustment, 
                                or that there are additional factors affecting your trading success that aren't captured in your current strategy.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="font-medium">Your adherence is consistent across all trades</p>
                              <p className="text-sm text-muted-foreground">
                                You show similar adherence levels for both profitable and unprofitable trades.
                                This could mean that while you're consistently following your process,
                                other factors might be influencing your trading outcomes.
                              </p>
                            </div>
                          )}
                          
                          {metrics.averageAdherence < 70 ? (
                            <div className="mt-4 pt-4 border-t">
                              <p className="font-medium">Room for improvement in strategy discipline</p>
                              <p className="text-sm text-muted-foreground">
                                Your overall strategy adherence is {metrics.averageAdherence}%, which suggests there's room for improvement
                                in following your trading plan more consistently.
                              </p>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
