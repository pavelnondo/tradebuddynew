/**
 * Add Trade Page - COMPLETELY REFACTORED
 * Features:
 * - Live P&L calculator (updates as user types)
 * - Zod validation with React Hook Form
 * - Auto-calculates position size, P&L, P&L%, duration
 * - Emotion selector as radio buttons
 * - Screenshot preview/remove
 * - Exit time > Entry time validation
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../contexts/ThemeContext';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { useChecklists } from '../hooks/useChecklists';
import { useSetupTypes } from '../hooks/useSetupTypes';
import { TradeCalculator } from '@/types/trade';
import { formatCurrency, formatPercent, formatDuration } from '@/utils/formatting';
import { NeonCard } from '@/components/ui/NeonCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ParticleButton } from '@/components/ui/particle-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmotionTag } from '@/components/shared/EmotionTag';
import { 
  ArrowLeft, 
  Save, 
  Calculator,
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Heart,
  AlertCircle,
  BarChart3,
  Target,
  Check,
  CheckSquare,
  Lightbulb,
  FileUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { tradeApi } from '../services/tradeApi';
import { API_BASE_URL, API_ORIGIN } from '../config';
import { Trade, Emotion, TradeType } from '@/types/trade';
import type { Checklist, ChecklistItem } from '@/types';
import { toLocalDatetimeString, parseLocalDatetimeString } from '@/utils/dateTime';
import { stripVoiceNotePlaceholders, getVoiceNoteAudioUrl } from '@/utils/formatting';
import { AudioPlayer } from '@/components/AudioPlayer';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import { parseBrokerReport, type ParsedDeal } from '@/utils/parseBrokerReport';
import { useInsights } from '@/hooks/useInsights';
import { VoiceRecorder } from '@/components/VoiceRecorder';

const toNumOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};
const toIntOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

// Coerce string/number to number | null for Zod (API often returns strings)
const numOrNull = z.preprocess(
  (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; },
  z.number().nullable()
);
const intOrNull = z.preprocess(
  (v) => { if (v == null || v === '') return null; const n = parseInt(String(v), 10); return Number.isNaN(n) ? null : n; },
  z.number().int().nullable()
);

// Zod validation schema - P&L is manual input only
const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  type: z.enum(['buy', 'sell', 'long', 'short']),
  entryPrice: z.coerce.number().positive('Entry price must be greater than 0'),
  exitPrice: z.preprocess(
    (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; },
    z.number().positive('Exit price must be greater than 0').nullable()
  ),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  pnl: z.coerce.number(),
  entryTime: z.date(),
  exitTime: z.date().nullable(),
  emotions: z.array(z.enum([
    'confident', 'calm', 'excited', 'nervous',
    'frustrated', 'greedy', 'fearful', 'fomo',
    'satisfied', 'disappointed'
  ] as const)).min(1, 'Select at least one emotion'),
  setupType: z.string().max(100, 'Setup type too long').optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  lessonsLearned: z.string().max(5000, 'Lessons learnt too long').optional(),
  tags: z.string().max(500, 'Tags too long').optional(),
  plannedRiskAmount: numOrNull.optional(),
  plannedRiskPercent: numOrNull.optional(),
  stopLossPrice: numOrNull.optional(),
  takeProfitPrice: numOrNull.optional(),
  plannedRR: numOrNull.optional(),
  actualRR: numOrNull.optional(),
  rMultiple: numOrNull.optional(),
  tradeNumberOfDay: intOrNull.optional(),
  session: z.enum(['Asia', 'London', 'NewYork', 'Other']).nullable().optional(),
  riskConsistencyFlag: z.boolean().optional(),
  checklistCompletionPercent: z.preprocess(
    (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; },
    z.number().min(0).max(100).nullable().optional()
  ),
}).refine((data) => {
  if (data.exitTime && data.entryTime) {
    return data.exitTime > data.entryTime;
    }
  return true;
}, {
  message: 'Exit time must be after entry time',
  path: ['exitTime'],
});

type TradeFormData = z.infer<typeof tradeSchema> & {
  screenshot?: File | null;
};

const emotionOptions: Emotion[] = [
  'confident', 'calm', 'excited', 'nervous',
  'frustrated', 'greedy', 'fearful', 'fomo',
  'satisfied', 'disappointed'
];

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeConfig } = useTheme();
  const { activeJournal } = useAccountManagement();
  const { fetchChecklists, getChecklist } = useChecklists();
  const { fetchSetupTypes } = useSetupTypes();
  const { insights, fetchInsights } = useInsights(100, activeJournal?.id);
  // Note: Using API directly instead of store for data persistence
  const { toast } = useToast();
  
  const isEditing = location.pathname.includes('/edit-trade/');
  const tradeId = isEditing ? location.pathname.split('/').pop() : null;
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTrade, setIsLoadingTrade] = useState(false);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [setupTypes, setSetupTypes] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);
  const [preChecklistId, setPreChecklistId] = useState<string | null>(null);
  const [preChecklistItems, setPreChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [duringChecklistId, setDuringChecklistId] = useState<string | null>(null);
  const [duringChecklistItems, setDuringChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [postChecklistId, setPostChecklistId] = useState<string | null>(null);
  const [postChecklistItems, setPostChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [ruleChecklistId, setRuleChecklistId] = useState<string | null>(null);
  const [ruleChecklistItems, setRuleChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [aiRecommendationCompletions, setAiRecommendationCompletions] = useState<Record<string, boolean>>({});
  const [savedAiRecommendations, setSavedAiRecommendations] = useState<string[]>([]); // Recommendations saved with this trade
  const [tradeGrade, setTradeGrade] = useState<'A' | 'B' | 'C' | null>(null);
  const [importedDeals, setImportedDeals] = useState<ParsedDeal[]>([]);
  const [parsingReport, setParsingReport] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  // Voice notes state
  const [notesVoiceNotes, setNotesVoiceNotes] = useState<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const [lessonsVoiceNotes, setLessonsVoiceNotes] = useState<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const [savedNotesVoiceNotes, setSavedNotesVoiceNotes] = useState<Array<{ url: string; duration?: number; transcript?: string }>>([]);
  const [savedLessonsVoiceNotes, setSavedLessonsVoiceNotes] = useState<Array<{ url: string; duration?: number; transcript?: string }>>([]);

  // Refs to capture latest checklist state synchronously in onChange (avoids React state batching race on Save)
  const preChecklistRef = useRef({ id: null as string | null, items: [] as Array<{ id: string; text: string; completed: boolean }> });
  // Refs to capture latest voice note state synchronously (avoids React state batching race on Save)
  const notesVoiceNotesRef = useRef<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const lessonsVoiceNotesRef = useRef<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const duringChecklistRef = useRef({ id: null as string | null, items: [] as Array<{ id: string; text: string; completed: boolean }> });
  const postChecklistRef = useRef({ id: null as string | null, items: [] as Array<{ id: string; text: string; completed: boolean }> });
  const ruleChecklistRef = useRef({ id: null as string | null, items: [] as Array<{ id: string; text: string; completed: boolean }> });
  preChecklistRef.current = { id: preChecklistId, items: preChecklistItems };
  duringChecklistRef.current = { id: duringChecklistId, items: duringChecklistItems };
  postChecklistRef.current = { id: postChecklistId, items: postChecklistItems };
  ruleChecklistRef.current = { id: ruleChecklistId, items: ruleChecklistItems };

  const now = new Date();
  const exitDefault = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
    symbol: '',
      type: 'buy',
      entryPrice: 0,
      exitPrice: null,
      quantity: 0,
      pnl: 0,
      entryTime: now,
      exitTime: exitDefault,
      emotions: ['calm'],
      setupType: '',
    notes: '',
      lessonsLearned: '',
    tags: '',
      plannedRiskAmount: null,
      plannedRiskPercent: null,
      stopLossPrice: null,
      takeProfitPrice: null,
      plannedRR: null,
      actualRR: null,
      rMultiple: null,
      tradeNumberOfDay: null,
      session: null,
      riskConsistencyFlag: false,
      checklistCompletionPercent: null,
    },
  });
  
  // Watch form values
  const entryPrice = watch('entryPrice');
  const exitPrice = watch('exitPrice');
  const quantity = watch('quantity');
  const tradeType = watch('type');
  const entryTime = watch('entryTime');
  const exitTime = watch('exitTime');
  const emotions = watch('emotions');
  const pnlInput = watch('pnl');
  const plannedRiskAmount = watch('plannedRiskAmount');
  const stopLossPrice = watch('stopLossPrice');
  const takeProfitPrice = watch('takeProfitPrice');
  const notes = watch('notes');
  const lessonsLearned = watch('lessonsLearned');

  // Balance for Planned Risk % (current balance preferred, else initial)
  const balance = activeJournal?.currentBalance ?? activeJournal?.initialBalance ?? 10000;

  // Position size, duration, pnlPercent - P&L is manual input only
  const calculations = useMemo(() => {
    const pnl = Number(pnlInput) || 0;
    if (!entryPrice || !quantity) {
      return { positionSize: 0, pnl, pnlPercent: 0, duration: 0 };
    }
    const positionSize = TradeCalculator.calculatePositionSize(entryPrice, quantity);
    const pnlPercent = positionSize > 0 ? (pnl / positionSize) * 100 : 0;
    const entryDate = entryTime ? new Date(entryTime) : new Date();
    const exitDate = exitTime ? new Date(exitTime) : null;
    const duration = exitDate ? TradeCalculator.calculateDuration(entryDate, exitDate) : 0;
    return {
      positionSize: Math.round(positionSize * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      duration,
    };
  }, [entryPrice, quantity, entryTime, exitTime, pnlInput]);

  // Risk Architecture: auto-calculated values
  const riskCalculations = useMemo(() => {
    const ep = Number(entryPrice) || 0;
    const sl = Number(stopLossPrice) || null;
    const tp = Number(takeProfitPrice) || null;
    const exit = exitPrice != null ? Number(exitPrice) : null;
    const riskAmount = plannedRiskAmount != null ? Number(plannedRiskAmount) : null;
    const pnl = Number(pnlInput) || 0;

    const plannedRiskPercent =
      balance > 0 && riskAmount != null && riskAmount > 0
        ? Math.round((riskAmount / balance) * 10000) / 100
        : null;

    let plannedRR: number | null = null;
    if (ep > 0 && sl != null && sl > 0 && tp != null && tp > 0) {
      const risk = Math.abs(ep - sl);
      if (risk > 0) plannedRR = Math.round((Math.abs(tp - ep) / risk) * 100) / 100;
    }

    const effectiveExit = exit ?? tp;
    let actualRR: number | null = null;
    if (ep > 0 && sl != null && sl > 0 && effectiveExit != null && effectiveExit > 0) {
      const risk = Math.abs(ep - sl);
      if (risk > 0) actualRR = Math.round((Math.abs(effectiveExit - ep) / risk) * 100) / 100;
    }

    let rMultiple: number | null = null;
    if (riskAmount != null && riskAmount > 0) {
      rMultiple = Math.round((pnl / riskAmount) * 100) / 100;
    }

    return { plannedRiskPercent, plannedRR, actualRR, rMultiple };
  }, [entryPrice, exitPrice, stopLossPrice, takeProfitPrice, plannedRiskAmount, pnlInput, balance]);

  const handleReportFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = (file.name || '').toLowerCase().split('.').pop();
    if (!['html', 'htm', 'xml', 'xlsx', 'xls'].includes(ext || '')) {
      toast({
        title: 'Unsupported format',
        description: 'Please upload HTML, XML, or XLSX report (MT5: File → Save as report).',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setParsingReport(true);
    try {
      const deals = await parseBrokerReport(file);
      setImportedDeals(deals);
      setShowImportPanel(true);
      toast({
        title: 'Report parsed',
        description: deals.length > 0 ? `Found ${deals.length} position(s). Click one to fill the form.` : 'No positions found in this report.',
        variant: deals.length > 0 ? 'default' : 'destructive',
      });
    } catch (err) {
      toast({
        title: 'Parse failed',
        description: err instanceof Error ? err.message : 'Could not parse the report file.',
        variant: 'destructive',
      });
    } finally {
      setParsingReport(false);
      e.target.value = '';
    }
  }, [toast]);

  // Session from entry time (UTC hour): Asia 0–6, London 7–11, New York 12–20, Other 21–23
  const sessionFromEntryTime = useCallback((dt: Date | null): 'Asia' | 'London' | 'NewYork' | 'Other' | null => {
    if (!dt || !(dt instanceof Date) || isNaN(dt.getTime())) return null;
    const h = dt.getUTCHours();
    if (h >= 0 && h < 7) return 'Asia';
    if (h >= 7 && h < 12) return 'London';
    if (h >= 12 && h < 21) return 'NewYork';
    return 'Other';
  }, []);

  const applyDealToForm = useCallback((deal: ParsedDeal) => {
    setValue('symbol', deal.symbol);
    setValue('type', deal.type);
    setValue('quantity', deal.quantity);
    setValue('entryPrice', deal.entryPrice);
    setValue('exitPrice', deal.exitPrice);
    setValue('pnl', deal.pnl);
    setValue('entryTime', deal.entryTime || new Date());
    setValue('exitTime', deal.exitTime || new Date());
    if (deal.stopLoss != null) setValue('stopLossPrice', deal.stopLoss);
    if (deal.takeProfit != null) setValue('takeProfitPrice', deal.takeProfit);
    if (deal.comment) setValue('notes', deal.comment);
    setValue('session', sessionFromEntryTime(deal.entryTime || deal.exitTime));
    toast({ title: 'Form filled', description: `Applied ${deal.symbol} ${deal.type} from report.` });
  }, [setValue, sessionFromEntryTime, toast]);

  // Checklist completion % from all checklist items
  const checklistCompletion = useMemo(() => {
    const all = [
      ...preChecklistItems,
      ...duringChecklistItems,
      ...postChecklistItems,
      ...ruleChecklistItems,
    ];
    if (all.length === 0) return null;
    const completed = all.filter((i) => i.completed).length;
    return Math.round((completed / all.length) * 10000) / 100;
  }, [preChecklistItems, duringChecklistItems, postChecklistItems, ruleChecklistItems]);
    
  // Load trade data if editing
  useEffect(() => {
    if (isEditing && tradeId) {
      const loadTrade = async () => {
        setIsLoadingTrade(true);
      try {
        const token = localStorage.getItem('token');
          if (!token) {
            toast({
              title: 'Error',
              description: 'Authentication token not found',
              variant: 'destructive',
            });
            navigate('/trades');
            return;
          }

          const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to load trade');

          const trade = await response.json();
          
          setValue('symbol', trade.symbol || '');
          setValue('type', (trade.trade_type || trade.type || 'buy').toLowerCase() as TradeType);
          setValue('entryPrice', parseFloat(trade.entry_price) || 0);
          setValue('exitPrice', trade.exit_price ? parseFloat(trade.exit_price) : null);
          setValue('quantity', parseFloat(trade.quantity) || 0);
          setValue('pnl', parseFloat(trade.pnl) || 0);
          const entryDt = trade.entry_time ? new Date(trade.entry_time) : new Date();
          const exitDt = trade.exit_time ? new Date(trade.exit_time) : new Date(entryDt.getTime() + 60 * 60 * 1000);
          setValue('entryTime', entryDt);
          setValue('exitTime', exitDt);
          setValue('emotions', (() => {
            const raw = trade.emotion ?? trade.emotions;
            if (Array.isArray(raw) && raw.length > 0) return raw.map((e: string) => String(e).toLowerCase() as Emotion);
            if (typeof raw === 'string') {
              const parts = raw.split(/[,\s]+/).map((p) => p.toLowerCase().trim()).filter(Boolean);
              const valid: Emotion[] = ['confident','calm','excited','nervous','frustrated','greedy','fearful','fomo','satisfied','disappointed'];
              const parsed = parts.filter((p) => valid.includes(p as Emotion)) as Emotion[];
              return parsed.length > 0 ? parsed : ['calm'];
            }
            return ['calm'];
          })());
          setValue('setupType', trade.setup_type || '');
          setValue('notes', stripVoiceNotePlaceholders(trade.notes || '') || '');
          setValue('lessonsLearned', stripVoiceNotePlaceholders(trade.lessons_learned || trade.lessonsLearned || '') || '');
          
          // Load existing voice notes from database
          const voiceNoteUrls = Array.isArray(trade.voice_note_urls) 
            ? trade.voice_note_urls 
            : (typeof trade.voice_note_urls === 'string' 
                ? (() => {
                    try {
                      return JSON.parse(trade.voice_note_urls);
                    } catch {
                      return [];
                    }
                  })()
                : []);
          const notesVoiceUrls = voiceNoteUrls.filter((vn: any) => vn.field === 'notes' || !vn.field);
          const lessonsVoiceUrls = voiceNoteUrls.filter((vn: any) => vn.field === 'lessons');
          setSavedNotesVoiceNotes(notesVoiceUrls.map((vn: any) => ({ url: vn.url, duration: vn.duration, transcript: vn.transcript })));
          setSavedLessonsVoiceNotes(lessonsVoiceUrls.map((vn: any) => ({ url: vn.url, duration: vn.duration, transcript: vn.transcript })));
          setNotesVoiceNotes([]);
          setLessonsVoiceNotes([]);
          // Also clear refs when loading trade for editing
          notesVoiceNotesRef.current = [];
          lessonsVoiceNotesRef.current = [];
          
          // Clear any draft notes for this trade since we're loading saved data
          try {
            const draftKey = `tradebuddy-draft-notes-${tradeId}`;
            localStorage.removeItem(draftKey);
          } catch (e) {
            console.warn('Could not clear draft notes:', e);
          }
          setValue('tags', trade.tags ? (Array.isArray(trade.tags) ? trade.tags.join(', ') : trade.tags) : '');
          setValue('plannedRiskAmount', toNumOrNull(trade.planned_risk_amount ?? trade.plannedRiskAmount));
          setValue('plannedRiskPercent', toNumOrNull(trade.planned_risk_percent ?? trade.plannedRiskPercent));
          setValue('stopLossPrice', toNumOrNull(trade.stop_loss_price ?? trade.stopLossPrice));
          setValue('takeProfitPrice', toNumOrNull(trade.take_profit_price ?? trade.takeProfitPrice));
          setValue('plannedRR', toNumOrNull(trade.planned_rr ?? trade.plannedRR));
          setValue('actualRR', toNumOrNull(trade.actual_rr ?? trade.actualRR));
          setValue('rMultiple', toNumOrNull(trade.r_multiple ?? trade.rMultiple));
          setValue('tradeNumberOfDay', toIntOrNull(trade.trade_number_of_day ?? trade.tradeNumberOfDay));
          setValue('session', trade.session || null);
          setValue('riskConsistencyFlag', Boolean(trade.risk_consistency_flag ?? trade.riskConsistencyFlag));
          setValue('checklistCompletionPercent', toNumOrNull(trade.checklist_completion_percent ?? trade.checklistCompletionPercent));
          setPreChecklistId(trade.checklist_id || null);
          if (Array.isArray(trade.checklist_items) && trade.checklist_items.length > 0) {
            setPreChecklistItems(trade.checklist_items.map((it: { id?: unknown; text?: unknown; completed?: unknown }) => ({
              id: String(it.id ?? ''),
              text: String(it.text ?? ''),
              completed: Boolean(it.completed),
            })));
          } else if (trade.checklist_id) {
            getChecklist(trade.checklist_id).then((cl) => {
              if (cl?.items?.length) {
                setPreChecklistItems(cl.items.map(it => ({ id: it.id, text: it.text, completed: false })));
              } else setPreChecklistItems([]);
            });
          } else setPreChecklistItems([]);
          setDuringChecklistId(trade.during_checklist_id || null);
          if (Array.isArray(trade.during_checklist_items) && trade.during_checklist_items.length > 0) {
            setDuringChecklistItems(trade.during_checklist_items.map((it: { id?: unknown; text?: unknown; completed?: unknown }) => ({
              id: String(it.id ?? ''),
              text: String(it.text ?? ''),
              completed: Boolean(it.completed),
            })));
          } else if (trade.during_checklist_id) {
            getChecklist(trade.during_checklist_id).then((cl) => {
              if (cl?.items?.length) setDuringChecklistItems(cl.items.map(it => ({ id: it.id, text: it.text, completed: false })));
              else setDuringChecklistItems([]);
            });
          } else setDuringChecklistItems([]);
          setPostChecklistId(trade.post_checklist_id || null);
          if (Array.isArray(trade.post_checklist_items) && trade.post_checklist_items.length > 0) {
            setPostChecklistItems(trade.post_checklist_items.map((it: { id?: unknown; text?: unknown; completed?: unknown }) => ({
              id: String(it.id ?? ''),
              text: String(it.text ?? ''),
              completed: Boolean(it.completed),
            })));
          } else if (trade.post_checklist_id) {
            getChecklist(trade.post_checklist_id).then((cl) => {
              if (cl?.items?.length) setPostChecklistItems(cl.items.map(it => ({ id: it.id, text: it.text, completed: false })));
              else setPostChecklistItems([]);
            });
          } else setPostChecklistItems([]);
          setRuleChecklistId(trade.rule_id || null);
          if (Array.isArray(trade.rule_items) && trade.rule_items.length > 0) {
            setRuleChecklistItems(trade.rule_items.map((it: { id?: unknown; text?: unknown; completed?: unknown }) => ({
              id: String(it.id ?? ''),
              text: String(it.text ?? ''),
              completed: Boolean(it.completed),
            })));
          } else if (trade.rule_id) {
            getChecklist(trade.rule_id).then((cl) => {
              if (cl?.items?.length) setRuleChecklistItems(cl.items.map(it => ({ id: it.id, text: it.text, completed: false })));
              else setRuleChecklistItems([]);
            });
          } else setRuleChecklistItems([]);
          const grade = trade.trade_grade || trade.tradeGrade;
          setTradeGrade(['A', 'B', 'C'].includes(String(grade || '').toUpperCase()) ? (grade as 'A' | 'B' | 'C') : null);
          
          // Load saved AI recommendations from trade (preserve history)
          const savedRecs = trade.ai_recommendations || trade.aiRecommendations;
          if (Array.isArray(savedRecs) && savedRecs.length > 0) {
            setSavedAiRecommendations(savedRecs);
            // Load completion status from database
            try {
              const completionsRes = await fetch(`${API_BASE_URL}/ai-recommendation-completions?trade_id=${tradeId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (completionsRes.ok) {
                const completions = await completionsRes.json();
                const completionMap: Record<string, boolean> = {};
                completions.forEach((c: { recommendation_text: string; completed: boolean }) => {
                  completionMap[c.recommendation_text] = c.completed;
                });
                setAiRecommendationCompletions(completionMap);
              }
            } catch (e) {
              console.warn('Could not load AI recommendation completions:', e);
            }
          }
          
          const existingScreenshot = trade.screenshot_url || trade.screenshot;
          if (existingScreenshot) {
            const pathForDb = existingScreenshot.startsWith('http') ? existingScreenshot : (existingScreenshot.startsWith('/') ? existingScreenshot : '/' + existingScreenshot);
            setExistingScreenshotUrl(pathForDb);
            const url = existingScreenshot.startsWith('http') 
              ? existingScreenshot 
              : `${API_ORIGIN}${existingScreenshot.startsWith('/') ? existingScreenshot : '/' + existingScreenshot}`;
            setScreenshotPreview(url);
          } else {
            setExistingScreenshotUrl(null);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load trade data';
          toast({
            title: 'Error',
            description: 'Failed to load trade data',
            variant: 'destructive',
          });
          navigate('/trades');
        } finally {
          setIsLoadingTrade(false);
        }
      };

      loadTrade();
    }
    const loadChecklists = async () => {
      const data = await fetchChecklists();
      setChecklists(data);
    };
    loadChecklists();
  }, [isEditing, tradeId, setValue, navigate, toast, fetchChecklists, getChecklist]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchSetupTypes();
      setSetupTypes(data.map(s => ({ id: s.id, name: s.name, description: s.description })));
    };
    load();
  }, [fetchSetupTypes]);

  // Load AI insights when component mounts
  useEffect(() => {
    if (activeJournal?.id && !insights) {
      fetchInsights();
    }
  }, [activeJournal?.id, insights, fetchInsights]);

  // Initialize AI recommendation completions from insights (only for new trades, not editing)
  useEffect(() => {
    if (!isEditing && insights?.actionItems) {
      const initial: Record<string, boolean> = {};
      insights.actionItems.forEach((item) => {
        const text = typeof item === 'string' ? item : String(item || '').trim();
        if (text) initial[text] = false;
      });
      if (insights.topAction) {
        initial[insights.topAction] = false;
      }
      setAiRecommendationCompletions(initial);
    }
  }, [insights, isEditing]);

  // Auto-save notes and lessons learned to localStorage
  const getDraftKey = () => {
    if (isEditing && tradeId) {
      return `tradebuddy-draft-notes-${tradeId}`;
    }
    return 'tradebuddy-draft-notes-new';
  };

  // Load draft notes/lessons on mount (only for new trades)
  useEffect(() => {
    if (!isEditing) {
      try {
        const draftKey = getDraftKey();
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.notes) setValue('notes', draft.notes);
          if (draft.lessonsLearned) setValue('lessonsLearned', draft.lessonsLearned);
        }
      } catch (e) {
        console.warn('Could not load draft notes:', e);
      }
    }
  }, [isEditing, setValue]);

  // Auto-save notes and lessons learned with debouncing
  useEffect(() => {
    if (isEditing) return; // Don't auto-save when editing (use saved trade data)
    
    const timeoutId = setTimeout(() => {
      try {
        const draftKey = getDraftKey();
        const draft = {
          notes: notes || '',
          lessonsLearned: lessonsLearned || '',
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (e) {
        console.warn('Could not save draft notes:', e);
      }
    }, 500); // Debounce: save 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [notes, lessonsLearned, isEditing]);

  const handleScreenshotChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const removeScreenshot = useCallback(() => {
    setScreenshot(null);
    setScreenshotPreview(null);
    setExistingScreenshotUrl(null);
  }, []);

  const onSubmit = useCallback(async (data: TradeFormData) => {
    setIsSubmitting(true);

    try {
      // 1. Upload screenshot if present, otherwise preserve existing when editing
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        const uploadUrl = `${API_BASE_URL.replace(/\/$/, '')}/upload`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json().catch(() => ({}));
          const msg = errData?.error || errData?.message || `Screenshot upload failed (${uploadResponse.status})`;
          throw new Error(msg);
        }
        const uploadData = await uploadResponse.json();
        screenshotUrl = uploadData.url;
      } else if (isEditing && tradeId && existingScreenshotUrl) {
        screenshotUrl = existingScreenshotUrl;
      }

      // Upload voice notes for notes field - use ref to get latest state synchronously
      const currentNotesVoiceNotes = notesVoiceNotesRef.current;
      const newNotesVoiceNoteUrls: Array<{ url: string; duration?: number; transcript?: string; field: string }> = [];
      console.log('[AddTrade] Uploading notes voice notes from ref:', currentNotesVoiceNotes.length, 'items');
      if (currentNotesVoiceNotes.length > 0) {
        const token = localStorage.getItem('token');
        for (const voiceNote of currentNotesVoiceNotes) {
          try {
            const formData = new FormData();
            formData.append('file', voiceNote.blob, `voice-notes-${voiceNote.id}.webm`);
            const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              const voiceNoteUrl = uploadData.url || uploadData.path;
              if (voiceNoteUrl) {
                newNotesVoiceNoteUrls.push({
                  url: voiceNoteUrl,
                  duration: voiceNote.duration,
                  transcript: voiceNote.transcript,
                  field: 'notes',
                });
                console.log('[AddTrade] Uploaded notes voice note:', voiceNoteUrl);
              } else {
                console.warn('[AddTrade] Upload response missing URL:', uploadData);
              }
            } else {
              const errorText = await uploadRes.text().catch(() => 'Unknown error');
              console.error('[AddTrade] Voice note upload failed:', uploadRes.status, errorText);
            }
          } catch (err) {
            console.error('[AddTrade] Failed to upload notes voice note:', err);
          }
        }
      }

      // Upload voice notes for lessonsLearned field - use ref to get latest state synchronously
      const currentLessonsVoiceNotes = lessonsVoiceNotesRef.current;
      const newLessonsVoiceNoteUrls: Array<{ url: string; duration?: number; transcript?: string; field: string }> = [];
      console.log('[AddTrade] Uploading lessons voice notes from ref:', currentLessonsVoiceNotes.length, 'items');
      if (currentLessonsVoiceNotes.length > 0) {
        const token = localStorage.getItem('token');
        for (const voiceNote of currentLessonsVoiceNotes) {
          try {
            const formData = new FormData();
            formData.append('file', voiceNote.blob, `voice-lessons-${voiceNote.id}.webm`);
            const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              const voiceNoteUrl = uploadData.url || uploadData.path;
              if (voiceNoteUrl) {
                newLessonsVoiceNoteUrls.push({
                  url: voiceNoteUrl,
                  duration: voiceNote.duration,
                  transcript: voiceNote.transcript,
                  field: 'lessons',
                });
                console.log('[AddTrade] Uploaded lessons voice note:', voiceNoteUrl);
              } else {
                console.warn('[AddTrade] Upload response missing URL:', uploadData);
              }
            } else {
              const errorText = await uploadRes.text().catch(() => 'Unknown error');
              console.error('[AddTrade] Voice note upload failed:', uploadRes.status, errorText);
            }
          } catch (err) {
            console.error('[AddTrade] Failed to upload lessons voice note:', err);
          }
        }
      }

      // Combine saved and new voice notes
      const allVoiceNoteUrls = [
        ...savedNotesVoiceNotes.map(vn => ({ ...vn, field: 'notes' })),
        ...savedLessonsVoiceNotes.map(vn => ({ ...vn, field: 'lessons' })),
        ...newNotesVoiceNoteUrls,
        ...newLessonsVoiceNoteUrls,
      ];

      console.log('[AddTrade] Total voice notes to save:', allVoiceNoteUrls.length, {
        savedNotes: savedNotesVoiceNotes.length,
        savedLessons: savedLessonsVoiceNotes.length,
        newNotes: newNotesVoiceNoteUrls.length,
        newLessons: newLessonsVoiceNoteUrls.length,
        notesVoiceNotesState: notesVoiceNotes.length,
        notesVoiceNotesRef: currentNotesVoiceNotes.length,
        lessonsVoiceNotesState: lessonsVoiceNotes.length,
        lessonsVoiceNotesRef: currentLessonsVoiceNotes.length,
        allVoiceNoteUrls: allVoiceNoteUrls,
      });
      
      // Warn if we have voice notes in ref but they weren't uploaded
      if (currentNotesVoiceNotes.length > 0 && newNotesVoiceNoteUrls.length === 0) {
        console.warn('[AddTrade] WARNING: notesVoiceNotesRef has', currentNotesVoiceNotes.length, 'items but none were uploaded!');
      }
      if (currentLessonsVoiceNotes.length > 0 && newLessonsVoiceNoteUrls.length === 0) {
        console.warn('[AddTrade] WARNING: lessonsVoiceNotesRef has', currentLessonsVoiceNotes.length, 'items but none were uploaded!');
      }

      // 2. Build trade payload - use refs to get latest checklist state (avoids state batching race)
      const pre = preChecklistRef.current;
      const dur = duringChecklistRef.current;
      const post = postChecklistRef.current;
      const rule = ruleChecklistRef.current;
      const preItems = Array.isArray(pre.items) ? pre.items : [];
      const durItems = Array.isArray(dur.items) ? dur.items : [];
      const postItems = Array.isArray(post.items) ? post.items : [];
      const ruleItems = Array.isArray(rule.items) ? rule.items : [];
      const effectiveExitPrice = data.exitPrice ?? data.takeProfitPrice ?? undefined;
      const effectiveSession = data.session || sessionFromEntryTime(data.entryTime) || undefined;
      const tradeData: Record<string, unknown> = {
        symbol: data.symbol,
        tradeType: data.type,
        type: data.type,
        direction: data.type === 'buy' || data.type === 'long' ? 'buy' : 'sell',
        entryPrice: data.entryPrice,
        exitPrice: effectiveExitPrice,
        quantity: data.quantity,
        positionSize: calculations.positionSize,
        entryTime: data.entryTime.toISOString(),
        exitTime: data.exitTime?.toISOString() || null,
        emotion: Array.isArray(data.emotions) ? data.emotions.join(',') : (data.emotions?.[0] ?? 'calm'),
        setupType: data.setupType || null,
        marketCondition: null,
        notes: data.notes || null,
        lessonsLearned: (data.lessonsLearned && String(data.lessonsLearned).trim()) || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : null,
        accountId: activeJournal?.id,
        checklistId: pre.id || undefined,
        checklistItems: preItems,
        duringChecklistId: dur.id || undefined,
        duringChecklistItems: durItems,
        postChecklistId: post.id || undefined,
        postChecklistItems: postItems,
        ruleId: rule.id || undefined,
        ruleItems,
        tradeGrade: tradeGrade || undefined,
        pnl: calculations.pnl,
        pnlPercent: calculations.pnlPercent,
        duration: calculations.duration,
        screenshot: screenshotUrl,
        voiceNoteUrls: allVoiceNoteUrls.length > 0 ? allVoiceNoteUrls : undefined,
        // Debug: Log voice notes being sent
        ...(allVoiceNoteUrls.length > 0 && { _debugVoiceNotes: allVoiceNoteUrls.length }),
        plannedRiskAmount: data.plannedRiskAmount ?? undefined,
        plannedRiskPercent: riskCalculations.plannedRiskPercent ?? data.plannedRiskPercent ?? undefined,
        stopLossPrice: data.stopLossPrice ?? undefined,
        takeProfitPrice: data.takeProfitPrice ?? undefined,
        plannedRR: riskCalculations.plannedRR ?? data.plannedRR ?? undefined,
        actualRR: riskCalculations.actualRR ?? data.actualRR ?? undefined,
        rMultiple: riskCalculations.rMultiple ?? data.rMultiple ?? undefined,
        tradeNumberOfDay: data.tradeNumberOfDay ?? undefined,
        session: effectiveSession ?? data.session ?? undefined,
        riskConsistencyFlag: data.riskConsistencyFlag ?? undefined,
        checklistCompletionPercent: checklistCompletion ?? data.checklistCompletionPercent ?? undefined,
        aiRecommendations: !isEditing && insights ? (() => {
          const allRecs: string[] = [];
          
          // Add topAction if it exists
          if (insights.topAction && typeof insights.topAction === 'string') {
            const topActionText = insights.topAction.trim();
            if (topActionText) allRecs.push(topActionText);
          }
          
          // Add all actionItems
          if (Array.isArray(insights.actionItems)) {
            insights.actionItems.forEach(item => {
              const text = typeof item === 'string' ? item.trim() : String(item || '').trim();
              if (text && !allRecs.includes(text)) { // Avoid duplicates
                allRecs.push(text);
              }
            });
          }
          
          return allRecs.length > 0 ? allRecs : undefined;
        })() : (isEditing && savedAiRecommendations.length > 0 ? savedAiRecommendations : undefined),
      };

      let savedTradeId: string;
      if (isEditing && tradeId) {
        await tradeApi.updateTrade(tradeId, tradeData);
        savedTradeId = tradeId;
      } else {
        const created = await tradeApi.addTrade(tradeData);
        savedTradeId = created.id;
      }

      // Save AI recommendation completions
      // Use saved recommendations if editing, otherwise use current insights
      let recommendationsToSave: string[] = [];
      
      if (isEditing && savedAiRecommendations.length > 0) {
        recommendationsToSave = savedAiRecommendations;
      } else if (insights) {
        const recs: string[] = [];
        
        // Add topAction if it exists
        if (insights.topAction && typeof insights.topAction === 'string') {
          const topActionText = insights.topAction.trim();
          if (topActionText) recs.push(topActionText);
        }
        
        // Add all actionItems
        if (Array.isArray(insights.actionItems)) {
          insights.actionItems.forEach(item => {
            const text = typeof item === 'string' ? item.trim() : String(item || '').trim();
            if (text && !recs.includes(text)) { // Avoid duplicates
              recs.push(text);
            }
          });
        }
        
        recommendationsToSave = recs;
      }
      
      if (recommendationsToSave.length > 0 && Object.keys(aiRecommendationCompletions).length > 0) {
        try {
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;

          // Save completions for each recommendation
          for (const recText of recommendationsToSave) {
            const completed = aiRecommendationCompletions[recText] || false;
            await fetch(`${API_BASE_URL}/ai-recommendation-completions`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                trade_id: savedTradeId,
                recommendation_text: recText,
                completed,
                journal_id: activeJournal?.id,
              }),
            });
          }

          // Store recommendations array in trade for reference (preserve history)
          if (!isEditing) {
            await fetch(`${API_BASE_URL}/trades/${savedTradeId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                ai_recommendations: recommendationsToSave,
              }),
            });
          }
        } catch (e) {
          console.warn('Could not save AI recommendation completions:', e);
        }
      }

      const lessonsText = (data.lessonsLearned && String(data.lessonsLearned).trim()) || null;
      if (lessonsText) {
        try {
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;

          const title = `Lesson from ${data.symbol} – ${data.entryTime ? new Date(data.entryTime).toLocaleDateString() : new Date().toLocaleDateString()}`;
          // Include lessons voice notes when saving to education
          const lessonsVoiceNoteUrls = [
            ...savedLessonsVoiceNotes,
            ...newLessonsVoiceNoteUrls.map(vn => ({ url: vn.url, duration: vn.duration, transcript: vn.transcript })),
          ];
          console.log('[AddTrade] Syncing lessons to Education with', lessonsVoiceNoteUrls.length, 'voice notes:', lessonsVoiceNoteUrls);
          const payload = {
            title,
            content: stripVoiceNotePlaceholders(lessonsText), // Strip placeholders from content
            category: 'lesson',
            tags: [data.symbol, 'from-trade'],
            trade_id: savedTradeId,
            voice_note_urls: lessonsVoiceNoteUrls.length > 0 ? lessonsVoiceNoteUrls : undefined,
          };
          console.log('[AddTrade] Education payload:', payload);

          const existingRes = await fetch(`${API_BASE_URL}/education-notes?trade_id=${savedTradeId}`, { headers });
          const existing = (await existingRes.json()) as Array<{ id: string }>;
          if (Array.isArray(existing) && existing.length > 0) {
            await fetch(`${API_BASE_URL}/education-notes/${existing[0].id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(payload),
        });
      } else {
            await fetch(`${API_BASE_URL}/education-notes`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });
          }
        } catch (e) {
          console.warn('Could not create/update education note:', e);
        }
      }

      // Clear draft notes from localStorage after successful save
      try {
        const draftKey = isEditing && tradeId ? `tradebuddy-draft-notes-${tradeId}` : 'tradebuddy-draft-notes-new';
        localStorage.removeItem(draftKey);
      } catch (e) {
        console.warn('Could not clear draft notes:', e);
      }

      toast({
        title: isEditing ? 'Trade Updated' : 'Trade Added',
        description: lessonsText ? 'Your trade and lesson have been saved. View your revelation in Education.' : 'Your trade has been successfully saved.',
      });

      navigate('/trades');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save trade. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [screenshot, calculations, riskCalculations, checklistCompletion, sessionFromEntryTime, activeJournal, isEditing, tradeId, navigate, toast, preChecklistId, preChecklistItems, duringChecklistId, duringChecklistItems, postChecklistId, postChecklistItems, ruleChecklistId, ruleChecklistItems, tradeGrade]);

  if (isLoadingTrade) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-primary" />
          <p>Loading trade data...</p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: themeConfig.card,
    borderColor: themeConfig.border,
    color: themeConfig.foreground,
  };
  const labelStyle = { color: themeConfig.foreground };
  const errorStyle = { color: themeConfig.destructive };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeConfig.bg }}>
      <PageContainer>
      {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b" style={{ borderColor: themeConfig.border }}>
          <div className="flex items-center gap-4">
            <NeonButton variant="ghost" onClick={() => navigate('/trades')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </NeonButton>
          <div>
              <h1 className="text-3xl font-bold" style={{ color: themeConfig.foreground }}>{isEditing ? 'Edit Trade' : 'Add New Trade'}</h1>
              <p style={{ color: themeConfig.mutedForeground }}>
                {isEditing ? 'Update your trade details' : 'Record your trading activity'}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, (err) => {
            const firstError = Object.values(err)[0]?.message;
            toast({
              title: 'Validation failed',
              description: firstError || 'Please check the required fields and fix any errors.',
              variant: 'destructive',
            });
          })}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
            {/* Import from Broker Report - only when adding, not editing */}
            {!isEditing && (
            <NeonCard className="p-6" hover={false} shineBorder>
              <button
                type="button"
                onClick={() => setShowImportPanel(!showImportPanel)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                  <FileUp className="w-5 h-5" style={{ color: themeConfig.accent }} />
                  Import from Broker Report
                </h2>
                {showImportPanel ? <ChevronUp className="w-5 h-5" style={{ color: themeConfig.mutedForeground }} /> : <ChevronDown className="w-5 h-5" style={{ color: themeConfig.mutedForeground }} />}
              </button>
              <p className="text-sm mt-1" style={{ color: themeConfig.mutedForeground }}>
                Upload MT4/MT5 HTML, XML, or XLSX report to pre-fill fields from deals
              </p>
              {showImportPanel && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      ref={reportFileInputRef}
                      type="file"
                      accept=".html,.htm,.xml,.xlsx,.xls"
                      onChange={handleReportFileChange}
                      disabled={parsingReport}
                      className="hidden"
                    />
                    <NeonButton
                      type="button"
                      variant="secondary"
                      disabled={parsingReport}
                      onClick={() => reportFileInputRef.current?.click()}
                    >
                      {parsingReport ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose HTML, XML or XLSX file
                        </>
                      )}
                    </NeonButton>
                  </div>
                  {importedDeals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
                        Click a position to fill the form:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-2" style={{ borderColor: themeConfig.border }}>
                        {importedDeals.map((deal, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => applyDealToForm(deal)}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: `${themeConfig.accent}10`, border: `1px solid ${themeConfig.border}` }}
                          >
                            <span className="font-medium" style={{ color: themeConfig.foreground }}>
                              {deal.symbol} {deal.type} {deal.quantity}
                            </span>
                            <span style={{ color: deal.pnl >= 0 ? themeConfig.success : themeConfig.destructive }}>
                              {deal.pnl >= 0 ? '+' : ''}{deal.pnl.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </NeonCard>
            )}

            {/* Basic Info */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <BarChart3 className="w-5 h-5" style={{ color: themeConfig.accent }} />
                      Trade Details
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol" className="text-sm font-medium" style={labelStyle}>Symbol *</Label>
                  <Input
                    id="symbol"
                    {...register('symbol', { required: true })}
                      placeholder="e.g., AAPL, BTC-USD"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                  {errors.symbol && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.symbol.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium" style={labelStyle}>Trade Type *</Label>
                  <div className="flex gap-2 mt-2">
                    <NeonButton
                          type="button"
                      variant="secondary"
                      onClick={() => setValue('type', tradeType === 'short' ? 'long' : 'buy')}
                      className={`flex-1 relative ${tradeType === 'buy' || tradeType === 'long' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background' : ''}`}
                    >
                      {(tradeType === 'buy' || tradeType === 'long') && (
                        <Check className="w-4 h-4 absolute top-2 right-2 text-green-500" strokeWidth={3} />
                      )}
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Buy
                    </NeonButton>
                    <NeonButton
                          type="button"
                      variant="secondary"
                      onClick={() => setValue('type', tradeType === 'long' ? 'short' : 'sell')}
                      className={`flex-1 relative ${tradeType === 'sell' || tradeType === 'short' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background' : ''}`}
                    >
                      {(tradeType === 'sell' || tradeType === 'short') && (
                        <Check className="w-4 h-4 absolute top-2 right-2 text-green-500" strokeWidth={3} />
                      )}
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Sell
                    </NeonButton>
                      </div>
                    </div>
              </div>
            </NeonCard>

            {/* Risk Architecture */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
                Risk Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plannedRiskAmount" className="text-sm font-medium" style={labelStyle}>Planned Risk Amount ($)</Label>
                  <Input
                    id="plannedRiskAmount"
                    type="number"
                    step="0.01"
                    {...register('plannedRiskAmount', {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v))) ? null : Number(v),
                    })}
                    placeholder="e.g. 100"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label htmlFor="stopLossPrice" className="text-sm font-medium" style={labelStyle}>Stop Loss Price</Label>
                  <Input
                    id="stopLossPrice"
                    type="number"
                    step="0.01"
                    {...register('stopLossPrice', {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v))) ? null : Number(v),
                    })}
                    placeholder="e.g. 19230"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label htmlFor="takeProfitPrice" className="text-sm font-medium" style={labelStyle}>Take Profit Price</Label>
                  <Input
                    id="takeProfitPrice"
                    type="number"
                    step="0.01"
                    {...register('takeProfitPrice', {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v))) ? null : Number(v),
                    })}
                    placeholder="e.g. 19350"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label htmlFor="tradeNumberOfDay" className="text-sm font-medium" style={labelStyle}>Trade Number of Day</Label>
                  <Input
                    id="tradeNumberOfDay"
                    type="number"
                    step="1"
                    {...register('tradeNumberOfDay', {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v))) ? null : parseInt(String(v), 10),
                    })}
                    placeholder="auto if empty"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label htmlFor="session" className="text-sm font-medium" style={labelStyle}>Session</Label>
                  <select
                    id="session"
                    {...register('session', {
                      setValueAs: (v) => v === '' ? null : v,
                    })}
                    className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                    style={inputStyle}
                  >
                    <option value="">Auto</option>
                    <option value="Asia">Asia</option>
                    <option value="London">London</option>
                    <option value="NewYork">New York</option>
                    <option value="Other">Other</option>
                  </select>
                  <p className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>Auto from entry time if empty</p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 mt-1.5">
                    <input type="checkbox" {...register('riskConsistencyFlag')} />
                    <span style={{ color: themeConfig.foreground }}>Risk Consistency Flag</span>
                  </label>
                </div>
              </div>
            </NeonCard>

              {/* Price & Quantity */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <DollarSign className="w-5 h-5" style={{ color: themeConfig.accent }} />
                      Price & Quantity
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryPrice" className="text-sm font-medium" style={labelStyle}>Entry Price *</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    {...register('entryPrice', { valueAsNumber: true, required: true })}
                      placeholder="0.00"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                  {errors.entryPrice && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.entryPrice.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="exitPrice" className="text-sm font-medium" style={labelStyle}>Exit Price</Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    {...register('exitPrice', { 
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v))) ? null : Number(v)
                    })}
                    placeholder="Leave empty if TP was hit (TP used as exit)"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                  {errors.exitPrice && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.exitTime?.message || errors.exitPrice?.message}
                    </p>
                  )}
              </div>

                <div>
                  <Label htmlFor="pnl" className="text-sm font-medium" style={labelStyle}>P&L *</Label>
                  <Input
                    id="pnl"
                    type="number"
                    step="0.01"
                    {...register('pnl', { valueAsNumber: true, required: true })}
                    placeholder="0.00"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                  {errors.pnl && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.pnl.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium" style={labelStyle}>Quantity *</Label>
                  <Input
                    id="quantity"
                      type="number"
                      step="0.01"
                    {...register('quantity', { valueAsNumber: true, required: true })}
                      placeholder="0"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                  />
                  {errors.quantity && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
              </div>
            </NeonCard>

              {/* Timing */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <Clock className="w-5 h-5" style={{ color: themeConfig.accent }} />
                      Timing
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryTime" className="text-sm font-medium" style={labelStyle}>Entry Time *</Label>
                  <Controller
                    name="entryTime"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                      const val = field.value;
                      const date = val instanceof Date ? val : val ? new Date(val) : new Date();
                      const isValid = date && !isNaN(date.getTime());
                      return (
                  <Input
                    id="entryTime"
                  type="datetime-local"
                          value={isValid ? toLocalDatetimeString(date) : ''}
                          onChange={(e) => {
                            const parsed = parseLocalDatetimeString(e.target.value);
                            if (parsed) {
                              field.onChange(parsed);
                              const exitVal = watch('exitTime');
                              if (!exitVal || (exitVal instanceof Date && isNaN(exitVal.getTime()))) {
                                const exitDate = new Date(parsed.getTime() + 60 * 60 * 1000);
                                setValue('exitTime', exitDate);
                              }
                            }
                          }}
                          className="mt-1.5 rounded-xl"
                          style={inputStyle}
                        />
                      );
                    }}
                  />
                  {errors.entryTime && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.entryTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="exitTime" className="text-sm font-medium" style={labelStyle}>Exit Time</Label>
                  <Controller
                    name="exitTime"
                    control={control}
                    render={({ field }) => {
                      const val = field.value;
                      const date = val instanceof Date ? val : val ? new Date(val) : null;
                      const isValid = date && !isNaN(date.getTime());
                      return (
                  <Input
                    id="exitTime"
                  type="datetime-local"
                          value={isValid ? toLocalDatetimeString(date) : ''}
                          onChange={(e) => {
                            const parsed = parseLocalDatetimeString(e.target.value);
                            field.onChange(parsed || undefined);
                          }}
                          className="mt-1.5 rounded-xl"
                          style={inputStyle}
                        />
                      );
                    }}
                  />
                  {errors.exitTime && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.exitTime.message}
                    </p>
                  )}
                </div>
              </div>
            </NeonCard>

            {/* Psychology */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <Heart className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Psychology & Analysis
                    </h2>
                  
                  <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium" style={labelStyle}>Emotions *</Label>
                  <p className="text-xs mb-2" style={{ color: themeConfig.mutedForeground }}>Select all that apply — you can feel multiple at once</p>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {emotionOptions.map((em) => {
                      const selected = Array.isArray(emotions) && emotions.includes(em);
                      return (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            const current = Array.isArray(emotions) ? [...emotions] : [];
                            const idx = current.indexOf(em);
                            let next: Emotion[];
                            if (idx >= 0) {
                              next = current.filter((_, i) => i !== idx);
                              if (next.length === 0) next = [em];
                            } else {
                              next = [...current, em];
                            }
                            setValue('emotions', next);
                          }}
                          className={cn(
                            'flex items-center justify-center rounded-lg border-2 p-2 transition-all',
                            selected ? 'ring-2' : 'opacity-70 hover:opacity-100'
                          )}
                          style={{
                            borderColor: selected ? themeConfig.accent : themeConfig.border,
                            backgroundColor: selected ? `${themeConfig.accent}15` : themeConfig.card,
                          }}
                        >
                          <EmotionTag emotion={em} size="sm" />
                        </button>
                      );
                    })}
                      </div>
                  {errors.emotions && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={errorStyle}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.emotions.message}
                    </p>
                  )}
                    </div>
                    
                <div>
                  <Label htmlFor="setupType" className="text-sm font-medium" style={labelStyle}>Setup Type</Label>
                  <select
                    id="setupType"
                    {...register('setupType')}
                    className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                    style={inputStyle}
                  >
                    <option value="">Select setup type...</option>
                    {setupTypes.map((st) => (
                      <option key={st.id} value={st.name}>{st.name}</option>
                    ))}
                    {/* Show current value when editing if not in predefined list (legacy/custom) */}
                    {watch('setupType') && !setupTypes.some(st => st.name === watch('setupType')) && (
                      <option value={watch('setupType')}>{watch('setupType')} (custom)</option>
                    )}
                  </select>
                  {watch('setupType') ? (
                    <p className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
                      {setupTypes.find(st => st.name === watch('setupType'))?.description || 'No description'}
                    </p>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
                      Define setup types in Rules, Setups & Checklists
                    </p>
                  )}
            </div>

                    <div>
                  <Label className="text-sm font-medium" style={labelStyle}>Setup Grade</Label>
                  <div className="flex gap-2 mt-1.5">
                    {(['A', 'B', 'C'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setTradeGrade(tradeGrade === g ? null : g)}
                        className={cn(
                          'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all',
                          tradeGrade === g
                            ? 'ring-2'
                            : 'opacity-60 hover:opacity-100'
                        )}
                        style={{
                          backgroundColor: tradeGrade === g ? `${themeConfig.accent}20` : themeConfig.card,
                          border: `1px solid ${tradeGrade === g ? themeConfig.accent : themeConfig.border}`,
                          color: tradeGrade === g ? themeConfig.accent : themeConfig.foreground,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>Rate your setup quality: A (best) to C</p>
                </div>

                    <div>
                  <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-2" style={labelStyle}>Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                        placeholder="e.g., scalping, momentum, reversal"
                    className="mt-1.5 rounded-xl"
                    style={inputStyle}
                      />
                    </div>

                    <div>
                  <Label htmlFor="notes" className="text-sm font-medium" style={labelStyle}>Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Add your trading notes or observations..."
                        rows={4}
                    className="mt-1.5 rounded-xl resize-y"
                    style={inputStyle}
              />
              {/* Display saved voice notes from database */}
              {savedNotesVoiceNotes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                    Saved Voice Notes
                  </Label>
                  {savedNotesVoiceNotes.map((vn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
                    >
                      <div className="flex items-center gap-3">
                        <AudioPlayer
                          src={getVoiceNoteAudioUrl(vn.url)}
                          duration={vn.duration}
                        />
                        {vn.duration && (
                          <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                            {Math.floor(vn.duration / 60)}:{(vn.duration % 60).toFixed(0).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSavedNotesVoiceNotes((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 rounded hover:opacity-80"
                        style={{ color: themeConfig.destructive }}
                        title="Remove voice note"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <VoiceRecorder
                  onSaveNote={(voiceNote) => {
                    console.log('[AddTrade] VoiceRecorder onSaveNote called for notes:', voiceNote);
                    // Voice note is stored in voice_note_urls; do not append placeholder to notes text
                    setNotesVoiceNotes((prev) => {
                      const updated = [...prev, voiceNote];
                      notesVoiceNotesRef.current = updated; // Keep ref in sync
                      console.log('[AddTrade] Updated notesVoiceNotes:', updated.length, 'items');
                      return updated;
                    });
                  }}
                  onDeleteNote={(id) => {
                    console.log('[AddTrade] Deleting voice note:', id);
                    setNotesVoiceNotes((prev) => {
                      const updated = prev.filter((vn) => vn.id !== id);
                      notesVoiceNotesRef.current = updated; // Keep ref in sync
                      return updated;
                    });
                  }}
                  existingNotes={notesVoiceNotes}
                  maxDuration={180}
                />
              </div>
            </div>

                    <div>
                  <Label htmlFor="lessonsLearned" className="text-sm font-medium flex items-center gap-2" style={labelStyle}>
                    <Lightbulb className="w-4 h-4" style={{ color: themeConfig.accent }} />
                    Lessons Learnt
                  </Label>
                  <Textarea
                    id="lessonsLearned"
                    {...register('lessonsLearned')}
                    placeholder="What revelations or lessons did you take away from this trade? These will be saved to Education so you can revisit your insights."
                    rows={3}
                    className="mt-1.5 rounded-xl resize-y"
                    style={inputStyle}
                  />
                  <p className="text-xs mt-1" style={{ color: themeConfig.mutedForeground }}>
                    Synced to Education after saving — revisit your insights anytime
                  </p>
                  {/* Display saved voice notes from database */}
                  {savedLessonsVoiceNotes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                        Saved Voice Notes
                      </Label>
                      {savedLessonsVoiceNotes.map((vn, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
                        >
                          <div className="flex items-center gap-3">
                            <AudioPlayer
                              src={getVoiceNoteAudioUrl(vn.url)}
                              duration={vn.duration}
                            />
                            {vn.duration && (
                              <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                                {Math.floor(vn.duration / 60)}:{(vn.duration % 60).toFixed(0).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSavedLessonsVoiceNotes((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded hover:opacity-80"
                            style={{ color: themeConfig.destructive }}
                            title="Remove voice note"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <VoiceRecorder
                      onSaveNote={(voiceNote) => {
                        console.log('[AddTrade] VoiceRecorder onSaveNote called for lessons:', voiceNote);
                        // Voice note is stored in voice_note_urls; do not append placeholder to lessons text
                        setLessonsVoiceNotes((prev) => {
                          const updated = [...prev, voiceNote];
                          lessonsVoiceNotesRef.current = updated; // Keep ref in sync
                          console.log('[AddTrade] Updated lessonsVoiceNotes:', updated.length, 'items');
                          return updated;
                        });
                      }}
                      onDeleteNote={(id) => {
                        console.log('[AddTrade] Deleting lessons voice note:', id);
                        setLessonsVoiceNotes((prev) => {
                          const updated = prev.filter((vn) => vn.id !== id);
                          lessonsVoiceNotesRef.current = updated; // Keep ref in sync
                          return updated;
                        });
                      }}
                      existingNotes={lessonsVoiceNotes}
                      maxDuration={180}
                    />
                  </div>
                  </div>
                  </div>
            </NeonCard>

            {/* Rules & Checklists */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <CheckSquare className="w-5 h-5" style={{ color: themeConfig.accent }} />
                Rules & Checklists
              </h2>
              <p className="text-sm mb-4" style={{ color: themeConfig.mutedForeground }}>
                Select rules and checklists, then tick off items as you follow them. All are saved with the trade.
              </p>

              {/* Rules - tickable when adding trade */}
              <div className="mb-6">
                <Label className="text-sm font-medium flex items-center gap-2" style={labelStyle}>
                  <AlertCircle className="w-4 h-4" style={{ color: themeConfig.accent }} />
                  Rules
                </Label>
                <select
                  value={ruleChecklistId || ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setRuleChecklistId(id);
                    if (id) {
                      const cl = checklists.find((c: { type?: string }) => c.type === 'rule' && c.id === id) || checklists.find(c => c.id === id);
                      const newItems = cl?.items?.length
                        ? cl.items.map((it: { id: string; text: string; completed?: boolean }) => ({ id: it.id, text: it.text, completed: it.completed ?? false }))
                        : [];
                      setRuleChecklistItems(newItems);
                      ruleChecklistRef.current = { id, items: newItems };
                    } else {
                      setRuleChecklistItems([]);
                      ruleChecklistRef.current = { id: null, items: [] };
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={inputStyle}
                >
                  <option value="">None</option>
                  {checklists.filter((c: { type?: string }) => c.type === 'rule').map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {ruleChecklistItems.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                        {ruleChecklistItems.filter(i => i.completed).length}/{ruleChecklistItems.length} followed
                      </p>
                      <NeonButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          const allDone = ruleChecklistItems.every(i => i.completed);
                          const newItems = ruleChecklistItems.map(it => ({ ...it, completed: !allDone }));
                          setRuleChecklistItems(newItems);
                          ruleChecklistRef.current = { id: ruleChecklistId, items: newItems };
                        }}
                      >
                        {ruleChecklistItems.every(i => i.completed) ? 'Deselect all' : 'Select all'}
                      </NeonButton>
                    </div>
                    {ruleChecklistItems.map((item, idx) => (
                      <label
                        key={item.id || idx}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
                        style={{ backgroundColor: themeConfig.card }}
                        onClick={() => {
                          const newItems = ruleChecklistItems.map(it =>
                            it.id === item.id ? { ...it, completed: !it.completed } : it
                          );
                          setRuleChecklistItems(newItems);
                          ruleChecklistRef.current = { id: ruleChecklistId, items: newItems };
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border-2"
                          style={{
                            borderColor: item.completed ? themeConfig.accent : '#ef4444',
                            backgroundColor: item.completed ? `${themeConfig.accent}30` : 'rgba(239,68,68,0.1)',
                          }}
                        >
                          {item.completed ? <Check className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
                        </span>
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through opacity-70' : ''}`} style={{ color: themeConfig.foreground }}>{item.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklists - Pre / During / Post Trade */}
              {(['pre', 'during', 'post'] as const).map((phase) => {
                const labels = { pre: 'Pre-Trade', during: 'During Trade', post: 'Post-Trade' };
                const checklistIds = { pre: preChecklistId, during: duringChecklistId, post: postChecklistId };
                const setChecklistIds = { pre: setPreChecklistId, during: setDuringChecklistId, post: setPostChecklistId };
                const itemsList = { pre: preChecklistItems, during: duringChecklistItems, post: postChecklistItems };
                const setItemsList = { pre: setPreChecklistItems, during: setDuringChecklistItems, post: setPostChecklistItems };
                const refs = { pre: preChecklistRef, during: duringChecklistRef, post: postChecklistRef };
                const filtered = checklists.filter(c => (c as { type?: string }).type === phase);
                const selId = checklistIds[phase];
                const items = itemsList[phase];
                const setItems = setItemsList[phase];
                const ref = refs[phase];
                const syncRef = (id: string | null, newItems: Array<{ id: string; text: string; completed: boolean }>) => {
                  ref.current = { id, items: newItems };
                };
                return (
                  <div key={phase} className="mb-6 last:mb-0">
                    <Label className="text-sm font-medium" style={labelStyle}>{labels[phase]}</Label>
                    <select
                      value={selId || ''}
                      onChange={(e) => {
                        const id = e.target.value || null;
                        setChecklistIds[phase](id);
                        if (id) {
                          const cl = checklists.find(c => c.id === id);
                          const newItems = cl?.items?.length
                            ? cl.items.map(it => ({ id: it.id, text: it.text, completed: it.completed ?? false }))
                            : [];
                          setItems(newItems);
                          syncRef(id, newItems);
                        } else {
                          setItems([]);
                          syncRef(null, []);
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
                      style={inputStyle}
                    >
                      <option value="">None</option>
                      {filtered.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {items.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                            {items.filter(i => i.completed).length}/{items.length} completed
                          </p>
                          <NeonButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              const allDone = items.every(i => i.completed);
                              const newItems = items.map(it => ({ ...it, completed: !allDone }));
                              setItems(newItems);
                              syncRef(selId || null, newItems);
                            }}
                          >
                            {items.every(i => i.completed) ? 'Deselect all' : 'Select all'}
                          </NeonButton>
                        </div>
                        {items.map((item, idx) => (
                          <label
                            key={item.id || idx}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
                            style={{ backgroundColor: themeConfig.card }}
                            onClick={() => {
                              const newItems = items.map((it, i) =>
                                (it.id === item.id || i === idx) ? { ...it, completed: !it.completed } : it
                              );
                              setItems(newItems);
                              syncRef(selId || null, newItems);
                            }}
                          >
                            <span
                              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border-2"
                              style={{
                                borderColor: item.completed ? themeConfig.accent : '#ef4444',
                                backgroundColor: item.completed ? `${themeConfig.accent}30` : 'rgba(239,68,68,0.1)',
                              }}
                            >
                              {item.completed ? <Check className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
                            </span>
                            <span className="text-sm" style={{ color: themeConfig.foreground }}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </NeonCard>

            {/* AI Recommendations Checklist */}
            {(() => {
              // Use saved recommendations when editing, otherwise use current insights
              let recommendationsToShow: string[] = [];
              
              if (isEditing && savedAiRecommendations.length > 0) {
                recommendationsToShow = savedAiRecommendations;
              } else if (insights) {
                // Build recommendations list from insights
                const recs: string[] = [];
                
                // Add topAction if it exists
                if (insights.topAction && typeof insights.topAction === 'string') {
                  const topActionText = insights.topAction.trim();
                  if (topActionText) recs.push(topActionText);
                }
                
                // Add all actionItems
                if (Array.isArray(insights.actionItems)) {
                  insights.actionItems.forEach(item => {
                    const text = typeof item === 'string' ? item.trim() : String(item || '').trim();
                    if (text && !recs.includes(text)) { // Avoid duplicates
                      recs.push(text);
                    }
                  });
                }
                
                recommendationsToShow = recs;
              }
              
              if (recommendationsToShow.length === 0) return null;
              
              const allChecked = recommendationsToShow.every(rec => aiRecommendationCompletions[rec] === true);
              
              return (
                <NeonCard className="p-6" hover={false} shineBorder>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                      <Lightbulb className="w-5 h-5" style={{ color: themeConfig.accent }} />
                      AI Recommendations Checklist
                    </h2>
                    {recommendationsToShow.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newState: Record<string, boolean> = {};
                          recommendationsToShow.forEach(rec => {
                            newState[rec] = !allChecked;
                          });
                          setAiRecommendationCompletions(prev => ({ ...prev, ...newState }));
                        }}
                        className="text-xs px-3 py-1 rounded-lg border transition-colors"
                        style={{
                          borderColor: themeConfig.border,
                          backgroundColor: allChecked ? themeConfig.accent : themeConfig.card,
                          color: allChecked ? themeConfig.card : themeConfig.foreground,
                        }}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm mb-4" style={{ color: themeConfig.mutedForeground }}>
                    {isEditing && savedAiRecommendations.length > 0
                      ? 'These are the recommendations that were available when this trade was created. Your completion history is preserved.'
                      : 'Check off the recommendations you followed for this trade to track your improvement over time.'}
                  </p>
                  <div className="space-y-2">
                    {recommendationsToShow.map((rec, idx) => {
                      const text = typeof rec === 'string' ? rec.trim() : String(rec || '').trim();
                      if (!text) return null;
                      return (
                        <label
                          key={`${text}-${idx}`}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          style={{ backgroundColor: themeConfig.card }}
                        >
                          <input
                            type="checkbox"
                            checked={aiRecommendationCompletions[text] || false}
                            onChange={(e) => {
                              setAiRecommendationCompletions(prev => ({
                                ...prev,
                                [text]: e.target.checked
                              }));
                            }}
                            className="w-5 h-5 rounded border-2"
                            style={{ borderColor: themeConfig.accent }}
                          />
                          <span className="text-sm flex-1" style={{ color: themeConfig.foreground }}>
                            {text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </NeonCard>
              );
            })()}

            {/* Screenshot */}
            <NeonCard className="p-6" hover={false} shineBorder>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <Upload className="w-5 h-5" style={{ color: themeConfig.accent }} />
                      Screenshot
              </h2>

              <div className="space-y-4">
                <Input
                      type="file"
                      accept="image/*"
                  onChange={handleScreenshotChange}
                  aria-label="Upload trade screenshot"
                  className="rounded-xl"
                  style={inputStyle}
                />
                {screenshotPreview && (
                  <div className="relative mt-2 inline-block">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-w-xs max-h-40 rounded-lg border object-cover"
                      style={{ borderColor: themeConfig.border }}
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-600"
                      aria-label="Remove screenshot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </NeonCard>
          </div>

          {/* Sidebar - Summary & Save */}
          <div className="space-y-6">
            <NeonCard className="p-6 sticky top-6" hover={false} shineBorder>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
                <Calculator className="w-5 h-5" style={{ color: themeConfig.accent }} />
                Summary
              </h3>

              <div className="space-y-4">
                {(entryPrice && quantity) && (
                <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Position Size:</span>
                  <span className="font-medium">{formatCurrency(calculations.positionSize)}</span>
                </div>
                )}

                    <div className="flex justify-between">
                  <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>P&L:</span>
                      <span
                        className={`font-bold ${
                          calculations.pnl > 0
                            ? 'text-green-500'
                            : calculations.pnl < 0
                            ? 'text-red-500'
                            : 'text-foreground'
                        }`}
                      >
                        {formatCurrency(calculations.pnl)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                  <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>P&L %:</span>
                      <span
                        className={`font-medium ${
                          calculations.pnlPercent > 0
                            ? 'text-green-500'
                            : calculations.pnlPercent < 0
                            ? 'text-red-500'
                            : 'text-foreground'
                        }`}
                      >
                        {formatPercent(calculations.pnlPercent)}
                      </span>
                    </div>

                {calculations.duration > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Duration:</span>
                    <span className="font-medium">{formatDuration(calculations.duration)}</span>
                  </div>
                )}

                {riskCalculations.plannedRR != null && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Planned Risk/Reward:</span>
                    <span className="font-medium">1:{riskCalculations.plannedRR}</span>
                  </div>
                )}
                {riskCalculations.actualRR != null && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Actual Risk/Reward:</span>
                    <span className="font-medium">1:{riskCalculations.actualRR}</span>
                  </div>
                )}
                {riskCalculations.rMultiple != null && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>R Multiple:</span>
                    <span
                      className={`font-medium ${
                        riskCalculations.rMultiple > 0
                          ? 'text-green-500'
                          : riskCalculations.rMultiple < 0
                          ? 'text-red-500'
                          : 'text-foreground'
                      }`}
                    >
                      {riskCalculations.rMultiple}x
                    </span>
                  </div>
                )}
                {riskCalculations.plannedRiskPercent != null && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeConfig.mutedForeground }}>Risk %:</span>
                    <span className="font-medium">{riskCalculations.plannedRiskPercent}%</span>
                  </div>
                )}
              </div>

              <ParticleButton
            type="submit" 
                variant="default"
                className="w-full mt-6 h-12 rounded-xl font-semibold"
                  disabled={isSubmitting}
          >
                  {isSubmitting ? (
              <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
                      {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Trade' : 'Add Trade'}
              </>
            )}
              </ParticleButton>
            </NeonCard>
        </div>
          </form>
      </PageContainer>
    </div>
  );
}
