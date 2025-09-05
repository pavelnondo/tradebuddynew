import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar,
  Clock,
  TrendingUp,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  RotateCcw
} from "lucide-react";

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
  type: 'preset' | 'custom' | 'relative';
}

interface CustomTimeRangeProps {
  onTimeRangeChange: (timeRange: TimeRange) => void;
  currentTimeRange?: TimeRange;
  presets?: Array<{
    label: string;
    days: number;
    type: 'preset';
  }>;
}

export function CustomTimeRange({ 
  onTimeRangeChange, 
  currentTimeRange,
  presets = [
    { label: 'Today', days: 0, type: 'preset' as const },
    { label: 'Yesterday', days: -1, type: 'preset' as const },
    { label: 'Last 7 Days', days: -7, type: 'preset' as const },
    { label: 'Last 30 Days', days: -30, type: 'preset' as const },
    { label: 'Last 90 Days', days: -90, type: 'preset' as const },
    { label: 'This Month', days: -30, type: 'preset' as const },
    { label: 'Last Month', days: -60, type: 'preset' as const },
    { label: 'This Year', days: -365, type: 'preset' as const },
  ]
}: CustomTimeRangeProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [relativeValue, setRelativeValue] = useState<number>(7);
  const [relativeUnit, setRelativeUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');

  const getPresetTimeRange = (preset: typeof presets[0]): TimeRange => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    if (preset.days === 0) {
      // Today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset.days === -1) {
      // Yesterday
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (preset.label === 'This Month') {
      // This month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset.label === 'Last Month') {
      // Last month
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
    } else if (preset.label === 'This Year') {
      // This year
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Relative days
      start.setDate(now.getDate() + preset.days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start,
      end,
      label: preset.label,
      type: 'preset',
    };
  };

  const getCustomTimeRange = (): TimeRange => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    
    return {
      start,
      end,
      label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      type: 'custom',
    };
  };

  const getRelativeTimeRange = (): TimeRange => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (relativeUnit) {
      case 'days':
        start.setDate(now.getDate() - relativeValue);
        break;
      case 'weeks':
        start.setDate(now.getDate() - (relativeValue * 7));
        break;
      case 'months':
        start.setMonth(now.getMonth() - relativeValue);
        break;
      case 'years':
        start.setFullYear(now.getFullYear() - relativeValue);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      label: `Last ${relativeValue} ${relativeUnit}`,
      type: 'relative',
    };
  };

  const handlePresetSelect = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    const preset = presets.find(p => p.label === presetLabel);
    if (preset) {
      const timeRange = getPresetTimeRange(preset);
      onTimeRangeChange(timeRange);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const timeRange = getCustomTimeRange();
      onTimeRangeChange(timeRange);
    }
  };

  const handleRelativeApply = () => {
    const timeRange = getRelativeTimeRange();
    onTimeRangeChange(timeRange);
  };

  const navigateTimeRange = (direction: 'prev' | 'next') => {
    if (!currentTimeRange) return;

    const duration = currentTimeRange.end.getTime() - currentTimeRange.start.getTime();
    const newStart = new Date(currentTimeRange.start);
    const newEnd = new Date(currentTimeRange.end);

    if (direction === 'prev') {
      newStart.setTime(newStart.getTime() - duration);
      newEnd.setTime(newEnd.getTime() - duration);
    } else {
      newStart.setTime(newStart.getTime() + duration);
      newEnd.setTime(newEnd.getTime() + duration);
    }

    const newTimeRange: TimeRange = {
      start: newStart,
      end: newEnd,
      label: `${newStart.toLocaleDateString()} - ${newEnd.toLocaleDateString()}`,
      type: 'custom',
    };

    onTimeRangeChange(newTimeRange);
  };

  const formatTimeRange = (timeRange: TimeRange) => {
    return `${timeRange.start.toLocaleDateString()} - ${timeRange.end.toLocaleDateString()}`;
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Custom Time Range
        </CardTitle>
        <CardDescription>
          Select a custom time range for your analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Time Range Display */}
        {currentTimeRange && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Range</p>
                <p className="text-lg font-bold">{currentTimeRange.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeRange(currentTimeRange)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateTimeRange('prev')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateTimeRange('next')}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preset Time Ranges */}
        <div className="space-y-3">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant={selectedPreset === preset.label ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(preset.label)}
                className="justify-start"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-3">
          <Label>Custom Date Range</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-start" className="text-sm">Start Date</Label>
              <Input
                id="custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="custom-end" className="text-sm">End Date</Label>
              <Input
                id="custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Apply Custom Range
          </Button>
        </div>

        {/* Relative Time Range */}
        <div className="space-y-3">
          <Label>Relative Time Range</Label>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Last</span>
            <Input
              type="number"
              value={relativeValue}
              onChange={(e) => setRelativeValue(parseInt(e.target.value) || 1)}
              className="w-20"
              min="1"
            />
            <Select
              value={relativeUnit}
              onValueChange={(value: 'days' | 'weeks' | 'months' | 'years') => 
                setRelativeUnit(value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRelativeApply} size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Time Range Info */}
        {currentTimeRange && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200">
                Duration: {Math.ceil((currentTimeRange.end.getTime() - currentTimeRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
