import { useState, useCallback, useEffect } from 'react';

export const useVoiceAssistant = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Map app languages to BCP 47 tags for TTS
  const languageMap: Record<string, string[]> = {
    en: ['en-US', 'en-GB', 'en-IN'],
    hi: ['hi-IN'],
    te: ['te-IN'],
    ta: ['ta-IN'],
  };

  const speak = useCallback((text: string, lang: string) => {
    if (!isEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangs = languageMap[lang] || ['en-US'];

    // Find the best available voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => targetLangs.some(l => v.lang.startsWith(l))) || 
                  voices.find(v => v.lang.startsWith('en')) ||
                  voices[0];

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Adjust rate and pitch for a friendly assistant tone
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (!newState) stop();
  }, [isEnabled, stop]);

  // Handle Chrome's specific voice loading behavior
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return { isEnabled, isSpeaking, speak, stop, toggle };
};
