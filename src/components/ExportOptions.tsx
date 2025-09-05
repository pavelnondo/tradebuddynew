import React, { useState } from 'react';
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
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Calendar,
  Filter,
  Settings,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  includeCharts: boolean;
  includeAnalysis: boolean;
  includeNotes: boolean;
  includeScreenshots: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    symbols?: string[];
    emotions?: string[];
    tradeTypes?: string[];
    setupTypes?: string[];
    marketConditions?: string[];
  };
  reportType: 'summary' | 'detailed' | 'custom';
  customFields: string[];
}

interface ExportOptionsProps {
  onExport: (options: ExportOptions) => void;
  isExporting?: boolean;
  availableFields?: string[];
}

export function ExportOptions({ 
  onExport, 
  isExporting = false,
  availableFields = [
    'Date', 'Symbol', 'Trade Type', 'Entry Price', 'Exit Price', 
    'Position Size', 'P&L', 'Duration', 'Emotion', 'Confidence Level',
    'Setup Type', 'Market Condition', 'Notes', 'Tags', 'Screenshots'
  ]
}: ExportOptionsProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    includeAnalysis: true,
    includeNotes: true,
    includeScreenshots: false,
    dateRange: {
      start: '',
      end: '',
    },
    filters: {},
    reportType: 'summary',
    customFields: ['Date', 'Symbol', 'Trade Type', 'P&L', 'Notes'],
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    if (!options.dateRange.start || !options.dateRange.end) {
      toast({
        title: "Date Range Required",
        description: "Please select start and end dates for the export",
        variant: "destructive",
      });
      return;
    }

    onExport(options);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv': return 'Comma-separated values for spreadsheet applications';
      case 'pdf': return 'Portable Document Format with charts and analysis';
      case 'excel': return 'Microsoft Excel format with multiple sheets';
      default: return '';
    }
  };

  const toggleCustomField = (field: string) => {
    setOptions({
      ...options,
      customFields: options.customFields.includes(field)
        ? options.customFields.filter(f => f !== field)
        : [...options.customFields, field]
    });
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Options
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
        <CardDescription>
          Export your trading data in various formats with custom options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['csv', 'pdf', 'excel'] as const).map((format) => (
              <div
                key={format}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  options.format === format
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setOptions({ ...options, format })}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {getFormatIcon(format)}
                  <span className="font-medium capitalize">{format}</span>
                  {options.format === format && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getFormatDescription(format)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-start-date" className="text-sm">Start Date</Label>
              <input
                id="export-start-date"
                type="date"
                value={options.dateRange.start}
                onChange={(e) => setOptions({
                  ...options,
                  dateRange: { ...options.dateRange, start: e.target.value }
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <Label htmlFor="export-end-date" className="text-sm">End Date</Label>
              <input
                id="export-end-date"
                type="date"
                value={options.dateRange.end}
                onChange={(e) => setOptions({
                  ...options,
                  dateRange: { ...options.dateRange, end: e.target.value }
                })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
          </div>
        </div>

        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select
            value={options.reportType}
            onValueChange={(value: 'summary' | 'detailed' | 'custom') => 
              setOptions({ ...options, reportType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary Report</SelectItem>
              <SelectItem value="detailed">Detailed Report</SelectItem>
              <SelectItem value="custom">Custom Fields</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <Label>Include in Export</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-charts"
                checked={options.includeCharts}
                onChange={(e) => setOptions({ ...options, includeCharts: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="include-charts" className="text-sm">Charts & Visualizations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-analysis"
                checked={options.includeAnalysis}
                onChange={(e) => setOptions({ ...options, includeAnalysis: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="include-analysis" className="text-sm">Performance Analysis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-notes"
                checked={options.includeNotes}
                onChange={(e) => setOptions({ ...options, includeNotes: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="include-notes" className="text-sm">Trade Notes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-screenshots"
                checked={options.includeScreenshots}
                onChange={(e) => setOptions({ ...options, includeScreenshots: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="include-screenshots" className="text-sm">Screenshots</Label>
            </div>
          </div>
        </div>

        {/* Custom Fields Selection */}
        {options.reportType === 'custom' && (
          <div className="space-y-2">
            <Label>Select Fields to Include</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id={`field-${field}`}
                    checked={options.customFields.includes(field)}
                    onChange={() => toggleCustomField(field)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`field-${field}`} className="text-sm">
                    {field}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={isExporting || !options.dateRange.start || !options.dateRange.end}
            className="min-w-32"
          >
            {isExporting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {options.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        {/* Export Preview */}
        {options.dateRange.start && options.dateRange.end && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>Export Preview:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Format: {options.format.toUpperCase()}</li>
                <li>• Date Range: {options.dateRange.start} to {options.dateRange.end}</li>
                <li>• Report Type: {options.reportType}</li>
                {options.includeCharts && <li>• Includes charts and visualizations</li>}
                {options.includeAnalysis && <li>• Includes performance analysis</li>}
                {options.includeNotes && <li>• Includes trade notes</li>}
                {options.includeScreenshots && <li>• Includes screenshots</li>}
                {options.reportType === 'custom' && (
                  <li>• Custom fields: {options.customFields.join(', ')}</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
