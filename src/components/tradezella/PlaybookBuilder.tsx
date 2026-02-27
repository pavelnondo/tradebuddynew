import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  Share, 
  Download,
  Upload,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Image,
  FileText,
  Tag,
  Settings,
  Copy,
  Star,
  StarOff,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Square
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PlaybookSetup {
  id: string;
  name: string;
  description: string;
  rules: string;
  imageUrl?: string;
  tags: string[];
  exampleTradeId?: string;
  successRate: number;
  avgReturn: number;
  totalTrades: number;
  createdAt: string;
  updatedAt: string;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  setups: PlaybookSetup[];
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  authorId: string;
}

interface PlaybookBuilderProps {
  playbooks: Playbook[];
  onSavePlaybook?: (playbook: Playbook) => void;
  onDeletePlaybook?: (playbookId: string) => void;
  onSharePlaybook?: (playbookId: string) => void;
}

export function PlaybookBuilder({ 
  playbooks, 
  onSavePlaybook, 
  onDeletePlaybook,
  onSharePlaybook 
}: PlaybookBuilderProps) {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showNewPlaybook, setShowNewPlaybook] = useState(false);
  const [showNewSetup, setShowNewSetup] = useState(false);
  const [editingSetup, setEditingSetup] = useState<PlaybookSetup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  const [newSetup, setNewSetup] = useState({
    name: '',
    description: '',
    rules: '',
    imageUrl: '',
    tags: [] as string[]
  });

  // Get unique tags from all playbooks
  const uniqueTags = useMemo(() => {
    const tags = new Set(playbooks.flatMap(playbook => 
      playbook.setups.flatMap(setup => setup.tags)
    ));
    return Array.from(tags);
  }, [playbooks]);

  // Filter playbooks
  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(playbook => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!playbook.name.toLowerCase().includes(searchLower) &&
            !playbook.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => 
          playbook.setups.some(setup => setup.tags.includes(tag))
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [playbooks, searchTerm, selectedTags]);

  const handleCreatePlaybook = () => {
    if (!newPlaybook.name) return;

    const playbook: Playbook = {
      id: Date.now().toString(),
      name: newPlaybook.name,
      description: newPlaybook.description,
      isPublic: newPlaybook.isPublic,
      setups: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      authorId: 'current-user'
    };

    onSavePlaybook?.(playbook);
    setNewPlaybook({ name: '', description: '', isPublic: false });
    setShowNewPlaybook(false);
    setSelectedPlaybook(playbook);
  };

  const handleCreateSetup = () => {
    if (!newSetup.name || !selectedPlaybook) return;

    const setup: PlaybookSetup = {
      id: Date.now().toString(),
      name: newSetup.name,
      description: newSetup.description,
      rules: newSetup.rules,
      imageUrl: newSetup.imageUrl || undefined,
      tags: newSetup.tags,
      successRate: 0,
      avgReturn: 0,
      totalTrades: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPlaybook = {
      ...selectedPlaybook,
      setups: [...selectedPlaybook.setups, setup],
      updatedAt: new Date().toISOString()
    };

    onSavePlaybook?.(updatedPlaybook);
    setSelectedPlaybook(updatedPlaybook);
    setNewSetup({ name: '', description: '', rules: '', imageUrl: '', tags: [] });
    setShowNewSetup(false);
  };

  const handleUpdateSetup = () => {
    if (!editingSetup || !selectedPlaybook) return;

    const updatedSetup = {
      ...editingSetup,
      name: newSetup.name,
      description: newSetup.description,
      rules: newSetup.rules,
      imageUrl: newSetup.imageUrl || undefined,
      tags: newSetup.tags,
      updatedAt: new Date().toISOString()
    };

    const updatedPlaybook = {
      ...selectedPlaybook,
      setups: selectedPlaybook.setups.map(setup => 
        setup.id === editingSetup.id ? updatedSetup : setup
      ),
      updatedAt: new Date().toISOString()
    };

    onSavePlaybook?.(updatedPlaybook);
    setSelectedPlaybook(updatedPlaybook);
    setEditingSetup(null);
    setNewSetup({ name: '', description: '', rules: '', imageUrl: '', tags: [] });
  };

  const handleDeleteSetup = (setupId: string) => {
    if (!selectedPlaybook) return;

    const updatedPlaybook = {
      ...selectedPlaybook,
      setups: selectedPlaybook.setups.filter(setup => setup.id !== setupId),
      updatedAt: new Date().toISOString()
    };

    onSavePlaybook?.(updatedPlaybook);
    setSelectedPlaybook(updatedPlaybook);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-500';
    if (rate >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getReturnColor = (returnValue: number) => {
    if (returnValue > 0) return 'text-green-500';
    if (returnValue < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Playbook Builder</h2>
          <p className="text-muted-foreground">
            Create and manage your trading setup playbooks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button onClick={() => setShowNewPlaybook(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Playbook
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="tradezella-widget">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search playbooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTags[0] || 'all'} onValueChange={(value) => 
              setSelectedTags(value === 'all' ? [] : [value])
            }>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playbooks List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold">Your Playbooks</h3>
          <div className="space-y-3">
            {filteredPlaybooks.map((playbook) => (
              <Card 
                key={playbook.id} 
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedPlaybook?.id === playbook.id 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedPlaybook(playbook)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{playbook.name}</h4>
                        {playbook.isStarred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                        {playbook.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {playbook.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{playbook.setups.length} setups</span>
                        <span>{new Date(playbook.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSharePlaybook?.(playbook.id)}>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeletePlaybook?.(playbook.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Playbook Details */}
        <div className="lg:col-span-2">
          {selectedPlaybook ? (
            <div className="space-y-6">
              {/* Playbook Header */}
              <Card className="tradezella-widget">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>{selectedPlaybook.name}</span>
                        {selectedPlaybook.isPublic && <Badge variant="secondary">Public</Badge>}
                      </CardTitle>
                      <CardDescription>{selectedPlaybook.description}</CardDescription>
                    </div>
                    <Button onClick={() => setShowNewSetup(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Setup
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Setups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Setups ({selectedPlaybook.setups.length})</h3>
                {selectedPlaybook.setups.length === 0 ? (
                  <Card className="tradezella-widget">
                    <CardContent className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No setups yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first trading setup to this playbook
                      </p>
                      <Button onClick={() => setShowNewSetup(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Setup
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  selectedPlaybook.setups.map((setup) => (
                    <Card key={setup.id} className="tradezella-widget">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{setup.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {setup.description}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingSetup(setup);
                                setNewSetup({
                                  name: setup.name,
                                  description: setup.description,
                                  rules: setup.rules,
                                  imageUrl: setup.imageUrl || '',
                                  tags: setup.tags
                                });
                                setShowNewSetup(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSetup(setup.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Setup Rules */}
                        <div>
                          <Label className="text-sm font-medium">Rules</Label>
                          <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{setup.rules}</p>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className={cn("text-lg font-semibold", getSuccessRateColor(setup.successRate))}>
                              {setup.successRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Success Rate</div>
                          </div>
                          <div className="text-center">
                            <div className={cn("text-lg font-semibold", getReturnColor(setup.avgReturn))}>
                              {setup.avgReturn > 0 ? '+' : ''}{setup.avgReturn.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Return</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">
                              {setup.totalTrades}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Trades</div>
                          </div>
                        </div>

                        {/* Tags */}
                        {setup.tags.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Tags</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {setup.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chart Placeholder */}
                        {setup.imageUrl && (
                          <div>
                            <Label className="text-sm font-medium">Chart</Label>
                            <div className="mt-1 h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                              <div className="text-center text-muted-foreground">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Setup chart</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Card className="tradezella-widget">
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Playbook</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a playbook from the list to view and edit its setups
                </p>
                <Button onClick={() => setShowNewPlaybook(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Playbook
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Playbook Dialog */}
      <Dialog open={showNewPlaybook} onOpenChange={setShowNewPlaybook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playbook</DialogTitle>
            <DialogDescription>
              Create a new trading playbook to organize your setups
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="playbook-name">Name</Label>
              <Input
                id="playbook-name"
                value={newPlaybook.name}
                onChange={(e) => setNewPlaybook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter playbook name..."
              />
            </div>

            <div>
              <Label htmlFor="playbook-description">Description</Label>
              <Textarea
                id="playbook-description"
                value={newPlaybook.description}
                onChange={(e) => setNewPlaybook(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this playbook..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={newPlaybook.isPublic}
                onCheckedChange={(checked) => setNewPlaybook(prev => ({ ...prev, isPublic: checked as boolean }))}
              />
              <Label htmlFor="is-public">Make this playbook public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPlaybook(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlaybook}>
              <Save className="h-4 w-4 mr-2" />
              Create Playbook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New/Edit Setup Dialog */}
      <Dialog open={showNewSetup} onOpenChange={setShowNewSetup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSetup ? 'Edit Setup' : 'Add New Setup'}
            </DialogTitle>
            <DialogDescription>
              {editingSetup 
                ? 'Update the trading setup details' 
                : 'Define a new trading setup for this playbook'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="setup-name">Setup Name</Label>
              <Input
                id="setup-name"
                value={newSetup.name}
                onChange={(e) => setNewSetup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bull Flag Breakout"
              />
            </div>

            <div>
              <Label htmlFor="setup-description">Description</Label>
              <Textarea
                id="setup-description"
                value={newSetup.description}
                onChange={(e) => setNewSetup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this setup..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="setup-rules">Trading Rules</Label>
              <Textarea
                id="setup-rules"
                value={newSetup.rules}
                onChange={(e) => setNewSetup(prev => ({ ...prev, rules: e.target.value }))}
                placeholder="Define the specific rules for this setup..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="setup-image">Chart Image URL (optional)</Label>
              <Input
                id="setup-image"
                value={newSetup.imageUrl}
                onChange={(e) => setNewSetup(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/chart.png"
              />
            </div>

            <div>
              <Label htmlFor="setup-tags">Tags (comma-separated)</Label>
              <Input
                id="setup-tags"
                value={newSetup.tags.join(', ')}
                onChange={(e) => setNewSetup(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="e.g., breakout, momentum, tech"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSetup(false)}>
              Cancel
            </Button>
            <Button onClick={editingSetup ? handleUpdateSetup : handleCreateSetup}>
              <Save className="h-4 w-4 mr-2" />
              {editingSetup ? 'Update Setup' : 'Add Setup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
