import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '@/config';

export interface InsightsData {
  summary?: string;
  habits?: string[];
  recommendations?: string[];
  aiAnalysis?: string | null;
  sessionInsights?: string | null;
  setupInsights?: string | null;
  riskInsights?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  actionItems?: string[];
  topAction?: string | null;
  metrics?: {
    totalTrades?: number;
    winRate?: number;
    totalPnl?: number;
    profitFactor?: number;
    avgR?: number | null;
  };
}

const INSIGHTS_STORAGE_KEY = 'tradebuddy-insights';

function getStorageKey(journalId?: string) {
  return journalId ? `${INSIGHTS_STORAGE_KEY}-${journalId}` : INSIGHTS_STORAGE_KEY;
}

function loadCachedInsights(journalId?: string): InsightsData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(journalId));
    if (!raw) return null;
    return JSON.parse(raw) as InsightsData;
  } catch {
    return null;
  }
}

function saveCachedInsights(data: InsightsData, journalId?: string) {
  try {
    localStorage.setItem(getStorageKey(journalId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function useInsights(limit = 200, journalId?: string) {
  const [insights, setInsights] = useState<InsightsData | null>(() => loadCachedInsights(journalId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadCachedInsights(journalId);
    if (cached) setInsights(cached);
  }, [journalId]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/analytics/insights?limit=${limit}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load insights');
      const data = await res.json();
      const next = {
        summary: data.summary,
        habits: data.habits || [],
        recommendations: data.recommendations || [],
        aiAnalysis: data.aiAnalysis,
        sessionInsights: data.sessionInsights,
        setupInsights: data.setupInsights,
        riskInsights: data.riskInsights,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        actionItems: data.actionItems || [],
        topAction: data.topAction,
        metrics: data.metrics,
      };
      setInsights(next);
      saveCachedInsights(next, journalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load insights');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [limit, journalId]);

  return { insights, loading, error, fetchInsights };
}
