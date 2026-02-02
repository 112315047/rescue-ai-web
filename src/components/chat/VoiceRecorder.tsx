import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { transcribeAudio } from '@/services/api';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  language: string;
}

export function VoiceRecorder({ onTranscription, disabled, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const text = await transcribeAudio(audioBlob, language);
          onTranscription(text);
          toast.success("Transcription complete");
        } catch (error) {
          console.error("Transcription failed", error);
          toast.error("Failed to transcribe audio");
        } finally {
          setIsProcessing(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording... Tap to stop.");
    } catch (err) {
      console.error("Error accessing microphone", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const active = isRecording || isProcessing;

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      className={cn(
        'shrink-0 transition-all duration-200',
        isRecording && 'animate-pulse ring-2 ring-destructive ring-offset-2'
      )}
      title={isRecording ? "Stop recording" : "Start voice recording"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="sr-only">{isRecording ? 'Stop' : 'Start'}</span>
    </Button>
  );
}
