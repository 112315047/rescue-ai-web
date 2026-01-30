import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  language: string;
}

export function VoiceRecorder({ onTranscription, disabled, language }: VoiceRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Map language codes to BCP 47 tags
  const languageMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN'
  };

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Update transcription as it comes in
  useEffect(() => {
    if (listening && transcript) {
      onTranscription(transcript);
    }
  }, [transcript, listening, onTranscription]);

  if (!browserSupportsSpeechRecognition) {
    return null; // Don't show the button if not supported
  }

  const toggleRecording = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      toast.success("Voice recognized");
    } else {
      if (!isMicrophoneAvailable) {
        toast.error("Microphone access is required");
        return;
      }
      
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: true, 
        language: languageMap[language] || 'en-US' 
      });
      toast.info("Listening... Tap again to stop.");
    }
  };

  return (
    <Button
      type="button"
      variant={listening ? 'destructive' : 'outline'}
      size="icon"
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      className={cn(
        'shrink-0 transition-all duration-200',
        listening && 'animate-pulse ring-2 ring-destructive ring-offset-2'
      )}
      title={listening ? "Stop recording" : "Start voice recording"}
    >
      {listening ? (
        <>
           <MicOff className="h-4 w-4" />
           <span className="sr-only">Stop</span>
        </>
      ) : (
        <>
           <Mic className="h-4 w-4" />
           <span className="sr-only">Start</span>
        </>
      )}
    </Button>
  );
}
