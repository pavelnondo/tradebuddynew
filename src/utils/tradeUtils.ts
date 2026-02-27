/**
 * Trade utility functions
 * Centralized functions for working with Trade data
 */

import { Trade, TradeType, Emotion } from '@/types/trade';

/** Get all emotions for a trade (supports multi-emotion). Use for analytics grouping. */
export function getEmotionsForTrade(t: Trade): string[] {
  const arr = t.emotions;
  if (Array.isArray(arr) && arr.length > 0) return arr.map((e) => String(e).toLowerCase());
  const e = t.emotion;
  if (e) return [String(e).toLowerCase()];
  return ['unknown'];
}

/** Parse tags from API (string, array, JSON, or PostgreSQL array format like {"a","b"}) */
export function parseTagsFromApi(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => (typeof t === 'string' ? t.trim() : String(t))).filter(Boolean);
  if (typeof tags === 'string') {
    const s = tags.trim();
    if (!s) return [];
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        const parsed = JSON.parse(s.replace(/'/g, '"'));
        return Array.isArray(parsed) ? parsed.map((t) => String(t).trim()).filter(Boolean) : [];
      } catch {
        const inner = s.slice(1, -1);
        return inner.split(',').map((t) => t.trim().replace(/^"|"$/g, '')).filter(Boolean);
      }
    }
    return s.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Convert API trade response to standardized Trade interface
 * Handles both legacy format (asset, date, profitLoss) and new format (symbol, entryTime, pnl)
 */
export function convertToStandardTrades(apiTrades: any[]): Trade[] {
  if (!Array.isArray(apiTrades)) {
    return [];
  }

  return apiTrades.map((trade) => {
    // Helper function to safely convert to number
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      if (value === undefined || value === null || value === '') return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // Helper function to safely parse date
    const safeDate = (dateValue: any): Date => {
      if (!dateValue) return new Date();
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    // Helper function to parse nullable date
    const safeDateOrNull = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    };

    // Normalize trade type (handle both legacy and new formats)
    const normalizeType = (type: any): TradeType => {
      if (!type) return 'buy';
      const lower = String(type).toLowerCase();
      if (['buy', 'sell', 'long', 'short'].includes(lower)) {
        return lower as TradeType;
      }
      return 'buy';
    };

    const validEmotions: Emotion[] = [
      'confident', 'calm', 'excited', 'nervous',
      'frustrated', 'greedy', 'fearful', 'fomo',
      'satisfied', 'disappointed'
    ];
    // Parse emotions: supports "calm", "calm,nervous", or array
    const parseEmotions = (emotion: any): Emotion[] => {
      if (!emotion) return ['calm'];
      if (Array.isArray(emotion)) {
        const arr = emotion
          .map((e: any) => String(e || '').toLowerCase().trim())
          .filter((e: string) => validEmotions.includes(e as Emotion)) as Emotion[];
        return arr.length > 0 ? arr : ['calm'];
      }
      const str = String(emotion).trim();
      if (!str) return ['calm'];
      const parts = str.split(/[,\s]+/).map((p) => p.toLowerCase().trim()).filter(Boolean);
      const parsed = parts.filter((p) => validEmotions.includes(p as Emotion)) as Emotion[];
      return parsed.length > 0 ? parsed : ['calm'];
    };
    const baseEmotions =
      Array.isArray(trade.emotions) && trade.emotions.length > 0
        ? (trade.emotions
            .map((e: unknown) => String(e || '').toLowerCase().trim())
            .filter((e: string) => validEmotions.includes(e as Emotion)) as Emotion[])
        : parseEmotions(trade.emotion);
    const emotionsArr = baseEmotions.length > 0 ? baseEmotions : (['calm'] as Emotion[]);

    const parseTags = parseTagsFromApi;

    const parseVoiceNoteUrls = (val: any): Array<{ url: string; duration?: number; transcript?: string; field?: string }> => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.map((v: any) => ({
          url: typeof v === 'string' ? v : (v?.url ?? ''),
          duration: typeof v === 'object' && v?.duration != null ? Number(v.duration) : undefined,
          transcript: typeof v === 'object' && v?.transcript ? String(v.transcript) : undefined,
          field: typeof v === 'object' && v?.field != null ? String(v.field) : undefined,
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

    // Parse checklist_items (handle JSONB string, array, or already-parsed format)
    const parseChecklistItems = (items: any): Array<{ id: string; text: string; completed: boolean }> => {
      if (!items) return [];
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { return []; }
      }
      if (!Array.isArray(items)) return [];
      return items.map((it: any) => ({
        id: String(it.id ?? ''),
        text: String(it.text ?? ''),
        completed: Boolean(it.completed),
      }));
    };
    const getChecklistItems = (t: any, key: string, camelKey: string) => {
      const val = t[camelKey] ?? t[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && 'text' in val[0]) {
        return val as Array<{ id: string; text: string; completed: boolean }>;
      }
      return parseChecklistItems(val);
    };

    // Calculate position size if not provided
    const entryPrice = safeNumber(trade.entry_price || trade.entryPrice, 0);
    const quantity = safeNumber(trade.quantity || trade.positionSize, 0);
    const calculatedPositionSize = trade.position_size || (entryPrice * quantity);

    // Map API fields to standardized Trade interface
    return {
      id: trade.id,
      symbol: trade.symbol || trade.asset || '',
      type: normalizeType(trade.trade_type || trade.type || trade.tradeType),
      entryPrice,
      exitPrice: trade.exit_price || trade.exitPrice ? safeNumber(trade.exit_price || trade.exitPrice, 0) : null,
      quantity,
      positionSize: safeNumber(calculatedPositionSize, 0),
      entryTime: safeDate(trade.entry_time || trade.entryTime || trade.date || trade.createdAt),
      exitTime: safeDateOrNull(trade.exit_time || trade.exitTime),
      emotion: emotionsArr[0] ?? 'calm',
      emotions: emotionsArr,
      confidenceLevel: Number.isFinite(Number(trade.confidence_level ?? trade.confidenceLevel))
        ? safeNumber(trade.confidence_level ?? trade.confidenceLevel, 0)
        : null,
      executionQuality: Number.isFinite(Number(trade.execution_quality ?? trade.executionQuality))
        ? safeNumber(trade.execution_quality ?? trade.executionQuality, 0)
        : null,
      setupType: trade.setup_type || trade.setup || trade.setupType || '',
      marketCondition: trade.market_condition || trade.marketCondition || null,
      notes: trade.notes || '',
      tags: parseTags(trade.tags),
      screenshot: trade.screenshot_url || trade.screenshot || null,
      pnl: safeNumber(trade.pnl || trade.profit_loss || trade.profitLoss, 0),
      pnlPercent: safeNumber(trade.pnl_percentage || trade.pnlPercent || trade.pnl_percent, 0),
      rr: trade.rr || trade.risk_reward ? safeNumber(trade.rr || trade.risk_reward, 0) : null,
      duration: safeNumber(trade.duration, 0),
      accountId: trade.journal_id || trade.account_id || trade.accountId || trade.journalId,
      journalId: trade.journal_id || trade.account_id || trade.accountId || trade.journalId,
      userId: trade.user_id || trade.userId,
      createdAt: safeDateOrNull(trade.created_at || trade.createdAt),
      updatedAt: safeDateOrNull(trade.updated_at || trade.updatedAt),
      checklistItems: getChecklistItems(trade, 'checklist_items', 'checklistItems'),
      duringChecklistItems: getChecklistItems(trade, 'during_checklist_items', 'duringChecklistItems'),
      postChecklistItems: getChecklistItems(trade, 'post_checklist_items', 'postChecklistItems'),
      ruleItems: getChecklistItems(trade, 'rule_items', 'ruleItems'),
      voiceNoteUrls: parseVoiceNoteUrls(trade.voice_note_urls ?? trade.voiceNoteUrls),
      tradeGrade: ['A', 'B', 'C'].includes(String(trade.trade_grade ?? trade.tradeGrade ?? '').toUpperCase()) ? (trade.trade_grade ?? trade.tradeGrade) as 'A' | 'B' | 'C' : undefined,
      lessonsLearned: trade.lessons_learned ?? trade.lessonsLearned ?? null,
      plannedRiskAmount: Number.isFinite(Number(trade.planned_risk_amount ?? trade.plannedRiskAmount))
        ? safeNumber(trade.planned_risk_amount ?? trade.plannedRiskAmount, 0)
        : null,
      plannedRiskPercent: Number.isFinite(Number(trade.planned_risk_percent ?? trade.plannedRiskPercent))
        ? safeNumber(trade.planned_risk_percent ?? trade.plannedRiskPercent, 0)
        : null,
      stopLossPrice: Number.isFinite(Number(trade.stop_loss_price ?? trade.stopLossPrice))
        ? safeNumber(trade.stop_loss_price ?? trade.stopLossPrice, 0)
        : null,
      takeProfitPrice: Number.isFinite(Number(trade.take_profit_price ?? trade.takeProfitPrice))
        ? safeNumber(trade.take_profit_price ?? trade.takeProfitPrice, 0)
        : null,
      plannedRR: Number.isFinite(Number(trade.planned_rr ?? trade.plannedRR))
        ? safeNumber(trade.planned_rr ?? trade.plannedRR, 0)
        : null,
      actualRR: Number.isFinite(Number(trade.actual_rr ?? trade.actualRR))
        ? safeNumber(trade.actual_rr ?? trade.actualRR, 0)
        : null,
      rMultiple: Number.isFinite(Number(trade.r_multiple ?? trade.rMultiple))
        ? safeNumber(trade.r_multiple ?? trade.rMultiple, 0)
        : null,
      tradeNumberOfDay: Number.isFinite(Number(trade.trade_number_of_day ?? trade.tradeNumberOfDay))
        ? safeNumber(trade.trade_number_of_day ?? trade.tradeNumberOfDay, 0)
        : null,
      session: trade.session || null,
      riskConsistencyFlag: typeof (trade.risk_consistency_flag ?? trade.riskConsistencyFlag) === 'boolean'
        ? Boolean(trade.risk_consistency_flag ?? trade.riskConsistencyFlag)
        : null,
      checklistCompletionPercent: Number.isFinite(Number(trade.checklist_completion_percent ?? trade.checklistCompletionPercent))
        ? safeNumber(trade.checklist_completion_percent ?? trade.checklistCompletionPercent, 0)
        : null,
    };
  });
}

/**
 * Validate a trade object
 */
export function validateTrade(trade: Partial<Trade>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!trade.symbol || trade.symbol.trim() === '') {
    errors.push('Symbol is required');
  }

  if (!trade.type) {
    errors.push('Trade type is required');
  }

  if (!trade.entryPrice || trade.entryPrice <= 0) {
    errors.push('Entry price must be greater than 0');
  }

  if (!trade.quantity || trade.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!trade.entryTime) {
    errors.push('Entry time is required');
  }

  if (trade.exitTime && trade.entryTime) {
    if (trade.exitTime < trade.entryTime) {
      errors.push('Exit time must be after entry time');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate trade metrics on a trade object
 */
export function calculateTradeMetrics(trade: Partial<Trade>): Partial<Trade> {
  if (!trade.entryPrice || !trade.quantity || !trade.type || !trade.entryTime) {
    return trade;
  }

  const entryPrice = trade.entryPrice;
  const exitPrice = trade.exitPrice || null;
  const quantity = trade.quantity;
  const type = trade.type;
  const entryTime = trade.entryTime;
  const exitTime = trade.exitTime || null;

  // Calculate position size
  const positionSize = entryPrice * quantity;

  // Calculate P&L
  let pnl = 0;
  if (exitPrice) {
    const priceDiff = exitPrice - entryPrice;
    const multiplier = type === 'buy' || type === 'long' ? 1 : -1;
    pnl = priceDiff * quantity * multiplier;
  }

  // Calculate P&L percentage
  let pnlPercent = 0;
  if (exitPrice) {
    const priceDiff = exitPrice - entryPrice;
    const multiplier = type === 'buy' || type === 'long' ? 1 : -1;
    pnlPercent = (priceDiff / entryPrice) * 100 * multiplier;
  }

  // Calculate duration
  let duration = 0;
  if (exitTime) {
    duration = Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)); // minutes
  }

  return {
    ...trade,
    positionSize: Math.round(positionSize * 100) / 100,
    pnl: Math.round(pnl * 100) / 100,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    duration,
  };
}

