import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Share
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface TradeReplayData {
  id: string;
  asset: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  direction: 'long' | 'short';
  setup: string;
  notes: string;
  priceData: Array<{
    timestamp: string;
    price: number;
    volume: number;
    indicators?: {
      sma20?: number;
      sma50?: number;
      rsi?: number;
      macd?: number;
    };
  }>;
  events: Array<{
    timestamp: string;
    type: 'entry' | 'exit' | 'stop_loss' | 'take_profit' | 'note';
    price?: number;
    description: string;
  }>;
}

interface TradeReplayProps {
  tradeData: TradeReplayData;
  onClose?: () => void;
}

export function TradeReplay({ tradeData, onClose }: TradeReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const totalDuration = tradeData.priceData.length;
  const currentPrice = tradeData.priceData[currentTime]?.price || tradeData.entryPrice;
  const currentVolume = tradeData.priceData[currentTime]?.volume || 0;
  const currentIndicators = tradeData.priceData[currentTime]?.indicators;

  // Calculate trade metrics
  const tradePnL = tradeData.direction === 'long' 
    ? (tradeData.exitPrice - tradeData.entryPrice) * tradeData.positionSize
    : (tradeData.entryPrice - tradeData.exitPrice) * tradeData.positionSize;
  
  const isProfit = tradePnL > 0;
  const returnPercentage = ((tradeData.exitPrice - tradeData.entryPrice) / tradeData.entryPrice) * 100;

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }
        
        const elapsed = (timestamp - startTimeRef.current) * playbackSpeed;
        const newTime = Math.min(pausedTimeRef.current + elapsed, totalDuration - 1);
        
        setCurrentTime(Math.floor(newTime));
        
        if (newTime < totalDuration - 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
          setCurrentTime(totalDuration - 1);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pausedTimeRef.current = currentTime;
      setIsPlaying(false);
    } else {
      startTimeRef.current = 0;
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    startTimeRef.current = 0;
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    startTimeRef.current = 0;
  };

  const handleSkipForward = () => {
    const newTime = Math.min(totalDuration - 1, currentTime + 10);
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    startTimeRef.current = 0;
  };

  const handleReset = () => {
    handleStop();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentEvents = () => {
    return tradeData.events.filter(event => {
      const eventTime = tradeData.priceData.findIndex(data => data.timestamp >= event.timestamp);
      return eventTime <= currentTime;
    });
  };

  const getUpcomingEvents = () => {
    return tradeData.events.filter(event => {
      const eventTime = tradeData.priceData.findIndex(data => data.timestamp >= event.timestamp);
      return eventTime > currentTime;
    });
  };

  return (
    <div className={cn(
      "space-y-6",
      isFullscreen && "fixed inset-0 z-50 bg-background p-6 overflow-auto"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trade Replay</h2>
          <p className="text-muted-foreground">
            {tradeData.asset} • {tradeData.direction} • {tradeData.setup}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price Chart */}
          <Card className="tradezella-widget">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Price Action</span>
                  </CardTitle>
                  <CardDescription>
                    Current: ${currentPrice.toFixed(2)} • Volume: {currentVolume.toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isProfit ? "default" : "destructive"}>
                    {isProfit ? '+' : ''}${tradePnL.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    {returnPercentage.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Interactive Price Chart</p>
                  <p className="text-sm">Chart visualization with replay timeline</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span>Entry: ${tradeData.entryPrice.toFixed(2)}</span>
                      <span>Exit: ${tradeData.exitPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span>Position: {tradeData.positionSize}</span>
                      <span>Direction: {tradeData.direction}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          {showIndicators && currentIndicators && (
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm">Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">SMA 20</div>
                    <div className="text-lg font-semibold">
                      {currentIndicators.sma20?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">SMA 50</div>
                    <div className="text-lg font-semibold">
                      {currentIndicators.sma50?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">RSI</div>
                    <div className="text-lg font-semibold">
                      {currentIndicators.rsi?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">MACD</div>
                    <div className="text-lg font-semibold">
                      {currentIndicators.macd?.toFixed(3) || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Playback Controls */}
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="text-sm">Playback Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={totalDuration - 1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSkipBack}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  variant={isPlaying ? "default" : "outline"} 
                  size="sm" 
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={handleStop}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSkipForward}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Speed Control */}
              <div className="space-y-2">
                <Label className="text-sm">Playback Speed</Label>
                <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Volume Control */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Volume</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trade Events */}
          {showEvents && (
            <Card className="tradezella-widget">
              <CardHeader>
                <CardTitle className="text-sm">Trade Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Completed Events */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Completed</h4>
                  <div className="space-y-2">
                    {getCurrentEvents().map((event, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          event.type === 'entry' ? "bg-green-500" :
                          event.type === 'exit' ? "bg-red-500" :
                          event.type === 'stop_loss' ? "bg-orange-500" :
                          event.type === 'take_profit' ? "bg-blue-500" :
                          "bg-gray-500"
                        )} />
                        <span className="flex-1">{event.description}</span>
                        {event.price && (
                          <span className="text-muted-foreground">${event.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events */}
                {getUpcomingEvents().length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Upcoming</h4>
                    <div className="space-y-2">
                      {getUpcomingEvents().slice(0, 3).map((event, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm opacity-60">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="flex-1">{event.description}</span>
                          {event.price && (
                            <span className="text-muted-foreground">${event.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trade Notes */}
          <Card className="tradezella-widget">
            <CardHeader>
              <CardTitle className="text-sm">Trade Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {tradeData.notes || 'No notes available for this trade.'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replay Settings</DialogTitle>
            <DialogDescription>
              Customize your trade replay experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-indicators">Show Technical Indicators</Label>
              <Switch
                id="show-indicators"
                checked={showIndicators}
                onCheckedChange={setShowIndicators}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-volume">Show Volume</Label>
              <Switch
                id="show-volume"
                checked={showVolume}
                onCheckedChange={setShowVolume}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-events">Show Trade Events</Label>
              <Switch
                id="show-events"
                checked={showEvents}
                onCheckedChange={setShowEvents}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
