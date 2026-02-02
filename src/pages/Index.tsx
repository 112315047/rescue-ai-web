import { useState, useEffect, useRef } from 'react';
import { Case, Message, SupportedLanguage, UI_TRANSLATIONS } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LanguageSelector } from '@/components/chat/LanguageSelector';
import { EmergencyButtons } from '@/components/chat/EmergencyButtons';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Shield, Loader2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import * as api from '@/services/api';

const Index = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  // Diagnostics removed as we are moving away from direct Supabase requirement for chat

  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeocodedLocation, setLastGeocodedLocation] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'fallback' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isEnabled: isVoiceEnabled, toggle: toggleVoice, speak } = useVoiceAssistant();

  const t = UI_TRANSLATIONS[language];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Voice feedback for assistant messages
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'assistant' && isVoiceEnabled) {
      speak(lastMessage.content, language);
    }
  }, [messages, isVoiceEnabled, speak, language]);

  // Automatically request location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Detect location on mount or when requested
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    console.log('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Raw coordinates detected:', latitude, longitude);
        setCoords({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          console.log('Reverse geocoding response:', data);
          if (data.display_name) {
            setLocation(data.display_name);
            setLastGeocodedLocation(data.display_name);
            setLocationSource('gps');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        } finally {
          setIsLocating(false);
          toast.success('Location detected');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Location access denied. Please enter it manually.');
        setIsLocating(false);
      }
    );
  };

  const geocodeLocation = async (locStr: string): Promise<{ lat: number; lng: number } | null> => {
    if (!locStr.trim()) return null;
    console.log('Geocoding location string:', locStr);
    
    const tryGeocode = async (query: string) => {
      // Append ", India" if not already present
      const searchQuery = query.toLowerCase().includes('india') ? query : `${query}, India`;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        const data = await resp.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      } catch (err) {
        console.error(`Geocoding failed for query: ${searchQuery}`, err);
      }
      return null;
    };

    // Try original first
    let result = await tryGeocode(locStr);
    
    // Unbiased retry logic if original fails
    if (!result && locStr.includes(',')) {
      const parts = locStr.split(',').map(p => p.trim());
      
      // Strategy 1: First 2 parts (more specific landmark/road)
      if (parts.length >= 2) {
        result = await tryGeocode(`${parts[0]}, ${parts[1]}`);
      }
      
      // Strategy 2: First part only
      if (!result && parts.length > 0) {
        result = await tryGeocode(parts[0]);
      }
    }

    // FINAL FALLBACK: If "Nagpur" is mentioned anywhere but geocoding fails, 
    // at least place them in Central Nagpur so they are visible.
    if (!result && locStr.toLowerCase().includes('nagpur')) {
      console.log("Geocoding failed but Nagpur detected. Placing in city center.");
      result = { lat: 21.1458, lng: 79.0882 };
    }

    if (result) {
      console.log('Geocoding success:', result);
      setCoords(result);
      setLastGeocodedLocation(locStr);
      setLocationSource('manual');
      return result;
    }
    
    console.warn('Geocoding failed for all attempts');
    return null;
  };

  // NOTE: Realtime subscription removed to rely on API response for immediate feedback.
  // Ideally, for multi-device support, we would keep Supabase realtime or implement websockets in Django.

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);

    try {
      let currentCaseId = caseId;
      let currentCoords = coords;

      // Force geocoding if the location text has changed since we last geocoded
      const locationChanged = location && location !== lastGeocodedLocation;
      
      if (locationChanged) {
        console.log(`Location changed from "${lastGeocodedLocation}" to "${location}". Forcing geocoding...`);
        currentCoords = await geocodeLocation(location);
      } else if (location && !currentCoords) {
        console.log('No coords yet, attempting to geocode location:', location);
        currentCoords = await geocodeLocation(location);
      }

      // Create a new case if none exists
      if (!currentCaseId) {
        // No location and no coords? Block submission.
        if (!currentCoords && !location) {
          toast.warning("Please provide a location for the emergency.");
          setIsLoading(false);
          return;
        }

        console.log('Preparing case creation. Coords:', currentCoords, 'Location:', location);

        try {
            const newCase = await api.createCase(
                language,
                location || 'Unknown',
                currentCoords?.lat,
                currentCoords?.lng
            );
            currentCaseId = newCase.id;
            setCaseId(currentCaseId);
        } catch (err: any) {
             console.error('Case creation failed', err);
             toast.error('Failed to start a new case. Please check your connection.');
             setIsLoading(false);
             return;
        }
      }

      // Optimistic user message (local only, real ID will come from backend, but we need to display it)
      const optimisticMessage: Message = {
          id: 'temp-' + Date.now(),
          case_id: currentCaseId!,
          sender: 'user',
          content: content,
          created_at: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);

      // Call API
      const response = await api.addMessage(
          currentCaseId!,
          content,
          location,
          currentCoords?.lat,
          currentCoords?.lng
      );
      
      // Update with AI response
      const aiMessage: Message = {
          id: response.message_id || 'ai-' + Date.now(),
          case_id: currentCaseId!,
          sender: 'assistant',
          content: response.reply,
          created_at: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, aiMessage]);

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

      <main className="flex-1 container max-w-4xl px-4 py-8 flex flex-col gap-6 mx-auto">
        {/* Welcome Section / Controls */}
        {messages.length === 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/20">
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
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                      locationSource === 'gps' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                      locationSource === 'manual' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                      locationSource === 'fallback' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{locationSource || 'No Source'}</span>
                  </div>
                  <LanguageSelector value={language} onChange={setLanguage} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Incident Location</label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t.locationPlaceholder}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => geocodeLocation(location)}
                    className="flex-1 h-12 text-base bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-all shadow-inner"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={cn(
                      "h-12 w-12 shrink-0 border-muted-foreground/20 transition-all",
                      isLocating ? "animate-pulse" : "hover:border-primary/50"
                    )}
                    onClick={detectLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <MapPin className={cn("h-5 w-5", locationSource === 'gps' ? "text-green-500" : "text-muted-foreground")} />
                    )}
                  </Button>
                </div>
                {locationSource === 'fallback' && (
                  <p className="text-[10px] text-orange-500 font-medium px-1 flex items-center gap-1">
                    ⚠️ Location not detected, using approximate default.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold mb-4 text-muted-foreground uppercase tracking-wider px-1">{t.quickEmergency}</p>
                <EmergencyButtons language={language} onSelect={handleEmergencySelect} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-[500px] shadow-sm border-border/60">
          {messages.length > 0 && (
            <CardHeader className="pb-3 border-b flex-row items-center justify-between bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  onClick={detectLocation}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-300",
                    location 
                      ? "bg-primary/5 text-primary/70 border border-primary/10 hover:bg-primary/10" 
                      : "bg-muted/50 text-muted-foreground animate-pulse"
                  )}
                >
                  <MapPin className={cn("h-3 w-3", isLocating && "animate-spin")} />
                  <span className="max-w-[150px] truncate">
                    {isLocating ? '...' : (location || 'Pending')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    isVoiceEnabled ? "text-primary" : "text-muted-foreground"
                  )}
                  title={isVoiceEnabled ? "Mute Bot" : "Unmute Bot"}
                >
                  {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
            </CardHeader>
          )}
          
          <CardContent className="flex-1 flex flex-col min-h-0 p-0 relative">
            <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/5 mb-6">
                    <Shield className="h-10 w-10 text-primary/30" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">How can we help?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Use the quick emergency buttons above or type your message below.
                    <br/>We're here to help 24/7.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="chat-bubble-assistant flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Analyzing situation...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
              <div className="w-full">
                <ChatInput
                  onSend={sendMessage}
                  placeholder={t.messagePlaceholder}
                  disabled={isLoading}
                  language={language}
                />
                <p className="text-[10px] text-center text-muted-foreground mt-3 opacity-60">
                  {t.disclaimer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default Index;
