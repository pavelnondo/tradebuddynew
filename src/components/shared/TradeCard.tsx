/**
 * Reusable TradeCard component
 * Displays a trade with all key information
 */

import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Trade, Emotion } from '@/types/trade';
import { formatCurrency, formatPercent, formatDate, formatDuration, formatPnL, stripVoiceNotePlaceholders } from '@/utils/formatting';
import { EmotionTag } from './EmotionTag';
import { getEmotionsForTrade } from '@/utils/tradeUtils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Edit, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ScreenshotViewerModal } from '@/components/ScreenshotViewerModal';
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';

interface TradeCardProps {
  trade: Trade;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  showDetails?: boolean;
  onExpandToggle?: () => void;
  /** When provided, "More" opens a full detail view (e.g. Sheet) instead of inline expand */
  onViewDetails?: (trade: Trade) => void;
  className?: string;
}

export const TradeCard = memo<TradeCardProps>(function TradeCard({
  trade,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  showDetails: controlledShowDetails,
  onExpandToggle,
  onViewDetails,
  className,
}) {
  const [internalShowDetails, setInternalShowDetails] = useState(controlledShowDetails ?? false);
  const showDetails = onViewDetails ? false : (onExpandToggle ? (controlledShowDetails ?? false) : internalShowDetails);
  const handleExpandToggle = onViewDetails
    ? () => onViewDetails(trade)
    : (onExpandToggle ?? (() => setInternalShowDetails((prev) => !prev)));
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const pnl = formatPnL(trade.pnl);
  const { themeConfig } = useTheme();

  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-4 transition-all duration-300',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      style={{
        backgroundColor: themeConfig.bg,
        border: `1px solid ${themeConfig.border}`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(trade.id)}
          className="absolute top-4 right-4 w-4 h-4 cursor-pointer"
          aria-label={`Select trade ${trade.symbol}`}
        />
      )}

      {/* Main Content */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Symbol & Type */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-foreground">{trade.symbol}</h3>
            <Badge variant={trade.type === 'buy' || trade.type === 'long' ? 'default' : 'secondary'}>
              {trade.type.toUpperCase()}
            </Badge>
            {trade.tradeGrade && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: trade.tradeGrade === 'A' ? `${themeConfig.success}25` : trade.tradeGrade === 'B' ? `${themeConfig.accent}25` : `${themeConfig.mutedForeground}25`,
                  color: trade.tradeGrade === 'A' ? themeConfig.success : trade.tradeGrade === 'B' ? themeConfig.accent : themeConfig.mutedForeground,
                }}
              >
                {trade.tradeGrade}
              </span>
            )}
            {getEmotionsForTrade(trade).map((em) => (
              <EmotionTag key={em} emotion={em as Emotion} size="sm" />
            ))}
          </div>

          {/* Entry → Exit */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{formatCurrency(trade.entryPrice)}</span>
            <span>→</span>
            <span>{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}</span>
            {trade.quantity > 0 && <span className="ml-2">× {formatCurrency(trade.quantity)}</span>}
          </div>

          {/* Date & Duration */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatDate(trade.entryTime)}</span>
            {trade.duration > 0 && <span>{formatDuration(trade.duration)}</span>}
          </div>
        </div>

        {/* Right: P&L */}
        <div className="text-right">
          <p className="text-xl font-bold mb-1" style={{ color: pnl.color }}>
            {pnl.text}
          </p>
          <p className="text-sm text-muted-foreground">{formatPercent(trade.pnlPercent)}</p>
          {(trade.rMultiple != null && Number.isFinite(trade.rMultiple)) || (trade.plannedRR != null && Number.isFinite(trade.plannedRR)) || trade.rr ? (
            <p className="text-xs text-muted-foreground mt-1">
              {trade.rMultiple != null && Number.isFinite(trade.rMultiple) && `R: ${trade.rMultiple}x`}
              {(trade.rMultiple != null && Number.isFinite(trade.rMultiple)) && (trade.plannedRR != null || trade.rr) && ' · '}
              {(trade.plannedRR != null && Number.isFinite(trade.plannedRR)) && `R:R 1:${trade.plannedRR}`}
              {(!trade.plannedRR || !Number.isFinite(trade.plannedRR)) && trade.rr && `R:R 1:${Number(trade.rr).toFixed(2)}`}
            </p>
          ) : null}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4"
          style={{ borderTop: `1px solid ${themeConfig.border}` }}
        >
          {((trade.rMultiple != null && Number.isFinite(trade.rMultiple)) || (trade.plannedRR != null && Number.isFinite(trade.plannedRR)) || trade.session) && (
            <div className="mb-2 flex flex-wrap gap-3 text-sm">
              {trade.rMultiple != null && Number.isFinite(trade.rMultiple) && (
                <span style={{ color: themeConfig.mutedForeground }}>R: <strong style={{ color: trade.rMultiple >= 0 ? themeConfig.success : themeConfig.destructive }}>{trade.rMultiple}x</strong></span>
              )}
              {trade.plannedRR != null && Number.isFinite(trade.plannedRR) && (
                <span style={{ color: themeConfig.mutedForeground }}>Risk/Reward: <strong style={{ color: themeConfig.foreground }}>1:{trade.plannedRR}</strong></span>
              )}
              {trade.session && (
                <span style={{ color: themeConfig.mutedForeground }}>Session: <strong style={{ color: themeConfig.foreground }}>{trade.session}</strong></span>
              )}
            </div>
          )}

          {trade.setupType && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground">Setup: </span>
              <span className="text-sm font-medium">{trade.setupType}</span>
            </div>
          )}

          {trade.notes && stripVoiceNotePlaceholders(trade.notes) && (
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">{stripVoiceNotePlaceholders(trade.notes)}</p>
            </div>
          )}

          {((trade.checklistItems?.length ?? 0) + (trade.duringChecklistItems?.length ?? 0) + (trade.postChecklistItems?.length ?? 0)) > 0 && (
            <div className="mb-2 space-y-1.5">
              {trade.checklistItems && trade.checklistItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>
                    Pre: {trade.checklistItems.filter(i => i.completed).length}/{trade.checklistItems.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trade.checklistItems.map((item, idx) => (
                      <span key={item.id || idx} className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: item.completed ? `${themeConfig.accent}30` : 'rgba(239,68,68,0.15)', color: item.completed ? themeConfig.accent : '#ef4444' }}>
                        {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />}{item.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {trade.duringChecklistItems && trade.duringChecklistItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>
                    During: {trade.duringChecklistItems.filter(i => i.completed).length}/{trade.duringChecklistItems.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trade.duringChecklistItems.map((item, idx) => (
                      <span key={item.id || idx} className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: item.completed ? `${themeConfig.accent}30` : 'rgba(239,68,68,0.15)', color: item.completed ? themeConfig.accent : '#ef4444' }}>
                        {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />}{item.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {trade.postChecklistItems && trade.postChecklistItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>
                    Post: {trade.postChecklistItems.filter(i => i.completed).length}/{trade.postChecklistItems.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trade.postChecklistItems.map((item, idx) => (
                      <span key={item.id || idx} className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: item.completed ? `${themeConfig.accent}30` : 'rgba(239,68,68,0.15)', color: item.completed ? themeConfig.accent : '#ef4444' }}>
                        {item.completed ? '✓' : <X className="w-3 h-3" strokeWidth={3} />}{item.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {trade.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {trade.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {trade.screenshot && (
            <button
              type="button"
              onClick={() => setScreenshotModalOpen(true)}
              className="mt-2 block rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={getScreenshotFullUrl(trade.screenshot)}
                alt="Trade screenshot"
                className="w-24 h-16 object-cover"
              />
            </button>
          )}

        </motion.div>
      )}

      {/* Actions */}
      <div 
        className="flex items-center justify-between mt-4 pt-4"
        style={{ borderTop: `1px solid ${themeConfig.border}` }}
      >
        <button
          onClick={() => handleExpandToggle()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={onViewDetails ? 'View full details' : showDetails ? 'Hide details' : 'Show details'}
        >
          <ChevronDown className="w-4 h-4" />
          {onViewDetails ? 'More' : showDetails ? 'Less' : 'More'}
        </button>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(trade)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={`Edit trade ${trade.symbol}`}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(trade.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              aria-label={`Delete trade ${trade.symbol}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {trade.screenshot && (
        <ScreenshotViewerModal
          open={screenshotModalOpen}
          onOpenChange={setScreenshotModalOpen}
          screenshotUrl={trade.screenshot}
        />
      )}
    </motion.div>
  );
});

