import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

  // Initialize media recorder
  useEffect(() => {
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks(prev => [...prev, event.data]);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Create audio element to get duration
          const audio = new Audio(audioUrl);
          audio.onloadedmetadata = () => {
            const newNote: VoiceNote = {
              id: Date.now().toString(),
              blob: audioBlob,
              duration: audio.duration,
              timestamp: new Date(),
              isPlaying: false,
            };
            
            setNotes(prev => [newNote, ...prev]);
            onSaveNote(newNote);
            
            if (autoTranscribe) {
              transcribeAudio(audioBlob);
            }
            
            setAudioChunks([]);
            setRecordingTime(0);
          };
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to record voice notes",
          variant: "destructive",
        });
      }
    };

    initMediaRecorder();
  }, [audioChunks, onSaveNote, autoTranscribe, toast]);

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
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

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
    } catch (error) {
      console.error('Transcription error:', error);
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
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Voice Notes
          </CardTitle>
          <CardDescription>
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
                    <span className="text-sm font-medium">
                      {isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {formatTime(recordingTime)} / {formatTime(maxDuration)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <Button onClick={startRecording} size="sm">
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button onClick={resumeRecording} size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button onClick={pauseRecording} size="sm" variant="outline">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={stopRecording} size="sm" variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isRecording && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Transcription */}
            {isTranscribing && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Transcribing audio...</span>
                </div>
              </div>
            )}

            {transcript && (
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcription</Label>
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Transcribed text will appear here..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Notes List */}
      {notes.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Recorded Notes</CardTitle>
            <CardDescription>
              {notes.length} voice note{notes.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {note.isPlaying ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseNote(note)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playNote(note)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">
                        {note.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Duration: {formatDuration(note.duration)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {formatDuration(note.duration)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNote(note.id)}
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