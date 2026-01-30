import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';

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

  const handleVoiceTranscription = (text: string) => {
    setMessage(text);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <VoiceRecorder
        onTranscription={handleVoiceTranscription}
        disabled={disabled}
        language={language}
      />
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={!message.trim() || disabled} className="shrink-0">
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}
