import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  FileText, 
  Target, 
  Lightbulb,
  Calendar,
  Tag,
  Search,
  Filter,
  Star,
  StarOff,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Save,
  X
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
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entryType: 'reflection' | 'plan' | 'review' | 'lesson';
  tags: string[];
  associatedTrades: string[];
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  template?: string;
}

interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  entryType: 'reflection' | 'plan' | 'review' | 'lesson';
  prompts: string[];
  tags: string[];
}

const defaultTemplates: JournalTemplate[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    description: 'Reflect on your trading day and emotional state',
    entryType: 'reflection',
    prompts: [
      'How did I feel during today\'s trading session?',
      'What went well today?',
      'What could I have done better?',
      'What patterns did I notice in my trading?',
      'How did my emotions affect my decisions?',
      'What will I do differently tomorrow?'
    ],
    tags: ['daily', 'reflection', 'emotions']
  },
  {
    id: 'trade-review',
    name: 'Trade Review',
    description: 'Detailed analysis of a specific trade',
    entryType: 'review',
    prompts: [
      'What was the setup for this trade?',
      'Why did I enter at this price?',
      'How did the trade develop?',
      'What was my exit strategy?',
      'What did I learn from this trade?',
      'How can I improve similar trades in the future?'
    ],
    tags: ['trade-review', 'analysis', 'learning']
  },
  {
    id: 'weekly-plan',
    name: 'Weekly Planning',
    description: 'Plan your trading week and set goals',
    entryType: 'plan',
    prompts: [
      'What are my trading goals for this week?',
      'Which markets will I focus on?',
      'What setups am I looking for?',
      'How will I manage risk this week?',
      'What do I need to study or practice?',
      'How will I measure success?'
    ],
    tags: ['planning', 'goals', 'weekly']
  },
  {
    id: 'lesson-learned',
    name: 'Lesson Learned',
    description: 'Document important trading lessons',
    entryType: 'lesson',
    prompts: [
      'What lesson did I learn?',
      'How did I discover this lesson?',
      'Why is this lesson important?',
      'How will I apply this lesson going forward?',
      'What mistakes led to this lesson?',
      'How can I share this lesson with others?'
    ],
    tags: ['lesson', 'learning', 'improvement']
  }
];

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    entryType: 'reflection' as const,
    tags: [] as string[],
    associatedTrades: [] as string[]
  });

  // Get unique tags from entries
  const uniqueTags = useMemo(() => {
    const tags = new Set(entries.flatMap(entry => entry.tags));
    return Array.from(tags);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!entry.title.toLowerCase().includes(searchLower) &&
            !entry.content.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (selectedType !== 'all' && entry.entryType !== selectedType) {
        return false;
      }

      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => entry.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [entries, searchTerm, selectedType, selectedTags]);

  const handleCreateEntry = () => {
    if (!newEntry.title || !newEntry.content) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      entryType: newEntry.entryType,
      tags: newEntry.tags,
      associatedTrades: newEntry.associatedTrades,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      template: selectedTemplate || undefined
    };

    setEntries(prev => [entry, ...prev]);
    setNewEntry({
      title: '',
      content: '',
      entryType: 'reflection',
      tags: [],
      associatedTrades: []
    });
    setSelectedTemplate('');
    setShowNewEntry(false);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;

    const updatedEntry = {
      ...editingEntry,
      title: newEntry.title,
      content: newEntry.content,
      entryType: newEntry.entryType,
      tags: newEntry.tags,
      associatedTrades: newEntry.associatedTrades,
      updatedAt: new Date().toISOString()
    };

    setEntries(prev => prev.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    ));
    setEditingEntry(null);
    setNewEntry({
      title: '',
      content: '',
      entryType: 'reflection',
      tags: [],
      associatedTrades: []
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const handleToggleStar = (entryId: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, isStarred: !entry.isStarred } : entry
    ));
  };

  const handleUseTemplate = (template: JournalTemplate) => {
    setNewEntry({
      title: template.name,
      content: template.prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n\n'),
      entryType: template.entryType,
      tags: template.tags,
      associatedTrades: []
    });
    setSelectedTemplate(template.id);
    setShowTemplates(false);
    setShowNewEntry(true);
  };

  const getEntryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'reflection': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'plan': 'bg-green-500/10 text-green-500 border-green-500/20',
      'review': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'lesson': 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    };
    return colors[type] || 'bg-muted text-muted-foreground border-border';
  };

  const getEntryTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'reflection': <BookOpen className="h-4 w-4" />,
      'plan': <Target className="h-4 w-4" />,
      'review': <FileText className="h-4 w-4" />,
      'lesson': <Lightbulb className="h-4 w-4" />
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Journal Entries</h2>
          <p className="text-muted-foreground">
            Document your trading journey, insights, and lessons learned
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowNewEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="tradezella-widget">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reflection">Reflection</SelectItem>
                <SelectItem value="plan">Plan</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="lesson">Lesson</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card className="tradezella-widget">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting your trading journey with your first entry
              </p>
              <Button onClick={() => setShowNewEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="tradezella-widget">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {getEntryTypeIcon(entry.entryType)}
                        <Badge className={cn("text-xs", getEntryTypeColor(entry.entryType))}>
                          {entry.entryType}
                        </Badge>
                      </div>
                      {entry.isStarred && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                    </div>
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </span>
                      {entry.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Tag className="h-3 w-3" />
                          <span>{entry.tags.length} tags</span>
                        </span>
                      )}
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
                        setEditingEntry(entry);
                        setNewEntry({
                          title: entry.title,
                          content: entry.content,
                          entryType: entry.entryType,
                          tags: entry.tags,
                          associatedTrades: entry.associatedTrades
                        });
                        setShowNewEntry(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStar(entry.id)}>
                        {entry.isStarred ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Remove Star
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Star Entry
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {entry.content.length > 200 
                      ? `${entry.content.substring(0, 200)}...` 
                      : entry.content
                    }
                  </p>
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New/Edit Entry Dialog */}
      <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry 
                ? 'Update your journal entry' 
                : 'Document your trading insights and experiences'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter entry title..."
              />
            </div>

            <div>
              <Label htmlFor="type">Entry Type</Label>
              <Select 
                value={newEntry.entryType} 
                onValueChange={(value: any) => setNewEntry(prev => ({ ...prev, entryType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="lesson">Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your thoughts, insights, and experiences..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={newEntry.tags.join(', ')}
                onChange={(e) => setNewEntry(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="e.g., daily, reflection, emotions"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEntry(false)}>
              Cancel
            </Button>
            <Button onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}>
              <Save className="h-4 w-4 mr-2" />
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Templates</DialogTitle>
            <DialogDescription>
              Choose a template to get started with structured journaling
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    {getEntryTypeIcon(template.entryType)}
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {template.prompts.length} prompts included
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
