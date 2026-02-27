/**
 * AI-powered "What to improve today" widget
 * Surfaces actionable to-dos from insights, habits, trade notes, and lessons
 * Animated list with stagger effect on load
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPulse } from '@/components/ui/loading-pulse';
import { ShineBorder } from '@/components/ui/shine-border';
import type { InsightsData } from '@/hooks/useInsights';

interface ImproveTodayWidgetProps {
  insights: InsightsData | null;
  insightsLoading: boolean;
  fetchInsights: () => void;
  /** @deprecated No longer used - widget shows AI insights only */
  trades?: unknown[];
  journalId?: string;
}

// Dashboard widget is read-only - no completion tracking here
// Completions are only tracked in Add Trade form

export function ImproveTodayWidget({
  insights,
  insightsLoading,
  fetchInsights,
  journalId,
}: ImproveTodayWidgetProps) {
  const { themeConfig } = useTheme();
  // Dashboard is read-only - no completion tracking here
  // Completions are only tracked in Add Trade form

  // Build actionable to-dos: AI insights only (actionItems + topAction). No lessons from trades.
  const todos = React.useMemo(() => {
    const items: { id: string; text: string; source: 'insight' }[] = [];

    // Action items from AI
    const actions = insights?.actionItems;
    (Array.isArray(actions) ? actions : []).forEach((a, i) => {
      const t = typeof a === 'string' ? a.trim() : String(a ?? '').trim();
      if (t) items.push({ id: `action-${i}`, text: t, source: 'insight' });
    });

    // Add topAction only if not redundant with actionItems
    const topAction = typeof insights?.topAction === 'string' ? insights.topAction.trim() : '';
    if (topAction && topAction.length <= 80) {
      const exists = items.some(
        (it) => it.text.toLowerCase().slice(0, 40) === topAction.toLowerCase().slice(0, 40)
      );
      if (!exists) items.unshift({ id: 'top-action', text: topAction, source: 'insight' });
    }

    // Dedupe by text (keep first)
    const seen = new Set<string>();
    return items
      .filter((item) => {
        const key = item.text.toLowerCase().slice(0, 45);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [insights]);

  const hasTodos = todos.length > 0;
  const hasInsights = !!insights;

  if (!hasTodos && !insightsLoading) {
    return (
      <div
        className="rounded-xl border p-4 relative overflow-hidden group/card"
        style={{
          backgroundColor: themeConfig.card,
          borderColor: themeConfig.border,
        }}
      >
        <ShineBorder
          borderWidth={1}
          duration={18}
          shineColor="var(--accent)"
          className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[inherit]"
        />
        <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <Sparkles className="w-4 h-4" style={{ color: themeConfig.accent }} />
            What to improve today
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={insightsLoading}
            className="h-7 text-xs"
          >
            {insightsLoading ? (
              <LoadingPulse size="sm" className="mr-1" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Refresh
          </Button>
        </div>
        <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
          Add trades with notes and lessons, then click Refresh to get AI-driven improvements.
        </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 relative overflow-hidden group/card"
      style={{
        backgroundColor: themeConfig.card,
        borderColor: themeConfig.border,
      }}
    >
      <ShineBorder
        borderWidth={1}
        duration={18}
        shineColor="var(--accent)"
        className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[inherit]"
      />
      <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
          <Sparkles className="w-4 h-4" style={{ color: themeConfig.accent }} />
          What to improve today
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={insightsLoading || !hasInsights}
          className="h-7 text-xs relative"
          title={!hasInsights ? 'Refresh insights to get AI suggestions' : undefined}
        >
          {insightsLoading ? (
            <LoadingPulse size="sm" className="mr-1" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      <motion.ul
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: { staggerChildren: 0.05, delayChildren: 0.05 },
          },
          hidden: {},
        }}
      >
        <AnimatePresence mode="popLayout">
          {todos.map((item) => {
            return (
              <motion.li
                key={item.id}
                layout
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-start gap-2 text-sm"
              >
                <div
                  className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: themeConfig.border,
                    backgroundColor: 'transparent',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeConfig.accent }} />
                </div>
                <span
                  className="flex-1"
                  style={{
                    color: themeConfig.foreground,
                  }}
                >
                  {item.text}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
      </div>
    </div>
  );
}
