import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Case, Message, SupportedLanguage, UI_TRANSLATIONS } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LanguageSelector } from '@/components/chat/LanguageSelector';
import { EmergencyButtons } from '@/components/chat/EmergencyButtons';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [location, setLocation] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = UI_TRANSLATIONS[language];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to new messages for the current case
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`citizen-messages-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);

    try {
      let currentCaseId = caseId;

      // Create a new case if none exists
      if (!currentCaseId) {
        const { data: newCase, error: caseError } = await supabase
          .from('cases')
          .insert({
            language,
            location: location || null,
            status: 'active',
          })
          .select()
          .single();

        if (caseError) throw caseError;
        currentCaseId = newCase.id;
        setCaseId(currentCaseId);
      }

      // Insert user message
      const { data: userMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          case_id: currentCaseId,
          sender: 'user',
          content,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Add to local state immediately for responsiveness
      setMessages((prev) => {
        if (prev.some((m) => m.id === userMessage.id)) return prev;
        return [...prev, userMessage];
      });

      // Get all messages for context
      const allMessages = [...messages, userMessage];

      // Call triage API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/triage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            caseId: currentCaseId,
            message: content,
            language,
            location: location || undefined,
            conversationHistory: allMessages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Service is busy. Please try again in a moment.');
        } else if (response.status === 402) {
          toast.error('Service temporarily unavailable.');
        } else {
          throw new Error(errorData.error || 'Triage failed');
        }
        return;
      }

      const data = await response.json();

      // The assistant message is already inserted by the edge function
      // and will arrive via realtime subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencySelect = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-2xl px-4 py-4 flex flex-col">
        {/* Welcome Card - shown only before conversation starts */}
        {messages.length === 0 && (
          <div className="space-y-4 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                    </div>
                  </div>
                  <LanguageSelector value={language} onChange={setLanguage} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={t.locationPlaceholder}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">{t.quickEmergency}</p>
                  <EmergencyButtons language={language} onSelect={handleEmergencySelect} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          {messages.length > 0 && (
            <CardHeader className="pb-2 border-b flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                </div>
              </div>
              <LanguageSelector value={language} onChange={setLanguage} />
            </CardHeader>
          )}
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">How can we help?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Use the quick emergency buttons above or type your message below.
                    We're here to help 24/7.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="chat-bubble-assistant flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing your situation...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <ChatInput
                onSend={sendMessage}
                placeholder={t.messagePlaceholder}
                disabled={isLoading}
                language={language}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default Index;
