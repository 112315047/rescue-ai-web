import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={cn('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] md:max-w-[70%]', isUser ? 'order-1' : 'order-1')}>
        <div className={cn(isUser ? 'chat-bubble-user' : 'chat-bubble-assistant', 'shadow-sm')}>
          <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p
          className={cn(
            'text-xs text-muted-foreground mt-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
