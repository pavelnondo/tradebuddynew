
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSpeechToText() {
  const [isProcessing, setIsProcessing] = useState(false);

  const convertSpeechToText = async (audioBase64: string): Promise<string> => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: audioBase64 },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data.text || '';
    } catch (error) {
      console.error('Speech to text error:', error);
      toast.error('Failed to convert speech to text', {
        description: 'Please try again or type your notes manually.'
      });
      return '';
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    convertSpeechToText,
    isProcessing
  };
}
