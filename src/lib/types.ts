// Case and message types for RescueAI
import { Json } from '@/integrations/supabase/types';

export type CasePriority = 'P1' | 'P2' | 'P3' | 'P4';
export type CaseStatus = 'active' | 'assigned' | 'resolved';
export type CaseCategory = 'medical' | 'fire' | 'trapped' | 'shelter' | 'food' | 'water' | 'mental' | 'other';
export type MessageSender = 'user' | 'assistant';

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta';

export interface TriageResponse {
  priority: CasePriority;
  urgencyScore: number;
  category: CaseCategory;
  actions: string[];
  questions: string[];
  escalationNeeded: boolean;
  userReply?: string;
}

export interface Case {
  id: string;
  language: string;
  location: string | null;
  priority: CasePriority;
  urgency_score: number;
  category: CaseCategory;
  escalation_needed: boolean;
  status: CaseStatus;
  assigned_to: string | null;
  last_message: string | null;
  triage_data: Json | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  sender: MessageSender;
  content: string;
  created_at: string;
}

export interface EmergencyType {
  id: string;
  icon: string;
  label: Record<SupportedLanguage, string>;
  message: Record<SupportedLanguage, string>;
  category: CaseCategory;
}

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
];

export const EMERGENCY_TYPES: EmergencyType[] = [
  {
    id: 'accident',
    icon: '🚗',
    label: { en: 'Accident', hi: 'दुर्घटना', te: 'ప్రమాదం', ta: 'விபத்து' },
    message: {
      en: 'There has been an accident. I need help.',
      hi: 'एक दुर्घटना हुई है। मुझे मदद चाहिए।',
      te: 'ప్రమాదం జరిగింది. నాకు సహాయం కావాలి.',
      ta: 'விபத்து நடந்துள்ளது. எனக்கு உதவி வேண்டும்.',
    },
    category: 'medical',
  },
  {
    id: 'bleeding',
    icon: '🩸',
    label: { en: 'Bleeding', hi: 'खून बह रहा', te: 'రక్తస్రావం', ta: 'இரத்தப்போக்கு' },
    message: {
      en: 'Someone is bleeding badly and needs medical help.',
      hi: 'किसी को बहुत खून बह रहा है और उसे चिकित्सा सहायता चाहिए।',
      te: 'ఎవరికైనా చాలా రక్తస్రావం అవుతోంది మరియు వైద్య సహాయం అవసరం.',
      ta: 'யாரோ ஒருவருக்கு அதிகமாக இரத்தப்போக்கு ஏற்பட்டுள்ளது, மருத்துவ உதவி தேவை.',
    },
    category: 'medical',
  },
  {
    id: 'fire',
    icon: '🔥',
    label: { en: 'Fire', hi: 'आग', te: 'అగ్ని', ta: 'தீ' },
    message: {
      en: 'There is a fire. Please send help immediately.',
      hi: 'आग लगी है। कृपया तुरंत मदद भेजें।',
      te: 'అగ్ని ప్రమాదం. దయచేసి వెంటనే సహాయం పంపండి.',
      ta: 'தீ விபத்து. உடனடியாக உதவி அனுப்புங்கள்.',
    },
    category: 'fire',
  },
  {
    id: 'flood',
    icon: '🌊',
    label: { en: 'Flood', hi: 'बाढ़', te: 'వరద', ta: 'வெள்ளம்' },
    message: {
      en: 'We are affected by flooding and need rescue.',
      hi: 'हम बाढ़ से प्रभावित हैं और हमें बचाव की जरूरत है।',
      te: 'వరదల వల్ల మేము ప్రభావితమయ్యాము, రక్షణ అవసరం.',
      ta: 'வெள்ளத்தால் பாதிக்கப்பட்டுள்ளோம், மீட்பு தேவை.',
    },
    category: 'shelter',
  },
  {
    id: 'trapped',
    icon: '🏚️',
    label: { en: 'Trapped', hi: 'फंसा हुआ', te: 'చిక్కుకున్న', ta: 'சிக்கியுள்ளோம்' },
    message: {
      en: 'We are trapped and cannot escape. Please help.',
      hi: 'हम फंसे हुए हैं और बाहर नहीं निकल सकते। कृपया मदद करें।',
      te: 'మేము చిక్కుకున్నాము, బయటకు రాలేకపోతున్నాము. దయచేసి సహాయం చేయండి.',
      ta: 'சிக்கியுள்ளோம், வெளியேற முடியவில்லை. உதவுங்கள்.',
    },
    category: 'trapped',
  },
  {
    id: 'food_water',
    icon: '🍞',
    label: { en: 'Food/Water', hi: 'भोजन/पानी', te: 'ఆహారం/నీరు', ta: 'உணவு/தண்ணீர்' },
    message: {
      en: 'We need food and water urgently.',
      hi: 'हमें तुरंत खाने और पानी की जरूरत है।',
      te: 'మాకు ఆహారం మరియు నీరు అత్యవసరంగా అవసరం.',
      ta: 'எங்களுக்கு உடனடியாக உணவு மற்றும் தண்ணீர் தேவை.',
    },
    category: 'food',
  },
];

export const UI_TRANSLATIONS: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  locationPlaceholder: string;
  messagePlaceholder: string;
  send: string;
  quickEmergency: string;
  recording: string;
  holdToRecord: string;
  networkWeak: string;
  disclaimer: string;
}> = {
  en: {
    title: 'RescueAI',
    subtitle: 'Emergency Support',
    locationPlaceholder: 'Enter your location (area, landmark)',
    messagePlaceholder: 'Describe your emergency...',
    send: 'Send',
    quickEmergency: 'Quick Emergency',
    recording: 'Recording...',
    holdToRecord: 'Hold to record',
    networkWeak: 'Network weak, please type your message',
    disclaimer: 'This is an AI assistant. For life-threatening emergencies, also call local emergency services.',
  },
  hi: {
    title: 'RescueAI',
    subtitle: 'आपातकालीन सहायता',
    locationPlaceholder: 'अपना स्थान दर्ज करें (क्षेत्र, लैंडमार्क)',
    messagePlaceholder: 'अपनी आपात स्थिति का वर्णन करें...',
    send: 'भेजें',
    quickEmergency: 'त्वरित आपातकाल',
    recording: 'रिकॉर्डिंग...',
    holdToRecord: 'रिकॉर्ड करने के लिए दबाए रखें',
    networkWeak: 'नेटवर्क कमजोर है, कृपया टाइप करें',
    disclaimer: 'यह एक AI सहायक है। जानलेवा आपात स्थिति के लिए, स्थानीय आपातकालीन सेवाओं को भी कॉल करें।',
  },
  te: {
    title: 'RescueAI',
    subtitle: 'అత్యవసర సహాయం',
    locationPlaceholder: 'మీ స్థానాన్ని నమోదు చేయండి (ప్రాంతం, ల్యాండ్‌మార్క్)',
    messagePlaceholder: 'మీ అత్యవసర పరిస్థితిని వివరించండి...',
    send: 'పంపు',
    quickEmergency: 'త్వరిత అత్యవసరం',
    recording: 'రికార్డింగ్...',
    holdToRecord: 'రికార్డ్ చేయడానికి నొక్కి ఉంచండి',
    networkWeak: 'నెట్‌వర్క్ బలహీనంగా ఉంది, దయచేసి టైప్ చేయండి',
    disclaimer: 'ఇది AI సహాయకుడు. ప్రాణాంతక అత్యవసర పరిస్థితుల్లో, స్థానిక అత్యవసర సేవలకు కూడా కాల్ చేయండి.',
  },
  ta: {
    title: 'RescueAI',
    subtitle: 'அவசர உதவி',
    locationPlaceholder: 'உங்கள் இருப்பிடத்தை உள்ளிடுங்கள் (பகுதி, அடையாளம்)',
    messagePlaceholder: 'உங்கள் அவசரநிலையை விவரிக்கவும்...',
    send: 'அனுப்பு',
    quickEmergency: 'விரைவு அவசரம்',
    recording: 'பதிவு செய்கிறது...',
    holdToRecord: 'பதிவு செய்ய அழுத்திப் பிடிக்கவும்',
    networkWeak: 'நெட்வொர்க் பலவீனமாக உள்ளது, தயவுசெய்து தட்டச்சு செய்யுங்கள்',
    disclaimer: 'இது AI உதவியாளர். உயிருக்கு ஆபத்தான அவசரநிலைகளுக்கு, உள்ளூர் அவசர சேவைகளையும் அழைக்கவும்.',
  },
};
