import React, { useState, useEffect } from 'react';
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TradeTemplate {
  id: string;
  name: string;
  description: string;
  asset: string;
  tradeType: string;
  entryPrice?: number;
  exitPrice?: number;
  positionSize?: number;
  setup: string;
  emotion: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedTradeTemplatesProps {
  onTemplateSelect: (template: TradeTemplate) => void;
  onTemplateCreate: (template: Omit<TradeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  onTemplateUpdate: (id: string, template: Partial<TradeTemplate>) => void;
  onTemplateDelete: (id: string) => void;
}

export function EnhancedTradeTemplates({ 
  onTemplateSelect, 
  onTemplateCreate, 
  onTemplateUpdate, 
  onTemplateDelete 
}: EnhancedTradeTemplatesProps) {
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TradeTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent' | 'favorite'>('recent');
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    asset: '',
    tradeType: '',
    entryPrice: '',
    exitPrice: '',
    positionSize: '',
    setup: '',
    emotion: '',
    notes: '',
    tags: '',
    isFavorite: false,
  });

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('tradeTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (updatedTemplates: TradeTemplate[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('tradeTemplates', JSON.stringify(updatedTemplates));
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.asset || !newTemplate.tradeType) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, asset, and trade type.",
        variant: "destructive",
      });
      return;
    }

    const template: Omit<TradeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      name: newTemplate.name,
      description: newTemplate.description,
      asset: newTemplate.asset,
      tradeType: newTemplate.tradeType,
      entryPrice: newTemplate.entryPrice ? parseFloat(newTemplate.entryPrice) : undefined,
      exitPrice: newTemplate.exitPrice ? parseFloat(newTemplate.exitPrice) : undefined,
      positionSize: newTemplate.positionSize ? parseFloat(newTemplate.positionSize) : undefined,
      setup: newTemplate.setup,
      emotion: newTemplate.emotion,
      notes: newTemplate.notes,
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFavorite: newTemplate.isFavorite,
    };

    onTemplateCreate(template);
    
    const newTemplateWithId: TradeTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    saveTemplates([...templates, newTemplateWithId]);
    setNewTemplate({
      name: '',
      description: '',
      asset: '',
      tradeType: '',
      entryPrice: '',
      exitPrice: '',
      positionSize: '',
      setup: '',
      emotion: '',
      notes: '',
      tags: '',
      isFavorite: false,
    });
    setShowCreateDialog(false);

    toast({
      title: "Template created",
      description: `Template "${template.name}" has been created.`,
    });
  };

  const handleUpdateTemplate = (id: string, updates: Partial<TradeTemplate>) => {
    const updatedTemplates = templates.map(template => 
      template.id === id 
        ? { ...template, ...updates, updatedAt: new Date().toISOString() }
        : template
    );
    saveTemplates(updatedTemplates);
    onTemplateUpdate(id, updates);
    setEditingTemplate(null);

    toast({
      title: "Template updated",
      description: `Template has been updated.`,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(template => template.id !== id);
    saveTemplates(updatedTemplates);
    onTemplateDelete(id);

    toast({
      title: "Template deleted",
      description: "Template has been deleted.",
    });
  };

  const handleUseTemplate = (template: TradeTemplate) => {
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
        : t
    );
    saveTemplates(updatedTemplates);
    onTemplateSelect(template);

    toast({
      title: "Template applied",
      description: `Template "${template.name}" has been applied.`,
    });
  };

  const handleDuplicateTemplate = (template: TradeTemplate) => {
    const duplicatedTemplate: TradeTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    saveTemplates([...templates, duplicatedTemplate]);

    toast({
      title: "Template duplicated",
      description: `Template "${template.name}" has been duplicated.`,
    });
  };

  const handleToggleFavorite = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      handleUpdateTemplate(id, { isFavorite: !template.isFavorite });
    }
  };

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.asset.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = filterTag === 'all' || template.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'recent':
          return new Date(b.lastUsed || b.updatedAt).getTime() - new Date(a.lastUsed || a.updatedAt).getTime();
        case 'favorite':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:
          return 0;
      }
    });

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  return (
    <Card className="card-modern">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Enhanced Trade Templates</span>
            </CardTitle>
            <CardDescription>
              Create, manage, and use trading templates for faster trade entry
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Trade Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for common trading setups
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      placeholder="e.g., NQ Breakout Setup"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-asset">Asset *</Label>
                    <Input
                      id="template-asset"
                      placeholder="e.g., NQ, ES, BTC"
                      value={newTemplate.asset}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, asset: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    placeholder="Brief description of this template"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Trade Type *</Label>
                    <Select value={newTemplate.tradeType} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, tradeType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-emotion">Default Emotion</Label>
                    <Select value={newTemplate.emotion} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, emotion: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="nervous">Nervous</SelectItem>
                        <SelectItem value="greedy">Greedy</SelectItem>
                        <SelectItem value="fearful">Fearful</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="excited">Excited</SelectItem>
                        <SelectItem value="frustrated">Frustrated</SelectItem>
                        <SelectItem value="satisfied">Satisfied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-entry">Entry Price</Label>
                    <Input
                      id="template-entry"
                      type="number"
                      placeholder="0.00"
                      value={newTemplate.entryPrice}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, entryPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-exit">Exit Price</Label>
                    <Input
                      id="template-exit"
                      type="number"
                      placeholder="0.00"
                      value={newTemplate.exitPrice}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, exitPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-size">Position Size</Label>
                    <Input
                      id="template-size"
                      type="number"
                      placeholder="1"
                      value={newTemplate.positionSize}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, positionSize: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-setup">Setup</Label>
                  <Input
                    id="template-setup"
                    placeholder="e.g., Breakout, Pullback, Reversal"
                    value={newTemplate.setup}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, setup: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-tags">Tags (comma-separated)</Label>
                  <Input
                    id="template-tags"
                    placeholder="e.g., breakout, momentum, scalping"
                    value={newTemplate.tags}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-notes">Default Notes</Label>
                  <Textarea
                    id="template-notes"
                    placeholder="Default notes for this template"
                    value={newTemplate.notes}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
                <SelectItem value="favorite">Favorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="card-modern">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      {template.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      <span>{template.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description || `${template.asset} ${template.tradeType}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(template.id)}
                    >
                      <Star className={`w-4 h-4 ${template.isFavorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Target className="w-3 h-3" />
                    <span>{template.setup || 'No setup'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3" />
                    <span>Used {template.usageCount} times</span>
                  </div>
                  {template.lastUsed && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleUseTemplate(template)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No templates found</p>
            <p className="text-sm">Create your first template to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
