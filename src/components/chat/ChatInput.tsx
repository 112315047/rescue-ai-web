import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { FirstAidGuides } from './FirstAidGuides';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder: string;
  disabled?: boolean;
  language: string;
}

export function ChatInput({ onSend, placeholder, disabled, language }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleVoiceTranscription = useCallback((text: string) => {
    setMessage(text);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="flex gap-1 items-center shrink-0">
        <VoiceRecorder
          onTranscription={handleVoiceTranscription}
          disabled={disabled}
          language={language}
        />
        <FirstAidGuides language={language} />
      </div>
      <div className="relative flex-1">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-12 bg-background/50 border-muted-foreground/20 focus:bg-background transition-all"
        />
        <Button 
          type="submit" 
          size="icon"
          variant="ghost" 
          disabled={!message.trim() || disabled}
          className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/10 transition-colors"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
