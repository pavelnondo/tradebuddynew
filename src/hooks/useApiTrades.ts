import { useEffect, useState, useCallback } from 'react';
import { Trade } from '@/types/trade';
import { API_BASE_URL } from '@/config';
import { parseTagsFromApi } from '@/utils/tradeUtils';
// Fixed API response format handling v2

export function useApiTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBaseUrl = API_BASE_URL;
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${apiBaseUrl}/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch trades');
      const response = await res.json();
      // Extract trades array from the response object
      const data = response.trades || response;
      
      // Ensure data is an array before mapping
      if (!Array.isArray(data)) {
        setTrades([]);
        setError('Invalid data format received from server');
        return;
      }
      // Map backend fields to frontend Trade type and parse dates with validation
      interface ApiTrade {
        id: string;
        symbol?: string;
        trade_type?: string;
        type?: string;
        entry_price?: number | string;
        exit_price?: number | string | null;
        quantity?: number | string;
        position_size?: number | string;
        entry_time?: string;
        exit_time?: string | null;
        entryTime?: string;
        exitTime?: string | null;
        emotion?: string;
        confidence_level?: number | string | null;
        confidenceLevel?: number | string | null;
        execution_quality?: number | string | null;
        executionQuality?: number | string | null;
        setup_type?: string;
        setup?: string;
        market_condition?: string | null;
        marketCondition?: string | null;
        notes?: string;
        tags?: string | string[];
        screenshot_url?: string;
        screenshot?: string;
        pnl?: number | string;
        pnl_percentage?: number | string;
        rr?: number | string;
        duration?: number | string;
        journal_id?: string;
        account_id?: string;
        accountId?: string;
        user_id?: string;
        created_at?: string;
        updated_at?: string;
        checklist_items?: unknown;
        during_checklist_items?: unknown;
        post_checklist_items?: unknown;
        rule_id?: string;
        rule_items?: unknown;
        trade_grade?: string;
        lessons_learned?: string | null;
        voice_note_urls?: unknown;
        voiceNoteUrls?: unknown;
        planned_risk_amount?: number | string | null;
        plannedRiskAmount?: number | string | null;
        planned_risk_percent?: number | string | null;
        plannedRiskPercent?: number | string | null;
        stop_loss_price?: number | string | null;
        stopLossPrice?: number | string | null;
        take_profit_price?: number | string | null;
        takeProfitPrice?: number | string | null;
        planned_rr?: number | string | null;
        plannedRR?: number | string | null;
        actual_rr?: number | string | null;
        actualRR?: number | string | null;
        r_multiple?: number | string | null;
        rMultiple?: number | string | null;
        trade_number_of_day?: number | string | null;
        tradeNumberOfDay?: number | string | null;
        session?: Trade['session'];
        risk_consistency_flag?: boolean | null;
        riskConsistencyFlag?: boolean | null;
        checklist_completion_percent?: number | string | null;
        checklistCompletionPercent?: number | string | null;
      }

      const parseChecklistItems = (items: unknown): Array<{ id: string; text: string; completed: boolean }> => {
        if (!items) return [];
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch { return []; }
        }
        if (!Array.isArray(items)) return [];
        return items.map((it: { id?: unknown; text?: unknown; completed?: unknown }) => ({
          id: String(it.id ?? ''),
          text: String(it.text ?? ''),
          completed: Boolean(it.completed),
        }));
      };

      const parseVoiceNoteUrls = (val: unknown): Array<{ url: string; duration?: number; transcript?: string; field?: string }> => {
        if (!val) return [];
        if (Array.isArray(val)) {
          return val.map((v: any) => ({
            url: typeof v === 'string' ? v : (v?.url ?? ''),
            duration: typeof v === 'object' && v?.duration != null ? Number(v.duration) : undefined,
            transcript: typeof v === 'object' && v?.transcript ? String(v.transcript) : undefined,
            field: typeof v === 'object' && v?.field ? String(v.field) : undefined,
          })).filter((v) => v.url);
        }
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            return parseVoiceNoteUrls(parsed);
          } catch { return []; }
        }
        return [];
      };

      const mappedTrades = data.map((trade: ApiTrade) => {
        // Helper function to safely convert to number
        const safeNumber = (value: unknown, defaultValue: number = 0): number => {
          if (value === undefined || value === null || value === '') return defaultValue;
          const num = Number(value);
          return isNaN(num) ? defaultValue : num;
        };

        // Helper function to safely parse date
        const safeDate = (dateValue: unknown): Date | null => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        // Map API response to standardized Trade interface
        const entryTimeParsed = safeDate(trade.entry_time) || safeDate(trade.entryTime) || null;
        const exitTimeParsed = safeDate(trade.exit_time) || safeDate(trade.exitTime) || null;
        const pnlValue = safeNumber(trade.pnl, 0);

        // Normalize core numeric fields for derived metrics
        const entryPriceNum = safeNumber(trade.entry_price, 0);
        const exitPriceNum = trade.exit_price ? safeNumber(trade.exit_price, 0) : null;
        const quantityNum = safeNumber(trade.quantity, 0);
        const typeNormalized = (trade.trade_type || trade.type || 'buy').toLowerCase() as Trade['type'];

        // Derive P&L % if backend did not store pnl_percentage
        let pnlPercentValue = safeNumber(trade.pnl_percentage, NaN);
        if (!Number.isFinite(pnlPercentValue) || pnlPercentValue === 0) {
          if (exitPriceNum !== null && entryPriceNum > 0) {
            const priceDiff = exitPriceNum - entryPriceNum;
            const multiplier = typeNormalized === 'buy' || typeNormalized === 'long' ? 1 : -1;
            pnlPercentValue = (priceDiff / entryPriceNum) * 100 * multiplier;
          } else {
            pnlPercentValue = 0;
          }
        }

        return {
          id: trade.id,
          symbol: trade.symbol || '',
          type: typeNormalized,
          entryPrice: entryPriceNum,
          exitPrice: exitPriceNum,
          quantity: quantityNum,
          positionSize: safeNumber(trade.position_size || trade.quantity * trade.entry_price, 0),
          entryTime: entryTimeParsed || new Date(),
          exitTime: exitTimeParsed,
          emotion: (() => {
            const raw = trade.emotion || 'calm';
            const valid = ['confident','calm','excited','nervous','frustrated','greedy','fearful','fomo','satisfied','disappointed'] as const;
            if (typeof raw === 'string') {
              const parts = raw.split(/[,\s]+/).map((p) => p.toLowerCase().trim()).filter(Boolean);
              const parsed = parts.filter((p) => valid.includes(p as typeof valid[number]));
              return (parsed[0] ?? 'calm') as Trade['emotion'];
            }
            return 'calm' as Trade['emotion'];
          })(),
          emotions: (() => {
            const raw = trade.emotion;
            const valid = ['confident','calm','excited','nervous','frustrated','greedy','fearful','fomo','satisfied','disappointed'] as const;
            if (!raw) return ['calm' as const];
            if (typeof raw === 'string') {
              const parts = raw.split(/[,\s]+/).map((p) => p.toLowerCase().trim()).filter(Boolean);
              const parsed = parts.filter((p) => valid.includes(p as typeof valid[number])) as Trade['emotion'][];
              return parsed.length > 0 ? parsed : ['calm' as const];
            }
            return ['calm' as const];
          })(),
          confidenceLevel: safeNumber(trade.confidence_level ?? trade.confidenceLevel, NaN),
          executionQuality: safeNumber(trade.execution_quality ?? trade.executionQuality, NaN),
          setupType: trade.setup_type || trade.setup || '',
          marketCondition: trade.market_condition ?? trade.marketCondition ?? null,
          notes: trade.notes || '',
          tags: parseTagsFromApi(trade.tags),
          screenshot: trade.screenshot_url || trade.screenshot || null,
          pnl: pnlValue,
          pnlPercent: Math.round(pnlPercentValue * 100) / 100,
          rr: trade.rr ? safeNumber(trade.rr, 0) : null,
          duration: safeNumber(trade.duration, 0),
          accountId: trade.journal_id || trade.account_id || trade.accountId,
          journalId: trade.journal_id || trade.account_id || trade.accountId,
          userId: trade.user_id,
          createdAt: safeDate(trade.created_at),
          updatedAt: safeDate(trade.updated_at),
          checklistItems: parseChecklistItems(trade.checklist_items),
          duringChecklistItems: parseChecklistItems(trade.during_checklist_items),
          postChecklistItems: parseChecklistItems(trade.post_checklist_items),
          ruleItems: parseChecklistItems(trade.rule_items),
          tradeGrade: ['A', 'B', 'C'].includes(String(trade.trade_grade ?? '').toUpperCase()) ? (trade.trade_grade as 'A' | 'B' | 'C') : undefined,
          lessonsLearned: trade.lessons_learned ?? trade.lessonsLearned ?? null,
          plannedRiskAmount: safeNumber(trade.planned_risk_amount ?? trade.plannedRiskAmount, NaN),
          plannedRiskPercent: safeNumber(trade.planned_risk_percent ?? trade.plannedRiskPercent, NaN),
          stopLossPrice: safeNumber(trade.stop_loss_price ?? trade.stopLossPrice, NaN),
          takeProfitPrice: safeNumber(trade.take_profit_price ?? trade.takeProfitPrice, NaN),
          plannedRR: safeNumber(trade.planned_rr ?? trade.plannedRR, NaN),
          actualRR: safeNumber(trade.actual_rr ?? trade.actualRR, NaN),
          rMultiple: safeNumber(trade.r_multiple ?? trade.rMultiple, NaN),
          tradeNumberOfDay: safeNumber(trade.trade_number_of_day ?? trade.tradeNumberOfDay, NaN),
          session: trade.session ?? null,
          riskConsistencyFlag: typeof (trade.risk_consistency_flag ?? trade.riskConsistencyFlag) === 'boolean'
            ? Boolean(trade.risk_consistency_flag ?? trade.riskConsistencyFlag)
            : null,
          checklistCompletionPercent: safeNumber(trade.checklist_completion_percent ?? trade.checklistCompletionPercent, NaN),
          voiceNoteUrls: (() => {
            const parsed = parseVoiceNoteUrls(trade.voice_note_urls ?? trade.voiceNoteUrls);
            // Debug logging for voice notes
            if (process.env.NODE_ENV === 'development' && parsed.length > 0) {
              console.log('[useApiTrades] Parsed voice notes for trade', trade.id, ':', parsed.length, 'items', parsed);
            }
            return parsed;
          })(),

          // Compatibility fields for legacy components (to be removed once fully migrated)
          profitLoss: pnlValue,
          asset: trade.symbol || '',
          date: entryTimeParsed ? entryTimeParsed.toISOString() : (trade.entry_time || trade.entryTime || ''),
          tradeType: trade.trade_type || trade.type || '',
        };
      });

      const nullifyNaN = (v: number): number | null => (Number.isFinite(v) ? v : null);
      const normalizedTrades = mappedTrades.map((t) => ({
        ...t,
        plannedRiskAmount: nullifyNaN(t.plannedRiskAmount as number),
        plannedRiskPercent: nullifyNaN(t.plannedRiskPercent as number),
        stopLossPrice: nullifyNaN(t.stopLossPrice as number),
        takeProfitPrice: nullifyNaN(t.takeProfitPrice as number),
        plannedRR: nullifyNaN(t.plannedRR as number),
        actualRR: nullifyNaN(t.actualRR as number),
        rMultiple: nullifyNaN(t.rMultiple as number),
        tradeNumberOfDay: nullifyNaN(t.tradeNumberOfDay as number),
        checklistCompletionPercent: nullifyNaN(t.checklistCompletionPercent as number),
        confidenceLevel: nullifyNaN(t.confidenceLevel as number),
        executionQuality: nullifyNaN(t.executionQuality as number),
      }));
      setTrades(normalizedTrades as Trade[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps - stable function

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, isLoading, error, fetchTrades };
} 