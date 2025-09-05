import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  TrendingUp, 
  Target, 
  Clock,
  DollarSign,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TradeTemplate {
  id: number;
  name: string;
  description: string;
  symbol: string;
  tradeType: 'Buy' | 'Sell';
  setupType: string;
  marketCondition: string;
  confidenceLevel: number;
  notes: string;
  tags: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

interface QuickTradeTemplatesProps {
  onSelectTemplate: (template: TradeTemplate) => void;
  onSaveTemplate: (template: Omit<TradeTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateTemplate: (id: number, template: Partial<TradeTemplate>) => Promise<void>;
  onDeleteTemplate: (id: number) => Promise<void>;
}

export function QuickTradeTemplates({ 
  onSelectTemplate, 
  onSaveTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate 
}: QuickTradeTemplatesProps) {
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TradeTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: '',
    tradeType: 'Buy' as 'Buy' | 'Sell',
    setupType: '',
    marketCondition: '',
    confidenceLevel: 5,
    notes: '',
    tags: [] as string[],
    isActive: true,
  });

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trade-templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load trade templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, formData);
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        await onSaveTemplate(formData);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }
      
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: TradeTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      symbol: template.symbol,
      tradeType: template.tradeType,
      setupType: template.setupType,
      marketCondition: template.marketCondition,
      confidenceLevel: template.confidenceLevel,
      notes: template.notes,
      tags: template.tags,
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDeleteTemplate(id);
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      symbol: '',
      tradeType: 'Buy',
      setupType: '',
      marketCondition: '',
      confidenceLevel: 5,
      notes: '',
      tags: [],
      isActive: true,
    });
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSelectTemplate = (template: TradeTemplate) => {
    onSelectTemplate(template);
    toast({
      title: "Template Selected",
      description: `${template.name} template applied to trade form`,
    });
  };

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-32 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick Trade Templates</h3>
          <p className="text-sm text-muted-foreground">
            Save and reuse common trade setups for faster entry
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTemplate} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                Create a reusable template for quick trade entry
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., NQ Breakout Setup"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g., NQ, ES, YM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this setup..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tradeType">Trade Type</Label>
                  <Select
                    value={formData.tradeType}
                    onValueChange={(value: 'Buy' | 'Sell') => setFormData({ ...formData, tradeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setupType">Setup Type</Label>
                  <Input
                    id="setupType"
                    value={formData.setupType}
                    onChange={(e) => setFormData({ ...formData, setupType: e.target.value })}
                    placeholder="e.g., Breakout, Pullback, Reversal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketCondition">Market Condition</Label>
                  <Select
                    value={formData.marketCondition}
                    onValueChange={(value) => setFormData({ ...formData, marketCondition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select market condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="ranging">Ranging</SelectItem>
                      <SelectItem value="volatile">Volatile</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="news">News Driven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceLevel">Confidence Level</Label>
                  <Select
                    value={formData.confidenceLevel.toString()}
                    onValueChange={(value) => setFormData({ ...formData, confidenceLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} - {level <= 3 ? 'Low' : level <= 7 ? 'Medium' : 'High'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or reminders for this setup..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first template to speed up trade entry
            </p>
            <Button onClick={handleNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="card-modern">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{template.symbol}</span>
                    <Badge variant="outline" className="ml-2">
                      {template.tradeType}
                    </Badge>
                  </div>
                  
                  {template.setupType && (
                    <div className="flex items-center text-sm">
                      <Target className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{template.setupType}</span>
                    </div>
                  )}
                  
                  {template.marketCondition && (
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="capitalize">{template.marketCondition}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>Confidence: {template.confidenceLevel}/10</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSelectTemplate(template)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
