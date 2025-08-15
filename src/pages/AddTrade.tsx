import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Heart,
  FileText,
  Upload
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config";
import { cn } from "@/lib/utils";

// Emotion selector component
const EmotionSelector = ({ 
  selectedEmotion, 
  onEmotionSelect 
}: {
  selectedEmotion: string;
  onEmotionSelect: (emotion: string) => void;
}) => {
  const emotions = [
    { value: "Confident", label: "Confident", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { value: "Calm", label: "Calm", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "Excited", label: "Excited", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { value: "Nervous", label: "Nervous", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "Fearful", label: "Fearful", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    { value: "Greedy", label: "Greedy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    { value: "Frustrated", label: "Frustrated", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  ];

  return (
    <div className="space-y-3">
      <Label>How did you feel during this trade?</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {emotions.map((emotion) => (
          <button
            key={emotion.value}
            onClick={() => onEmotionSelect(emotion.value)}
            className={cn(
              "p-3 rounded-xl border-2 transition-smooth text-sm font-medium",
              selectedEmotion === emotion.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full mx-auto mb-2", emotion.color)} />
            {emotion.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Trade type selector component
const TradeTypeSelector = ({ 
  selectedType, 
  onTypeSelect 
}: {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}) => {
  const types = [
    { value: "Long", label: "Long", icon: TrendingUp, color: "text-green-600" },
    { value: "Short", label: "Short", icon: TrendingDown, color: "text-red-600" },
    { value: "Scalp", label: "Scalp", icon: Clock, color: "text-blue-600" },
    { value: "Swing", label: "Swing", icon: Calendar, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-3">
      <Label>Trade Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => onTypeSelect(type.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-smooth text-center",
                selectedType === type.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className={cn("w-6 h-6 mx-auto mb-2", type.color)} />
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function AddTrade() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset: "",
    tradeType: "",
    entryPrice: "",
    exitPrice: "",
    positionSize: "",
    entryTime: "",
    exitTime: "",
    emotion: "",
    notes: "",
    setup: "",
    executionQuality: "",
    duration: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePnL = () => {
    const entry = parseFloat(formData.entryPrice) || 0;
    const exit = parseFloat(formData.exitPrice) || 0;
    const size = parseFloat(formData.positionSize) || 0;
    
    if (entry && exit && size) {
      const pnl = (exit - entry) * size;
      return pnl;
    }
    return 0;
  };

  const pnl = calculatePnL();
  const isProfit = pnl >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/trades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          symbol: formData.asset,
          type: formData.tradeType,
          entry_price: parseFloat(formData.entryPrice),
          exit_price: parseFloat(formData.exitPrice),
          quantity: parseFloat(formData.positionSize),
          entry_time: formData.entryTime,
          exit_time: formData.exitTime,
          pnl: pnl,
          notes: formData.notes,
          emotion: formData.emotion,
          setup: formData.setup,
          execution_quality: formData.executionQuality,
          duration: formData.duration,
        }),
      });

      if (response.ok) {
        navigate('/trades');
      } else {
        throw new Error('Failed to add trade');
      }
    } catch (error) {
      console.error('Error adding trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Trade</h1>
            <p className="text-muted-foreground">Record your latest trading activity</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Trade Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the essential details of your trade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset/Symbol</Label>
                <Input
                  id="asset"
                  placeholder="e.g., AAPL, TSLA, BTC"
                  value={formData.asset}
                  onChange={(e) => handleInputChange('asset', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <TradeTypeSelector
                  selectedType={formData.tradeType}
                  onTypeSelect={(type) => handleInputChange('tradeType', type)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className="input-modern pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitPrice">Exit Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.exitPrice}
                    onChange={(e) => handleInputChange('exitPrice', e.target.value)}
                    className="input-modern pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionSize">Position Size</Label>
                <Input
                  id="positionSize"
                  type="number"
                  placeholder="100"
                  value={formData.positionSize}
                  onChange={(e) => handleInputChange('positionSize', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>
            </div>

            {/* P&L Preview */}
            {pnl !== 0 && (
              <div className={cn(
                "p-4 rounded-xl border-2",
                isProfit 
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" 
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isProfit ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">Estimated P&L:</span>
                  </div>
                  <span className={cn(
                    "text-xl font-bold",
                    isProfit ? "text-green-600" : "text-red-600"
                  )}>
                    {isProfit ? "+" : ""}${pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timing Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timing
            </CardTitle>
            <CardDescription>
              When did you enter and exit the trade?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryTime">Entry Time</Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  value={formData.entryTime}
                  onChange={(e) => handleInputChange('entryTime', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitTime">Exit Time</Label>
                <Input
                  id="exitTime"
                  type="datetime-local"
                  value={formData.exitTime}
                  onChange={(e) => handleInputChange('exitTime', e.target.value)}
                  className="input-modern"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                                         <SelectItem value="Scalp">Scalp (&lt; 5 min)</SelectItem>
                    <SelectItem value="Day">Day Trade</SelectItem>
                    <SelectItem value="Swing">Swing (1-7 days)</SelectItem>
                                         <SelectItem value="Position">Position (&gt; 7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionQuality">Execution Quality</Label>
                <Select value={formData.executionQuality} onValueChange={(value) => handleInputChange('executionQuality', value)}>
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Rate your execution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Psychology & Analysis */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Psychology & Analysis
            </CardTitle>
            <CardDescription>
              Track your emotions and trading psychology
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <EmotionSelector
              selectedEmotion={formData.emotion}
              onEmotionSelect={(emotion) => handleInputChange('emotion', emotion)}
            />

            <div className="space-y-2">
              <Label htmlFor="setup">Setup/Strategy</Label>
              <Input
                id="setup"
                placeholder="e.g., Breakout, Pullback, Support/Resistance"
                value={formData.setup}
                onChange={(e) => handleInputChange('setup', e.target.value)}
                className="input-modern"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Observations</Label>
              <Textarea
                id="notes"
                placeholder="What went well? What could you improve? Market conditions, etc."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-modern min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="btn-apple-secondary"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="btn-apple"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Trade
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
