import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PostLossBehaviorReport } from '@/services/advancedAnalyticsEngine';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface BehavioralPatternsSectionProps {
  report: PostLossBehaviorReport;
  themeConfig: {
    foreground: string;
    mutedForeground: string;
    border: string;
    card: string;
    accent: string;
    success: string;
    destructive: string;
  };
}

function fmt(v: number | null | undefined, decimals = 1, fallback = '—'): string {
  if (v == null || !Number.isFinite(v)) return fallback;
  return v.toFixed(decimals);
}

export function BehavioralPatternsSection({ report, themeConfig }: BehavioralPatternsSectionProps) {
  const {
    riskIncreasePercent,
    checklistDropPercent,
    expectancyAfterLoss,
    overallExpectancy,
    tradeFrequencySpike,
    avgRiskAfterLoss,
    avgRiskOverall,
    avgChecklistAfterLoss,
    avgChecklistOverall,
    avgRAfterLoss,
    avgROverall,
    behavioralWarnings,
  } = report;

  const hasWarnings = behavioralWarnings.length > 0;

  return (
    <Card shineBorder className="p-6" style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: themeConfig.foreground }}>
        Behavioral Patterns
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
        >
          <div className="text-xs mb-1" style={{ color: themeConfig.mutedForeground }}>
            Risk Shift
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{
                color:
                  riskIncreasePercent != null && riskIncreasePercent > 15
                    ? themeConfig.destructive
                    : themeConfig.foreground,
              }}
            >
              {riskIncreasePercent != null
                ? `${riskIncreasePercent > 0 ? '+' : ''}${fmt(riskIncreasePercent)}%`
                : '—'}
            </span>
            {riskIncreasePercent != null && riskIncreasePercent > 15 && (
              <AlertTriangle className="w-4 h-4" style={{ color: themeConfig.destructive }} />
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
            {avgRiskOverall != null && avgRiskAfterLoss != null
              ? `Overall ${fmt(avgRiskOverall)}% → After loss ${fmt(avgRiskAfterLoss)}%`
              : 'N/A'}
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
        >
          <div className="text-xs mb-1" style={{ color: themeConfig.mutedForeground }}>
            Checklist Shift
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{
                color:
                  checklistDropPercent != null && checklistDropPercent < -10
                    ? themeConfig.destructive
                    : themeConfig.foreground,
              }}
            >
              {checklistDropPercent != null
                ? `${checklistDropPercent > 0 ? '+' : ''}${fmt(checklistDropPercent)}%`
                : '—'}
            </span>
            {checklistDropPercent != null && checklistDropPercent < -10 && (
              <AlertTriangle className="w-4 h-4" style={{ color: themeConfig.destructive }} />
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
            {avgChecklistOverall != null && avgChecklistAfterLoss != null
              ? `Overall ${fmt(avgChecklistOverall)}% → After loss ${fmt(avgChecklistAfterLoss)}%`
              : 'N/A'}
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
        >
          <div className="text-xs mb-1" style={{ color: themeConfig.mutedForeground }}>
            Expectancy Shift
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{
                color:
                  expectancyAfterLoss != null && overallExpectancy != null && expectancyAfterLoss < 0 && overallExpectancy > 0
                    ? themeConfig.destructive
                    : expectancyAfterLoss != null && expectancyAfterLoss >= 0
                    ? themeConfig.success
                    : themeConfig.foreground,
              }}
            >
              {expectancyAfterLoss != null ? `${fmt(expectancyAfterLoss)}R` : '—'}
            </span>
            {expectancyAfterLoss != null && overallExpectancy != null && expectancyAfterLoss < 0 && overallExpectancy > 0 && (
              <AlertTriangle className="w-4 h-4" style={{ color: themeConfig.destructive }} />
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
            {overallExpectancy != null
              ? `Overall expectancy ${fmt(overallExpectancy)}R`
              : 'N/A'}
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
        >
          <div className="text-xs mb-1" style={{ color: themeConfig.mutedForeground }}>
            Trade Frequency After 2 Losses
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold"
              style={{
                color:
                  tradeFrequencySpike != null && tradeFrequencySpike > 0
                    ? themeConfig.destructive
                    : themeConfig.foreground,
              }}
            >
              {tradeFrequencySpike != null
                ? `${tradeFrequencySpike > 0 ? '+' : ''}${fmt(tradeFrequencySpike)}%`
                : '—'}
            </span>
            {tradeFrequencySpike != null && tradeFrequencySpike > 0 && (
              <TrendingUp className="w-4 h-4" style={{ color: themeConfig.destructive }} />
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
            {avgRAfterLoss != null && avgROverall != null
              ? `Avg R: ${fmt(avgROverall)} → ${fmt(avgRAfterLoss)} after loss`
              : 'N/A'}
          </div>
        </div>
      </div>

      {hasWarnings && (
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
            Behavioral Warnings
          </div>
          <div className="flex flex-wrap gap-2">
            {behavioralWarnings.map((w, i) => (
              <div
                key={`${w.type}-${i}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: themeConfig.border,
                  backgroundColor:
                    w.severity === 'high' ? `${themeConfig.destructive}15` : themeConfig.card,
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0"
                  style={{
                    color:
                      w.severity === 'high'
                        ? themeConfig.destructive
                        : w.severity === 'medium'
                        ? themeConfig.accent
                        : themeConfig.mutedForeground,
                  }}
                />
                <span className="text-sm" style={{ color: themeConfig.foreground }}>
                  {w.message}
                </span>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: themeConfig.border,
                    color: themeConfig.mutedForeground,
                    fontSize: '0.65rem',
                  }}
                >
                  {w.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasWarnings && (
        <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
          No behavioral warnings detected for current filters. Trading behavior after losses aligns with baseline.
        </p>
      )}
    </Card>
  );
}
