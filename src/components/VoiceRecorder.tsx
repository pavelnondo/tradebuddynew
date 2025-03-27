
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onAudioCaptured: (text: string) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onAudioCaptured, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Set up audio player
  useEffect(() => {
    audioPlayerRef.current = new Audio();
    audioPlayerRef.current.onended = () => setIsPlaying(false);
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // Update audio player when audio URL changes
  useEffect(() => {
    if (audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current.src = audioUrl;
    }
  }, [audioUrl]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone', {
        description: 'Please ensure you have granted microphone permissions.'
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const playAudio = () => {
    if (audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  const clearAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };
  
  const saveAudioNote = async () => {
    if (!audioBlob) return;
    
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = function() {
        const base64data = reader.result as string;
        // Remove the data:audio/webm;base64, part
        const base64Audio = base64data.split(',')[1];
        
        // Let parent component handle the audio data
        onAudioCaptured(base64Audio);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio', {
        description: 'Please try again or type your notes instead.'
      });
    }
  };
  
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Voice Notes</h3>
        {audioBlob && !isProcessing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAudio} 
            disabled={isRecording || isProcessing}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-2">
        {!audioBlob ? (
          <Button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className="w-full"
            disabled={isProcessing}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" /> Start Recording
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={isPlaying ? stopAudio : playAudio}
              variant="outline"
              disabled={isProcessing}
            >
              {isPlaying ? (
                <>
                  <Square className="h-4 w-4 mr-2" /> Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> Play
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              onClick={saveAudioNote} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save as Note
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {isRecording && (
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="ml-2 text-sm text-muted-foreground">Recording...</span>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        {!audioBlob ? 
          "Record your trade thoughts to automatically add them to your notes" : 
          "Review your recording or save it as text"}
      </p>
    </div>
  );
}
