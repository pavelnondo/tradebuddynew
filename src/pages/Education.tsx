import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { useEducationNotes, type EducationNote } from '@/hooks/useEducationNotes';
import { useEducationFolders, type EducationFolder } from '@/hooks/useEducationFolders';
import { NeonCard } from '@/components/ui/NeonCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonModal } from '@/components/ui/NeonModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/config';
import { getVoiceNoteAudioUrl, stripVoiceNotePlaceholders } from '@/utils/formatting';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  Tag,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Folder,
  FolderPlus,
  Eye,
  Clock,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'lesson', label: 'Lesson from Trade' },
  { value: 'technical_analysis', label: 'Technical Analysis' },
  { value: 'risk_management', label: 'Risk Management' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'market_structure', label: 'Market Structure' },
  { value: 'other', label: 'Other' },
] as const;

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: EducationNote | null;
  folders: Array<{ id: string; name: string }>;
  defaultFolderId?: string;
  onSave: (data: { title: string; content: string; category: string | null; tags: string[]; screenshot_url?: string | null; folder_id?: string | null; voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }> }) => Promise<void>;
}

function NoteModal({ isOpen, onClose, note, folders, defaultFolderId, onSave }: NoteModalProps) {
  const { themeConfig } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tagsStr, setTagsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<Array<{ id: string; blob: Blob; duration: number; timestamp: Date; transcript?: string }>>([]);
  const [savedVoiceNotes, setSavedVoiceNotes] = useState<Array<{ url: string; duration?: number; transcript?: string }>>([]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setFolderId(note.folder_id || null);
      setTagsStr(Array.isArray(note.tags) ? note.tags.join(', ') : '');
      setScreenshotPreview(note.screenshot_url || null);
      setScreenshot(null);
      // Load existing voice notes from database
      const voiceNoteUrls = Array.isArray(note.voice_note_urls) ? note.voice_note_urls : [];
      setSavedVoiceNotes(voiceNoteUrls);
      // Clear new recordings when loading existing note
      setVoiceNotes([]);
    } else {
      setTitle('');
      setContent('');
      setCategory(null);
      setFolderId(defaultFolderId || null);
      setTagsStr('');
      setScreenshot(null);
      setScreenshotPreview(null);
      setVoiceNotes([]);
      setSavedVoiceNotes([]);
    }
    setErrors({});
  }, [note, isOpen, defaultFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      let screenshotUrl: string | null = note?.screenshot_url || null;
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          screenshotUrl = data.url || null;
        }
      }

      // Upload new voice notes and combine with existing ones
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
              const voiceNoteUrl = uploadData.url || uploadData.path;
              if (voiceNoteUrl) {
                newVoiceNoteUrls.push({
                  url: voiceNoteUrl,
                  duration: voiceNote.duration,
                  transcript: voiceNote.transcript,
                });
                console.log('[Education] Uploaded voice note:', voiceNoteUrl);
              } else {
                console.warn('[Education] Upload response missing URL:', uploadData);
              }
            } else {
              const errorText = await uploadRes.text().catch(() => 'Unknown error');
              console.error('[Education] Voice note upload failed:', uploadRes.status, errorText);
            }
          } catch (err) {
            console.error('[Education] Failed to upload voice note:', err);
          }
        }
      }

      // Combine existing saved voice notes with newly uploaded ones
      const allVoiceNoteUrls = [...savedVoiceNotes, ...newVoiceNoteUrls];

      console.log('[Education] Total voice notes to save:', allVoiceNoteUrls.length, {
        saved: savedVoiceNotes.length,
        new: newVoiceNoteUrls.length,
      });

      await onSave({ 
        title: title.trim(), 
        content: content.trim(), 
        category, 
        tags, 
        screenshot_url: screenshotUrl, 
        folder_id: folderId || null,
        voice_note_urls: allVoiceNoteUrls,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeonModal
      isOpen={isOpen}
      onClose={onClose}
      title={note ? 'Edit Learning Note' : 'New Learning Note'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="note-title" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
            Concept / Topic *
          </Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Support and Resistance Levels"
            className="mt-1.5 rounded-xl"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
          {errors.title && (
            <p className="text-sm flex items-center gap-1 mt-1" style={{ color: themeConfig.destructive }}>
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="note-folder" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
            Folder
          </Label>
          <select
            id="note-folder"
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value || null)}
            className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="note-category" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
            Category
          </Label>
          <select
            id="note-category"
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="note-content" className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
            Notes *
          </Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes on this concept..."
            rows={8}
            className="mt-1.5 rounded-xl resize-y"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
          {errors.content && (
            <p className="text-sm flex items-center gap-1 mt-1" style={{ color: themeConfig.destructive }}>
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.content}
            </p>
          )}
          <div className="mt-3">
            {/* Display saved voice notes from database */}
            {savedVoiceNotes.length > 0 && (
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
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
            <VoiceRecorder
              onSaveNote={(voiceNote) => {
                // Voice note is stored in voice_note_urls; do not append placeholder to content
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
          <Label htmlFor="note-tags" className="text-sm font-medium flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <Tag className="w-3.5 h-3.5" />
            Tags (comma-separated)
          </Label>
          <Input
            id="note-tags"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="e.g. support, resistance, trend lines"
            className="mt-1.5 rounded-xl"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
        </div>

        <div>
          <Label className="text-sm font-medium flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <Upload className="w-3.5 h-3.5" />
            Screenshot (optional)
          </Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type.startsWith('image/')) {
                setScreenshot(file);
                const reader = new FileReader();
                reader.onloadend = () => setScreenshotPreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
            className="mt-1.5 rounded-xl"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
          {screenshotPreview && (
            <div className="relative mt-2 inline-block">
              <img
                src={screenshotPreview.startsWith('data:') ? screenshotPreview : `${API_BASE_URL.replace('/api', '')}${screenshotPreview}`}
                alt="Screenshot preview"
                className="max-w-xs max-h-40 rounded-lg border object-cover"
                style={{ borderColor: themeConfig.border }}
              />
              <button
                type="button"
                onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-600"
                aria-label="Remove screenshot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <NeonButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </NeonButton>
          <NeonButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                {note ? 'Update Note' : 'Save Note'}
              </>
            )}
          </NeonButton>
        </div>
      </form>
    </NeonModal>
  );
}

interface NoteCardProps {
  note: EducationNote;
  onEdit: (note: EducationNote) => void;
  onDelete: (id: string) => void;
  onView: (note: EducationNote) => void;
}

function NoteCard({ note, onEdit, onDelete, onView }: NoteCardProps) {
  const { themeConfig } = useTheme();
  const imgBase = API_BASE_URL.replace('/api', '');
  const categoryLabel = CATEGORIES.find((c) => c.value === note.category)?.label || note.category || 'Uncategorized';
  const cleanContent = stripVoiceNotePlaceholders(note.content);
  const preview = cleanContent.length > 300 ? cleanContent.slice(0, 300) + '...' : cleanContent;
  const isTruncated = cleanContent.length > 300;
  const isFromTrade = note.trade_id != null || note.category === 'lesson';
  const noteDate = note.created_at ? new Date(note.created_at) : null;
  const formattedDate = noteDate ? noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  // Parse voice notes - handle both array and JSON string
  const voiceNotes = Array.isArray(note.voice_note_urls) 
    ? note.voice_note_urls 
    : (typeof note.voice_note_urls === 'string' 
        ? (() => {
            try {
              return JSON.parse(note.voice_note_urls);
            } catch {
              return [];
            }
          })()
        : []);

  return (
    <NeonCard className="p-6 transition-all duration-200 group" hover shineBorder>
      {/* Header with prominent title and date */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity mb-2"
              onClick={() => onView(note)}
              style={{ color: themeConfig.foreground }}
            >
              {note.title}
            </h3>
            {isFromTrade && formattedDate && (
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5" style={{ color: themeConfig.mutedForeground }} />
                <span className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
                  Lesson from {formattedDate}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: isFromTrade ? `${themeConfig.accent}20` : `${themeConfig.accent}15`,
                  color: themeConfig.accent,
                  border: `1px solid ${themeConfig.accent}30`,
                }}
              >
                {categoryLabel}
              </span>
              {!isFromTrade && formattedDate && (
                <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                  {formattedDate}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <NeonButton variant="ghost" size="sm" onClick={() => onView(note)} title="View full note">
              <Eye className="w-4 h-4" />
            </NeonButton>
            <NeonButton variant="ghost" size="sm" onClick={() => onEdit(note)} title="Edit note">
              <Edit className="w-4 h-4" />
            </NeonButton>
            <NeonButton variant="ghost" size="sm" onClick={() => onDelete(note.id)} title="Delete note">
              <Trash2 className="w-4 h-4" style={{ color: themeConfig.destructive }} />
            </NeonButton>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div onClick={() => onView(note)} className="cursor-pointer mb-4">
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-5"
          style={{ color: themeConfig.mutedForeground }}
        >
          {preview}
        </p>
        {isTruncated && (
          <button
            type="button"
            className="text-sm font-medium mt-2 hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            style={{ color: themeConfig.accent }}
            onClick={(e) => {
              e.stopPropagation();
              onView(note);
            }}
          >
            Read more →
          </button>
        )}
      </div>

      {/* Media and metadata */}
      <div className="space-y-3">
        {note.screenshot_url && (
          <div className="rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity" style={{ borderColor: themeConfig.border }} onClick={() => onView(note)}>
            <img
              src={note.screenshot_url!.startsWith('http') ? note.screenshot_url! : `${imgBase}${note.screenshot_url}`}
              alt="Note screenshot"
              className="w-full max-h-48 object-cover"
            />
          </div>
        )}
        
        {voiceNotes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium mb-1" style={{ color: themeConfig.mutedForeground }}>
              Voice Notes ({voiceNotes.length})
            </div>
            {voiceNotes.map((vn: any, idx: number) => {
              const url = typeof vn === 'string' ? vn : (vn?.url || '');
              if (!url) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
                >
                  <AudioPlayer
                    src={getVoiceNoteAudioUrl(url)}
                    duration={vn?.duration}
                  />
                </div>
              );
            })}
          </div>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: themeConfig.border }}>
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{
                  backgroundColor: `${themeConfig.accent}10`,
                  border: `1px solid ${themeConfig.accent}20`,
                  color: themeConfig.accent,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </NeonCard>
  );
}

export default function Education() {
  const { themeConfig } = useTheme();
  const {
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  } = useEducationNotes();
  const {
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useEducationFolders();

  const [notes, setNotes] = useState<EducationNote[]>([]);
  const [folders, setFolders] = useState<EducationFolder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<EducationNote | null>(null);
  const [activeSection, setActiveSection] = useState<'from-trade' | 'direct'>('direct');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [viewingNote, setViewingNote] = useState<EducationNote | null>(null);

  const foldersFromTrade = folders.filter((f) => f.source === 'from-trade');
  const foldersDirect = folders.filter((f) => f.source !== 'from-trade');
  const currentSectionFolders = activeSection === 'from-trade' ? foldersFromTrade : foldersDirect;

  const loadFolders = useCallback(async () => {
    const data = await fetchFolders();
    setFolders(data);
  }, [fetchFolders]);

  const loadNotes = useCallback(async () => {
    const params: { category?: string; search?: string; folder_id?: string; source: 'from-trade' | 'direct' } = {
      source: activeSection,
    };
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (folderFilter !== 'all') params.folder_id = folderFilter;
    const data = await fetchNotes(params);
    setNotes(data);
  }, [fetchNotes, activeSection, categoryFilter, searchQuery, folderFilter]);

  const setActiveSectionAndResetFolder = useCallback((section: 'from-trade' | 'direct') => {
    setActiveSection(section);
    setFolderFilter('all');
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const created = await createFolder(newFolderName.trim(), activeSection);
    if (created) {
      setFolders((prev) => [...prev, created].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async (data: {
    title: string;
    content: string;
    category: string | null;
    tags: string[];
    screenshot_url?: string | null;
    folder_id?: string | null;
    voice_note_urls?: Array<{ url: string; duration?: number; transcript?: string }>;
  }) => {
    if (editingNote) {
      const ok = await updateNote(editingNote.id, data);
      if (ok) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? { 
                  ...n, 
                  ...data, 
                  folder_id: data.folder_id ?? n.folder_id,
                  voice_note_urls: data.voice_note_urls ?? n.voice_note_urls,
                  updated_at: new Date().toISOString() 
                }
              : n
          )
        );
        setEditingNote(null);
      }
    } else {
      const created = await createNote({ ...data, trade_id: null });
      if (created) {
        setNotes((prev) => [created, ...prev]);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    setDeleteConfirm(null);
    const ok = await deleteNote(id);
    if (ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  if (isLoading && notes.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        style={{ color: themeConfig.mutedForeground }}
      >
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Loading notes...</span>
      </div>
    );
  }

  if (error && notes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] gap-4"
        style={{ color: themeConfig.destructive }}
      >
        <AlertCircle className="w-12 h-12" />
        <p>Failed to load notes. Please run the database migration and try again.</p>
        <NeonButton onClick={loadNotes}>Retry</NeonButton>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageContainer>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b"
        style={{ borderColor: themeConfig.border }}
      >
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight mb-2"
            style={{ color: themeConfig.foreground }}
          >
            <span style={{ color: themeConfig.accent }}>Education</span> & Learning
          </h1>
          <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
            Take notes on new concepts and trading knowledge you're learning
          </p>
        </div>
        {activeSection === 'direct' && (
          <NeonButton onClick={() => { setEditingNote(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" />
            New Note
          </NeonButton>
        )}
      </div>

      {/* Section tabs + Folders sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div
          className="lg:w-56 flex-shrink-0 space-y-4"
          style={{ minWidth: 200 }}
        >
          {/* Top-level section tabs */}
          <div className="flex rounded-xl p-1" style={{ backgroundColor: themeConfig.card, border: `1px solid ${themeConfig.border}` }}>
            <button
              type="button"
              onClick={() => setActiveSectionAndResetFolder('from-trade')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeSection === 'from-trade' ? '' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeSection === 'from-trade' ? themeConfig.accent : 'transparent',
                color: activeSection === 'from-trade' ? '#fff' : themeConfig.foreground,
              }}
            >
              <GraduationCap className="w-4 h-4" />
              Lessons from Trades
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionAndResetFolder('direct')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeSection === 'direct' ? '' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeSection === 'direct' ? themeConfig.accent : 'transparent',
                color: activeSection === 'direct' ? '#fff' : themeConfig.foreground,
              }}
            >
              <BookOpen className="w-4 h-4" />
              My Direct Notes
            </button>
          </div>

          {/* Folders within current section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: themeConfig.mutedForeground }}>
                Folders
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolderInput((prev) => !prev)}
                className="p-1 rounded hover:opacity-80"
                style={{ color: themeConfig.accent }}
                aria-label="New folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            {showNewFolderInput && (
              <div className="flex flex-wrap gap-2 mb-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateFolder(); } }}
                  className="rounded-lg text-sm flex-1 min-w-[120px]"
                  style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border, color: themeConfig.foreground }}
                  autoFocus
                />
                <NeonButton size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Add</NeonButton>
                <NeonButton variant="ghost" size="sm" onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}>Cancel</NeonButton>
              </div>
            )}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setFolderFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  folderFilter === 'all' ? 'ring-1' : ''
                }`}
                style={{
                  backgroundColor: folderFilter === 'all' ? `${themeConfig.accent}15` : 'transparent',
                  color: themeConfig.foreground,
                  ...(folderFilter === 'all' ? { borderLeft: `3px solid ${themeConfig.accent}` } : {}),
                }}
              >
                <Folder className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
                All
              </button>
              <button
                type="button"
                onClick={() => setFolderFilter('__none__')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  folderFilter === '__none__' ? 'ring-1' : ''
                }`}
                style={{
                  backgroundColor: folderFilter === '__none__' ? `${themeConfig.accent}15` : 'transparent',
                  color: themeConfig.foreground,
                  ...(folderFilter === '__none__' ? { borderLeft: `3px solid ${themeConfig.accent}` } : {}),
                }}
              >
                <Folder className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
                Uncategorized
              </button>
              {currentSectionFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFolderFilter(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    folderFilter === f.id ? 'ring-1' : ''
                  }`}
                  style={{
                    backgroundColor: folderFilter === f.id ? `${themeConfig.accent}15` : 'transparent',
                    color: themeConfig.foreground,
                    ...(folderFilter === f.id ? { borderLeft: `3px solid ${themeConfig.accent}` } : {}),
                  }}
                >
                  <Folder className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
                  {f.name}
                </button>
              ))}
              {currentSectionFolders.length === 0 && !showNewFolderInput && (
                <p className="text-xs px-3 py-1.5" style={{ color: themeConfig.mutedForeground }}>No folders yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: themeConfig.mutedForeground }}
          />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl w-full"
            style={{
              backgroundColor: themeConfig.card,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border px-4 py-2.5 text-sm min-w-[180px]"
          style={{
            backgroundColor: themeConfig.card,
            borderColor: themeConfig.border,
            color: themeConfig.foreground,
          }}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes grid for current section + folder */}
          {notes.length > 0 ? (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: themeConfig.foreground }}>
                {activeSection === 'from-trade' ? 'Lessons from Trades' : 'Direct Notes'}
              </h2>
              <p className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                {activeSection === 'from-trade'
                  ? `${notes.length} lesson${notes.length !== 1 ? 's' : ''} automatically saved from your trades`
                  : `${notes.length} note${notes.length !== 1 ? 's' : ''} you've created`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  layout
                >
                  <NoteCard
                    note={note}
                    onEdit={(n) => { setEditingNote(n); setShowModal(true); }}
                    onDelete={handleDeleteClick}
                    onView={(n) => setViewingNote(n)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
          ) : (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: `${themeConfig.accent}15`,
              border: `1px solid ${themeConfig.accent}30`,
            }}
          >
            {activeSection === 'from-trade' ? (
              <GraduationCap className="w-10 h-10" style={{ color: themeConfig.accent }} />
            ) : (
              <BookOpen className="w-10 h-10" style={{ color: themeConfig.accent }} />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: themeConfig.foreground }}>
            {activeSection === 'from-trade' ? 'No lessons from trades yet' : 'No direct notes yet'}
          </h3>
          <p className="mb-6 max-w-md mx-auto" style={{ color: themeConfig.mutedForeground }}>
            {activeSection === 'from-trade'
              ? 'Lessons are saved automatically when you add "Lessons Learned" to a trade. Go to Add Trade to capture your insights.'
              : 'Start capturing concepts you learn. Add notes on technical analysis, risk management, psychology, or any trading topic.'}
          </p>
          {activeSection === 'direct' && (
            <NeonButton onClick={() => { setEditingNote(null); setShowModal(true); }}>
              <Plus className="w-4 h-4" />
              Add your first note
            </NeonButton>
          )}
        </motion.div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <NoteModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingNote(null);
        }}
        note={editingNote}
        folders={editingNote?.trade_id ? foldersFromTrade : foldersDirect}
        defaultFolderId={activeSection === 'direct' && folderFilter !== 'all' && folderFilter !== '__none__' ? folderFilter : undefined}
        onSave={handleSave}
      />

      {/* View Note Modal (Read-only) */}
      <NeonModal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || 'View Note'}
        size="lg"
      >
        {viewingNote && (
          <div className="space-y-4">
            <div>
              <span
                className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: `${themeConfig.accent}15`,
                  color: themeConfig.accent,
                  border: `1px solid ${themeConfig.accent}30`,
                }}
              >
                {CATEGORIES.find((c) => c.value === viewingNote.category)?.label || viewingNote.category || 'Uncategorized'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
                Content
              </h4>
              <div
                className="text-sm whitespace-pre-wrap rounded-xl p-4 max-h-[60vh] overflow-y-auto"
                style={{
                  backgroundColor: themeConfig.card,
                  border: `1px solid ${themeConfig.border}`,
                  color: themeConfig.foreground,
                }}
              >
                {stripVoiceNotePlaceholders(viewingNote.content)}
              </div>
            </div>
            {viewingNote.screenshot_url && (
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
                  Screenshot
                </h4>
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: themeConfig.border }}>
                  <img
                    src={viewingNote.screenshot_url.startsWith('http') ? viewingNote.screenshot_url : `${API_BASE_URL.replace('/api', '')}${viewingNote.screenshot_url}`}
                    alt="Note screenshot"
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              </div>
            )}
            {(() => {
              const vnArray = Array.isArray(viewingNote.voice_note_urls) 
                ? viewingNote.voice_note_urls 
                : (typeof viewingNote.voice_note_urls === 'string' 
                    ? (() => {
                        try {
                          return JSON.parse(viewingNote.voice_note_urls);
                        } catch {
                          return [];
                        }
                      })()
                    : []);
              // Filter out invalid entries
              const validVoiceNotes = vnArray.filter((vn: any) => vn && (vn.url || typeof vn === 'string'));
              if (validVoiceNotes.length === 0) return null;
              return (
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
                    Voice Notes ({validVoiceNotes.length})
                  </h4>
                  <div className="space-y-2">
                    {validVoiceNotes.map((vn: any, idx: number) => {
                      const url = typeof vn === 'string' ? vn : (vn?.url || '');
                      if (!url) return null;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ borderColor: themeConfig.border, backgroundColor: themeConfig.card }}
                        >
                          <AudioPlayer
                            src={getVoiceNoteAudioUrl(url)}
                            duration={vn?.duration}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {viewingNote.tags && viewingNote.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: themeConfig.foreground }}>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: themeConfig.card,
                        border: `1px solid ${themeConfig.border}`,
                        color: themeConfig.mutedForeground,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <NeonButton variant="ghost" onClick={() => setViewingNote(null)}>
                Close
              </NeonButton>
              <NeonButton onClick={() => { setViewingNote(null); setEditingNote(viewingNote); setShowModal(true); }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </NeonButton>
            </div>
          </div>
        )}
      </NeonModal>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete learning note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <NeonButton variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </NeonButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </PageContainer>
    </motion.div>
  );
}
