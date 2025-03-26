
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Checklist, ChecklistItem } from "@/types";
import { useChecklists } from "@/hooks/useChecklists";
import { PlusCircle, Trash2, Edit, CheckSquare, FileCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Checklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isNewChecklistOpen, setIsNewChecklistOpen] = useState(false);
  const [isEditChecklistOpen, setIsEditChecklistOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  
  const [newChecklistName, setNewChecklistName] = useState("");
  const [newChecklistDescription, setNewChecklistDescription] = useState("");
  const [newChecklistItems, setNewChecklistItems] = useState<ChecklistItem[]>([
    { id: crypto.randomUUID(), text: "" }
  ]);
  
  const navigate = useNavigate();
  const { 
    fetchChecklists, 
    createChecklist, 
    updateChecklist, 
    deleteChecklist, 
    isLoading 
  } = useChecklists();
  
  // Load checklists on component mount
  useEffect(() => {
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
    };
    
    loadChecklists();
  }, [fetchChecklists]);
  
  // Add new checklist item
  const addChecklistItem = () => {
    setNewChecklistItems([
      ...newChecklistItems,
      { id: crypto.randomUUID(), text: "" }
    ]);
  };
  
  // Remove checklist item
  const removeChecklistItem = (id: string) => {
    if (newChecklistItems.length <= 1) {
      toast({
        title: "Cannot Remove Item",
        description: "A checklist must have at least one item.",
        variant: "destructive"
      });
      return;
    }
    
    setNewChecklistItems(newChecklistItems.filter(item => item.id !== id));
  };
  
  // Update checklist item text
  const updateChecklistItemText = (id: string, text: string) => {
    setNewChecklistItems(
      newChecklistItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    );
  };
  
  // Create new checklist
  const handleCreateChecklist = async () => {
    // Validate input
    if (!newChecklistName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your checklist.",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out empty items and validate
    const validItems = newChecklistItems.filter(item => item.text.trim());
    if (validItems.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one checklist item.",
        variant: "destructive"
      });
      return;
    }
    
    const newChecklist = {
      name: newChecklistName,
      description: newChecklistDescription,
      items: validItems
    };
    
    const createdChecklist = await createChecklist(newChecklist);
    if (createdChecklist) {
      setChecklists([createdChecklist, ...checklists]);
      resetChecklistForm();
      setIsNewChecklistOpen(false);
    }
  };
  
  // Update existing checklist
  const handleUpdateChecklist = async () => {
    if (!selectedChecklist) return;
    
    // Validate input
    if (!newChecklistName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your checklist.",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out empty items and validate
    const validItems = newChecklistItems.filter(item => item.text.trim());
    if (validItems.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one checklist item.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedChecklist = await updateChecklist(selectedChecklist.id, {
      name: newChecklistName,
      description: newChecklistDescription,
      items: validItems
    });
    
    if (updatedChecklist) {
      setChecklists(
        checklists.map(cl => 
          cl.id === updatedChecklist.id ? updatedChecklist : cl
        )
      );
      resetChecklistForm();
      setIsEditChecklistOpen(false);
    }
  };
  
  // Delete checklist
  const handleDeleteChecklist = async (id: string) => {
    const success = await deleteChecklist(id);
    if (success) {
      setChecklists(checklists.filter(cl => cl.id !== id));
    }
  };
  
  // Reset checklist form
  const resetChecklistForm = () => {
    setNewChecklistName("");
    setNewChecklistDescription("");
    setNewChecklistItems([{ id: crypto.randomUUID(), text: "" }]);
    setSelectedChecklist(null);
  };
  
  // Open edit dialog
  const openEditDialog = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setNewChecklistName(checklist.name);
    setNewChecklistDescription(checklist.description || "");
    setNewChecklistItems([...checklist.items]);
    setIsEditChecklistOpen(true);
  };

  // Navigate to add trade with selected checklist
  const navigateToAddTrade = (checklistId: string) => {
    navigate('/add-trade', { state: { checklistId } });
  };
  
  // Handle dialog close
  const handleNewDialogOpenChange = (open: boolean) => {
    setIsNewChecklistOpen(open);
    if (!open) resetChecklistForm();
  };
  
  // Handle edit dialog close
  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditChecklistOpen(open);
    if (!open) resetChecklistForm();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Checklists</h1>
        <Button onClick={() => setIsNewChecklistOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Checklist
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Create and manage trading checklists to maintain consistency in your trading decisions.
        Use these checklists when adding new trades to track your discipline and strategy adherence.
      </p>
      
      {/* Checklists Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading checklists...</p>
        </div>
      ) : checklists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">You don't have any trading checklists yet.</p>
            <Button onClick={() => setIsNewChecklistOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Checklist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardHeader>
                <CardTitle>{checklist.name}</CardTitle>
                {checklist.description && (
                  <CardDescription>{checklist.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checklist.items.map((item, index) => (
                    <div key={item.id} className="flex items-start">
                      <div className="h-5 w-5 mr-2 flex items-center justify-center">
                        {index + 1}.
                      </div>
                      <div>{item.text}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(checklist)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteChecklist(checklist.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigateToAddTrade(checklist.id)}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Use for Trade
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* New Checklist Dialog */}
      <Dialog open={isNewChecklistOpen} onOpenChange={handleNewDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Trading Checklist</DialogTitle>
            <DialogDescription>
              Create a checklist to ensure you follow your trading strategy consistently.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Checklist Name</Label>
              <Input
                id="name"
                placeholder="Pre-Trade Analysis Checklist"
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Checklist for analyzing potential trades before entering a position"
                value={newChecklistDescription}
                onChange={(e) => setNewChecklistDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Checklist Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {newChecklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {index + 1}.
                    </div>
                    <Input
                      placeholder="Check support/resistance levels"
                      value={item.text}
                      onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetChecklistForm();
                setIsNewChecklistOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateChecklist}>
              <FileCheck className="h-4 w-4 mr-2" />
              Create Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Checklist Dialog */}
      <Dialog open={isEditChecklistOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Trading Checklist</DialogTitle>
            <DialogDescription>
              Update your trading checklist items or details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Checklist Name</Label>
              <Input
                id="edit-name"
                placeholder="Pre-Trade Analysis Checklist"
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Checklist for analyzing potential trades before entering a position"
                value={newChecklistDescription}
                onChange={(e) => setNewChecklistDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Checklist Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {newChecklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {index + 1}.
                    </div>
                    <Input
                      placeholder="Check support/resistance levels"
                      value={item.text}
                      onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetChecklistForm();
                setIsEditChecklistOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateChecklist}>
              <FileCheck className="h-4 w-4 mr-2" />
              Update Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
