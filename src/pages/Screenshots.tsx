
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Filter, Search, Tag, Trash } from "lucide-react";
import { useEffect, useState } from "react";

interface Screenshot {
  id: string;
  title: string;
  asset: string;
  date: string;
  tags: string[];
  url: string;
}

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  
  // Load screenshots from localStorage on component mount
  useEffect(() => {
    const storedScreenshots = localStorage.getItem('screenshots');
    if (storedScreenshots) {
      setScreenshots(JSON.parse(storedScreenshots));
    }
  }, []);
  
  // Get unique assets and tags for filters
  const uniqueAssets = [...new Set(screenshots.map((ss) => ss.asset))];
  const uniqueTags = [...new Set(screenshots.flatMap((ss) => ss.tags))];
  
  // Apply filters to screenshots
  const filteredScreenshots = screenshots.filter((ss) => {
    // Search term filter
    if (
      searchTerm &&
      !ss.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ss.asset.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    // Asset filter
    if (assetFilter !== "all" && ss.asset !== assetFilter) {
      return false;
    }
    
    // Tag filter
    if (tagFilter !== "all" && !ss.tags.includes(tagFilter)) {
      return false;
    }
    
    return true;
  });
  
  // View screenshot details
  const viewScreenshot = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
  };

  // Delete screenshot
  const deleteScreenshot = (id: string) => {
    const updatedScreenshots = screenshots.filter(screenshot => screenshot.id !== id);
    setScreenshots(updatedScreenshots);
    localStorage.setItem('screenshots', JSON.stringify(updatedScreenshots));
    
    // If deleting the currently selected screenshot, close the dialog
    if (selectedScreenshot && selectedScreenshot.id === id) {
      setSelectedScreenshot(null);
    }
    
    toast({
      title: "Screenshot Deleted",
      description: "The screenshot has been permanently removed.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Screenshots Gallery</h1>
        <Button>Upload New</Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search screenshots..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {uniqueAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {uniqueTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Screenshots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScreenshots.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No screenshots found. Try adjusting your filters.</p>
          </div>
        ) : (
          filteredScreenshots.map((screenshot) => (
            <Card key={screenshot.id} className="overflow-hidden">
              <div
                className="aspect-video bg-cover bg-center cursor-pointer"
                style={{ backgroundImage: `url(${screenshot.url})` }}
                onClick={() => viewScreenshot(screenshot)}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{screenshot.title}</CardTitle>
                <CardDescription>
                  {screenshot.asset} • {new Date(screenshot.date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1">
                  {screenshot.tags.map((tag) => (
                    <div
                      key={tag}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs flex items-center"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => viewScreenshot(screenshot)}>
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => deleteScreenshot(screenshot.id)}
                >
                  <Trash className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Screenshot Details Dialog */}
      {selectedScreenshot && (
        <Dialog open={!!selectedScreenshot} onOpenChange={(open) => !open && setSelectedScreenshot(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedScreenshot.title}</DialogTitle>
              <DialogDescription>
                {selectedScreenshot.asset} • {new Date(selectedScreenshot.date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <img
                src={selectedScreenshot.url}
                alt={selectedScreenshot.title}
                className="w-full rounded-md"
              />
              <div>
                <h3 className="text-sm font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedScreenshot.tags.map((tag) => (
                    <div
                      key={tag}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs flex items-center"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => deleteScreenshot(selectedScreenshot.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Screenshot
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
