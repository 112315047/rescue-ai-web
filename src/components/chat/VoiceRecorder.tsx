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

  // Debugging logs for Vercel
  useEffect(() => {
    console.log('VoiceRecorder State:', { 
      browserSupportsSpeechRecognition, 
      isMicrophoneAvailable, 
      listening,
      language,
      mappedLanguage: languageMap[language]
    });
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable, listening, language]);

  // Update transcription as it comes in
  useEffect(() => {
    if (listening && transcript) {
      console.log('Transcript update:', transcript);
      onTranscription(transcript);
    }
  }, [transcript, listening, onTranscription]);

  if (!browserSupportsSpeechRecognition) {
    console.warn('Speech recognition not supported in this browser.');
    return null; // Don't show the button if not supported
  }

  const toggleRecording = async () => {
    try {
      if (listening) {
        console.log('Stopping speech recognition...');
        await SpeechRecognition.stopListening();
        toast.success("Voice recognized");
      } else {
        console.log('Starting speech recognition...', { 
          language: languageMap[language], 
          isMicrophoneAvailable 
        });
        
        if (!isMicrophoneAvailable) {
          toast.error("Microphone access is required");
          return;
        }
        
        resetTranscript();
        await SpeechRecognition.startListening({ 
          continuous: true, 
          language: languageMap[language] || 'en-US' 
        });
        toast.info("Listening... Tap again to stop.");
      }
    } catch (error) {
      console.error('Speech Recognition Error:', error);
      toast.error("Could not start voice recognition.");
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
