import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Download,
  Upload,
  Volume2,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceNote {
  id: string;
  blob: Blob;
  duration: number;
  timestamp: Date;
  transcript?: string;
  isPlaying: boolean;
}

interface VoiceRecorderProps {
  onSaveNote: (note: VoiceNote) => void;
  onDeleteNote: (id: string) => void;
  existingNotes?: VoiceNote[];
  maxDuration?: number; // in seconds
  autoTranscribe?: boolean;
}

export function VoiceRecorder({ 
  onSaveNote, 
  onDeleteNote, 
  existingNotes = [],
  maxDuration = 300, // 5 minutes default
  autoTranscribe = false
}: VoiceRecorderProps) {
  const { themeConfig } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [notes, setNotes] = useState<VoiceNote[]>(existingNotes);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasShownDeniedToastRef = useRef(false);

  // Clean up stream and recorder on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
      return;
    }

    // Lazy init: only request mic when user clicks Start
    try {
      hasShownDeniedToastRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setMediaRecorder(null);

        const audioBlob = chunks.length > 0 ? new Blob(chunks, { type: 'audio/webm' }) : new Blob([], { type: 'audio/webm' });
        if (audioBlob.size === 0) {
          setRecordingTime(0);
          return;
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Create note immediately, update duration when metadata loads
        const newNote: VoiceNote = {
          id: Date.now().toString(),
          blob: audioBlob,
          duration: 0, // Will be updated when metadata loads
          timestamp: new Date(),
          isPlaying: false,
        };
        
        console.log('[VoiceRecorder] Recording stopped, blob size:', audioBlob.size, 'creating note:', newNote.id);
        
        // Add to internal state immediately
        setNotes((prev) => {
          const updated = [newNote, ...prev];
          console.log('[VoiceRecorder] Updated internal notes state:', updated.length, 'items');
          return updated;
        });
        
        // Call callback immediately so parent component gets the note right away
        console.log('[VoiceRecorder] Calling onSaveNote callback immediately');
        onSaveNote(newNote);
        
        // Update duration when metadata loads (update internal state only, don't call callback again)
        audio.onloadedmetadata = () => {
          console.log('[VoiceRecorder] Audio metadata loaded, duration:', audio.duration);
          setNotes((prev) => prev.map(n => 
            n.id === newNote.id ? { ...n, duration: audio.duration } : n
          ));
        };
        
        // Fallback: if metadata doesn't load within 2 seconds, proceed anyway
        setTimeout(() => {
          if (audio.readyState < 2) { // HAVE_CURRENT_DATA
            console.warn('[VoiceRecorder] Audio metadata taking too long, proceeding without duration');
          }
        }, 2000);
        
        audio.onerror = (err) => {
          console.error('[VoiceRecorder] Error loading audio metadata:', err);
        };
        
        if (autoTranscribe) transcribeAudio(audioBlob);
        setAudioChunks([]);
        setRecordingTime(0);
      };

      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      if (!hasShownDeniedToastRef.current) {
        hasShownDeniedToastRef.current = true;
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to record voice notes",
          variant: "destructive",
        });
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playNote = (note: VoiceNote) => {
    if (audioRef.current) {
      const audioUrl = URL.createObjectURL(note.blob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      
      setNotes(prev => prev.map(n => 
        n.id === note.id ? { ...n, isPlaying: true } : { ...n, isPlaying: false }
      ));
    }
  };

  const pauseNote = (note: VoiceNote) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setNotes(prev => prev.map(n => ({ ...n, isPlaying: false })));
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    onDeleteNote(id);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // This would integrate with a speech-to-text service
      // For now, we'll simulate it
      setTimeout(() => {
        setTranscript('Voice note transcribed (simulated)');
        setIsTranscribing(false);
      }, 2000);
    } catch {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (duration: number) => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card className="rounded-2xl" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: themeConfig.foreground }}>
            <Mic className="w-5 h-5 mr-2" style={{ color: themeConfig.accent }} />
            Voice Notes
          </CardTitle>
          <CardDescription style={{ color: themeConfig.mutedForeground }}>
            Record your trade reasoning and thoughts while trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recording Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isRecording && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
                      {isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </div>
                )}
                <div className="text-sm" style={{ color: themeConfig.mutedForeground }}>
                  {formatTime(recordingTime)} / {formatTime(maxDuration)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <Button 
                    type="button" 
                    onClick={startRecording} 
                    size="sm"
                    style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button 
                        type="button" 
                        onClick={resumeRecording} 
                        size="sm"
                        style={{ backgroundColor: themeConfig.accent, color: themeConfig.accentForeground }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={pauseRecording} 
                        size="sm" 
                        variant="outline"
                        style={{ borderColor: themeConfig.border }}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button type="button" onClick={stopRecording} size="sm" variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isRecording && (
              <div className="w-full rounded-full h-2" style={{ backgroundColor: themeConfig.muted + '40' }}>
                <div 
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(recordingTime / maxDuration) * 100}%`,
                    backgroundColor: themeConfig.destructive
                  }}
                ></div>
              </div>
            )}

            {/* Transcription */}
            {isTranscribing && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: themeConfig.muted + '40' }}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: themeConfig.accent }}
                  ></div>
                  <span className="text-sm" style={{ color: themeConfig.foreground }}>Transcribing audio...</span>
                </div>
              </div>
            )}

            {transcript && (
              <div className="space-y-2">
                <Label htmlFor="transcript" style={{ color: themeConfig.foreground }}>Transcription</Label>
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Transcribed text will appear here..."
                  rows={3}
                  style={{ 
                    backgroundColor: themeConfig.card, 
                    borderColor: themeConfig.border,
                    color: themeConfig.foreground
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Notes List */}
      {notes.length > 0 && (
        <Card className="rounded-2xl" shineBorder style={{ backgroundColor: themeConfig.card, borderColor: themeConfig.border }}>
          <CardHeader>
            <CardTitle style={{ color: themeConfig.foreground }}>Recorded Notes</CardTitle>
            <CardDescription style={{ color: themeConfig.mutedForeground }}>
              {notes.length} voice note{notes.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ 
                    backgroundColor: themeConfig.muted + '20',
                    borderColor: themeConfig.border,
                    border: `1px solid ${themeConfig.border}`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {note.isPlaying ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            pauseNote(note);
                          }}
                          style={{ borderColor: themeConfig.border }}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playNote(note);
                          }}
                          style={{ borderColor: themeConfig.border }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium" style={{ color: themeConfig.foreground }}>
                        {note.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-xs" style={{ color: themeConfig.mutedForeground }}>
                        Duration: {formatDuration(note.duration)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" style={{ borderColor: themeConfig.border, color: themeConfig.mutedForeground }}>
                      {formatDuration(note.duration)}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNote(note.id)}
                      style={{ borderColor: themeConfig.border }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setNotes(prev => prev.map(n => ({ ...n, isPlaying: false })))}
        onPause={() => setNotes(prev => prev.map(n => ({ ...n, isPlaying: false })))}
      />
    </div>
  );
}