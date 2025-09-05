import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TradeSuggestion {
  id: string;
  type: 'entry' | 'exit' | 'risk_management' | 'psychology';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  action?: string;
  symbol?: string;
  price?: number;
  timestamp: Date;
  isApplied: boolean;
  isDismissed: boolean;
}

interface SmartSuggestionsProps {
  currentTrade?: {
    symbol: string;
    tradeType: 'Buy' | 'Sell';
    entryPrice: number;
    exitPrice?: number;
    positionSize: number;
    emotion: string;
    confidenceLevel: number;
    setupType: string;
    marketCondition: string;
  };
  recentTrades: any[];
  onApplySuggestion: (suggestion: TradeSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
}

export function SmartSuggestions({ 
  currentTrade, 
  recentTrades, 
  onApplySuggestion, 
  onDismissSuggestion 
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TradeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const { toast } = useToast();

  // Generate smart suggestions based on current trade and recent performance
  const generateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newSuggestions: TradeSuggestion[] = [];
      
      // Analyze recent performance
      const recentPerformance = analyzeRecentPerformance(recentTrades);
      
      // Generate suggestions based on analysis
      if (recentPerformance.winRate < 50) {
        newSuggestions.push({
          id: 'suggestion-1',
          type: 'psychology',
          priority: 'high',
          title: 'Consider Taking a Break',
          description: 'Your recent win rate is below 50%. Consider taking a break to reset your mindset.',
          reasoning: `Recent win rate: ${recentPerformance.winRate.toFixed(1)}%. Taking breaks can help improve decision-making.`,
          confidence: 85,
          timestamp: new Date(),
          isApplied: false,
          isDismissed: false,
        });
      }
      
      if (recentPerformance.avgLoss > recentPerformance.avgWin * 1.5) {
        newSuggestions.push({
          id: 'suggestion-2',
          type: 'risk_management',
          priority: 'high',
          title: 'Review Risk Management',
          description: 'Your average losses are significantly larger than wins. Consider tighter stop losses.',
          reasoning: `Avg loss: $${recentPerformance.avgLoss.toFixed(2)} vs Avg win: $${recentPerformance.avgWin.toFixed(2)}`,
          confidence: 90,
          timestamp: new Date(),
          isApplied: false,
          isDismissed: false,
        });
      }
      
      // Time-based suggestions
      const currentHour = new Date().getHours();
      if (currentHour >= 9 && currentHour <= 11) {
        newSuggestions.push({
          id: 'suggestion-3',
          type: 'entry',
          priority: 'medium',
          title: 'High Volume Trading Hours',
          description: 'You\'re trading during high volume hours. Consider larger position sizes for better liquidity.',
          reasoning: 'Market open hours typically have higher volume and better price action.',
          confidence: 75,
          timestamp: new Date(),
          isApplied: false,
          isDismissed: false,
        });
      }
      
      // Emotion-based suggestions
      if (currentTrade?.emotion === 'Fearful' || currentTrade?.emotion === 'Nervous') {
        newSuggestions.push({
          id: 'suggestion-4',
          type: 'psychology',
          priority: 'high',
          title: 'Emotional Trading Alert',
          description: 'You\'re feeling fearful/nervous. Consider reducing position size or waiting for better setup.',
          reasoning: 'Trading with fear can lead to poor decisions and emotional exits.',
          confidence: 80,
          timestamp: new Date(),
          isApplied: false,
          isDismissed: false,
        });
      }
      
      // Setup-based suggestions
      if (currentTrade?.setupType) {
        const setupPerformance = getSetupPerformance(currentTrade.setupType, recentTrades);
        if (setupPerformance.winRate > 70) {
          newSuggestions.push({
            id: 'suggestion-5',
            type: 'entry',
            priority: 'medium',
            title: 'Strong Setup Performance',
            description: `Your ${currentTrade.setupType} setup has a ${setupPerformance.winRate.toFixed(1)}% win rate recently.`,
            reasoning: `This setup has been performing well with ${setupPerformance.totalTrades} recent trades.`,
            confidence: 70,
            timestamp: new Date(),
            isApplied: false,
            isDismissed: false,
          });
        }
      }
      
      // Market condition suggestions
      if (currentTrade?.marketCondition === 'volatile') {
        newSuggestions.push({
          id: 'suggestion-6',
          type: 'risk_management',
          priority: 'high',
          title: 'Volatile Market Conditions',
          description: 'Market is volatile. Consider wider stop losses and smaller position sizes.',
          reasoning: 'Volatile markets can have larger price swings and false breakouts.',
          confidence: 85,
          timestamp: new Date(),
          isApplied: false,
          isDismissed: false,
        });
      }
      
      setSuggestions(newSuggestions);
      
      toast({
        title: "Smart Suggestions Generated",
        description: `${newSuggestions.length} new suggestions based on your trading patterns`,
      });
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate smart suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeRecentPerformance = (trades: any[]) => {
    const recentTrades = trades.slice(0, 10); // Last 10 trades
    const wins = recentTrades.filter(t => (t.profitLoss || 0) > 0);
    const losses = recentTrades.filter(t => (t.profitLoss || 0) < 0);
    
    return {
      winRate: recentTrades.length > 0 ? (wins.length / recentTrades.length) * 100 : 0,
      avgWin: wins.length > 0 ? wins.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losses.length) : 0,
      totalTrades: recentTrades.length,
    };
  };

  const getSetupPerformance = (setupType: string, trades: any[]) => {
    const setupTrades = trades.filter(t => t.setupType === setupType).slice(0, 10);
    const wins = setupTrades.filter(t => (t.profitLoss || 0) > 0);
    
    return {
      winRate: setupTrades.length > 0 ? (wins.length / setupTrades.length) * 100 : 0,
      totalTrades: setupTrades.length,
    };
  };

  const handleApplySuggestion = (suggestion: TradeSuggestion) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestion.id ? { ...s, isApplied: true } : s
    ));
    onApplySuggestion(suggestion);
    
    toast({
      title: "Suggestion Applied",
      description: suggestion.title,
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, isDismissed: true } : s
    ));
    onDismissSuggestion(suggestionId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entry': return <TrendingUp className="w-4 h-4" />;
      case 'exit': return <TrendingDown className="w-4 h-4" />;
      case 'risk_management': return <Target className="w-4 h-4" />;
      case 'psychology': return <Brain className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entry': return 'text-green-600';
      case 'exit': return 'text-red-600';
      case 'risk_management': return 'text-orange-600';
      case 'psychology': return 'text-purple-600';
      default: return 'text-blue-600';
    }
  };

  // Auto-generate suggestions when component mounts or current trade changes
  useEffect(() => {
    if (recentTrades.length > 0) {
      generateSuggestions();
    }
  }, [currentTrade, recentTrades.length]);

  const activeSuggestions = suggestions.filter(s => !s.isDismissed);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Smart Suggestions
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered insights based on your trading patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="1w">1 Week</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={generateSuggestions} 
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions List */}
      {activeSuggestions.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Suggestions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate smart suggestions based on your trading patterns
            </p>
            <Button onClick={generateSuggestions} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`${getTypeColor(suggestion.type)}`}>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <Badge variant={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                      <Badge variant="outline">
                        {suggestion.confidence}% confidence
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      <strong>Reasoning:</strong> {suggestion.reasoning}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {suggestion.isApplied ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Applied
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={suggestion.isApplied}
                      >
                        Apply
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissSuggestion(suggestion.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      {recentTrades.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-base">Recent Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {analyzeRecentPerformance(recentTrades).winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${analyzeRecentPerformance(recentTrades).avgWin.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Win</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  ${analyzeRecentPerformance(recentTrades).avgLoss.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Loss</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {analyzeRecentPerformance(recentTrades).totalTrades}
                </div>
                <div className="text-xs text-muted-foreground">Recent Trades</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
