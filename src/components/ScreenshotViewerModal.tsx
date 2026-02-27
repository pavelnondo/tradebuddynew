/**
 * Modal to view trade screenshots in-site (no new tab)
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';

interface ScreenshotViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotUrl: string | null;
}

export function ScreenshotViewerModal({
  open,
  onOpenChange,
  screenshotUrl,
}: ScreenshotViewerModalProps) {
  const { themeConfig } = useTheme();
  const [loadError, setLoadError] = useState(false);
  const fullUrl = screenshotUrl ? getScreenshotFullUrl(screenshotUrl) : null;

  useEffect(() => {
    if (open) setLoadError(false);
  }, [open, fullUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-full max-h-[95vh] p-0 overflow-hidden"
        style={{ backgroundColor: themeConfig.bg, borderColor: themeConfig.border }}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle style={{ color: themeConfig.foreground }}>
            Trade Screenshot
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-2 overflow-auto max-h-[calc(95vh-80px)] flex items-center justify-center min-h-[300px]">
          {!fullUrl || loadError ? (
            <p style={{ color: themeConfig.mutedForeground }}>
              {loadError ? 'Screenshot could not be loaded.' : 'No screenshot available'}
            </p>
          ) : (
            <img
              src={fullUrl}
              alt="Trade screenshot"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg border"
              style={{ borderColor: themeConfig.border }}
              onError={() => setLoadError(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
