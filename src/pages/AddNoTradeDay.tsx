/**
 * Add No Trade Day - Record chart observations when you didn't trade
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { useNoTradeDays } from '../hooks/useNoTradeDays';
import { useApiTrades } from '../hooks/useApiTrades';
import { convertToStandardTrades } from '@/utils/tradeUtils';
import { NeonCard } from '@/components/ui/NeonCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Upload, X, ArrowLeft, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getScreenshotFullUrl } from '@/utils/screenshotUrl';
import { API_BASE_URL } from '@/config';
import { getVoiceNoteAudioUrl } from '@/utils/formatting';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VoiceRecorder } from '@/components/VoiceRecorder';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AddNoTradeDay() {
  const { themeConfig } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeJournal } = useAccountManagement();
  const { addNoTradeDay, error: noTradeError } = useNoTradeDays();
  const { trades: apiTrades, isLoading: tradesLoading } = useApiTrades();
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTradesWarning, setShowTradesWarning] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const [savedVoiceNotes, setSavedVoiceNotes] = useState<Array<{ url: string; duration?: number; transcript?: string }>>([]);

  const tradesOnDate = useMemo(() => {
    const all = convertToStandardTrades(apiTrades || []);
    const filtered = activeJournal ? all.filter(t => t.accountId === activeJournal.id) : all;
    return filtered.filter(t => {
      if (!t.entryTime) return false;
      const d = new Date(t.entryTime);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return s === date;
    });
  }, [apiTrades, activeJournal, date]);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setScreenshotUrl(data.url || data.path || null);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const doSubmit = async () => {
    if (!activeJournal) return;
    setSaving(true);
    try {
      // Upload voice notes
      const newVoiceNoteUrls: Array<{ url: string; duration?: number; transcript?: string }> = [];
      if (voiceNotes.length > 0) {
        const token = localStorage.getItem('token');
        for (const voiceNote of voiceNotes) {
          try {
            const formData = new FormData();
            formData.append('file', voiceNote.blob, `voice-${voiceNote.id}.webm`);
            const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              newVoiceNoteUrls.push({
                url: uploadData.url,
                duration: voiceNote.duration,
                transcript: voiceNote.transcript,
              });
            }
          } catch (err) {
            console.warn('Failed to upload voice note:', err);
          }
        }
      }

      // Combine existing saved voice notes with newly uploaded ones
      const allVoiceNoteUrls = [...savedVoiceNotes, ...newVoiceNoteUrls];

      const dateStr = String(date || '').trim().slice(0, 10);
      const ok = await addNoTradeDay(dateStr, notes, activeJournal.id, screenshotUrl, allVoiceNoteUrls.length > 0 ? allVoiceNoteUrls : undefined);
      if (ok) {
        toast({ title: 'Saved', description: 'No trade day recorded.' });
        navigate('/calendar', { state: { fromAdd: true }, replace: true });
      } else {
        toast({ title: 'Failed to save', description: noTradeError || 'Could not save. Please try again.', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeJournal) {
      toast({ title: 'No journal selected', variant: 'destructive' });
      return;
    }
    if (tradesOnDate.length > 0) {
      setShowTradesWarning(true);
      return;
    }
    await doSubmit();
  };

  const labelStyle = { color: themeConfig.foreground };
  const inputStyle = { backgroundColor: themeConfig.card, borderColor: themeConfig.border };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-8">
      <AlertDialog open={showTradesWarning} onOpenChange={setShowTradesWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This date has trades</AlertDialogTitle>
            <AlertDialogDescription>
              You have {tradesOnDate.length} trade(s) on {date}. Adding a no-trade day might be a mistake. Are you sure you want to add chart observations for a day when you actually traded?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowTradesWarning(false); doSubmit(); }}>
              Yes, add anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-4">
        <NeonButton variant="secondary" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </NeonButton>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <FileText className="w-6 h-6" style={{ color: themeConfig.accent }} />
            Add No Trade Day
          </h1>
          <p className="text-sm mt-1" style={{ color: themeConfig.mutedForeground }}>
            Record chart observations when you didn&apos;t take a trade
          </p>
        </div>
      </div>

      <NeonCard className="p-6" hover={false} shineBorder>
        <div className="space-y-4">
          {tradesOnDate.length > 0 && (
            <div
              className="p-4 rounded-xl border-2 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgb(239, 68, 68)' }}
            >
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold" style={{ color: themeConfig.destructive }}>
                  This date has {tradesOnDate.length} trade{tradesOnDate.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm mt-1" style={{ color: themeConfig.mutedForeground }}>
                  Adding a no-trade day for a date when you traded may be a mistake. You can still save if this is intentional.
                </p>
              </div>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium" style={labelStyle}>Date</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <Label className="text-sm font-medium" style={labelStyle}>Chart observations</Label>
            <Textarea
              placeholder="e.g. Consolidation, no clear setup, choppy market, waited for pullback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] mt-1.5"
              style={inputStyle}
            />
            {/* Display saved voice notes from database */}
            {savedVoiceNotes.length > 0 && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                  Saved Voice Notes
                </Label>
                {savedVoiceNotes.map((vn, idx) => (
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
                      {vn.duration != null && (
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
                        setSavedVoiceNotes((prev) => prev.filter((_, i) => i !== idx));
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
                  // Voice note is stored in voice_note_urls; do not append placeholder to notes text
                  setVoiceNotes((prev) => [...prev, voiceNote]);
                }}
                onDeleteNote={(id) => {
                  setVoiceNotes((prev) => prev.filter((vn) => vn.id !== id));
                }}
                existingNotes={voiceNotes}
                maxDuration={180}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium" style={labelStyle}>Screenshot</Label>
            {screenshotUrl ? (
              <div className="relative inline-block mt-1.5">
                <img
                  src={getScreenshotFullUrl(screenshotUrl)}
                  alt="Chart"
                  className="max-h-48 rounded-lg border object-cover"
                  style={{ borderColor: themeConfig.border }}
                />
                <button
                  type="button"
                  onClick={() => setScreenshotUrl(null)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeConfig.destructive, color: '#fff' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border border-dashed w-fit mt-1.5" style={{ borderColor: themeConfig.border }}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-sm">Add screenshot</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <NeonButton variant="primary" onClick={handleSubmit} disabled={saving || tradesLoading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : tradesLoading ? 'Loading trades...' : 'Save'}
            </NeonButton>
            <NeonButton variant="secondary" onClick={() => navigate('/calendar')}>
              Cancel
            </NeonButton>
          </div>
        </div>
      </NeonCard>
      </div>
    </PageContainer>
  );
}
