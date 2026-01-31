export interface FirstAidStep {
  title: string;
  description: string;
}

export interface FirstAidGuide {
  id: string;
  icon: string;
  title: string;
  steps: FirstAidStep[];
}

export const FIRST_AID_DATA: Record<string, FirstAidGuide[]> = {
  en: [
    {
      id: "cpr",
      icon: "HeartPulse",
      title: "CPR (Adult)",
      steps: [
        { title: "Check Surroundings", description: "Ensure the area is safe for you and the victim." },
        { title: "Check Response", description: "Tap shoulders and shout. If no response, call emergency services." },
        { title: "Chest Compressions", description: "Push hard and fast in the center of the chest (100-120bpm)." },
        { title: "Rescue Breaths", description: "If trained, give 2 breaths after every 30 compressions." }
      ]
    },
    {
      id: "bleeding",
      icon: "Droplets",
      title: "Severe Bleeding",
      steps: [
        { title: "Apply Pressure", description: "Press a clean cloth or bandage firmly on the wound." },
        { title: "Maintain Pressure", description: "Do not lift the cloth to check. Add more layers if soaked." },
        { title: "Elevate", description: "If possible, keep the wounded area above the heart." },
        { title: "Tourniquet", description: "As a last resort for limbs, tie a cloth tightly above the wound." }
      ]
    }
  ],
  hi: [
    {
      id: "cpr",
      icon: "HeartPulse",
      title: "CPR (वयस्क)",
      steps: [
        { title: "आस-पास की जाँच लें", description: "सुनिश्चित करें कि क्षेत्र आपके और पीड़ित के लिए सुरक्षित है।" },
        { title: "प्रतिक्रिया जाँचें", description: "कंधों को थपथपाएं और चिल्लाएं। कोई प्रतिक्रिया न होने पर आपातकालीन सेवाओं को कॉल करें।" },
        { title: "छाती को दबाना", description: "छाती के बीच में जोर से और तेजी से दबाएं (100-120 बार प्रति मिनट)।" }
      ]
    },
    {
      id: "bleeding",
      icon: "Droplets",
      title: "भारी रक्तस्राव",
      steps: [
        { title: "दबाव डालें", description: "घाव पर एक साफ कपड़ा या पट्टी जोर से दबाएं।" },
        { title: "दबाव बनाए रखें", description: "कपड़ा हटाकर जाँच न करें। अगर भीग जाए तो और परतें जोड़ें।" }
      ]
    }
  ],
  te: [
    {
      id: "cpr",
      icon: "HeartPulse",
      title: "CPR (పెద్దలు)",
      steps: [
        { title: "పరిసరాలను తనిఖీ చేయండి", description: "ప్రాంతం మీకు మరియు బాధితుడికి సురక్షితంగా ఉందని నిర్ధారించుకోండి." },
        { title: "ప్రతిస్పందన తనిఖీ", description: "భుజాలను తట్టి అరవండి. స్పందన లేకపోతే అత్యవసర సేవలకు కాల్ చేయండి." }
      ]
    },
    {
      id: "bleeding",
      icon: "Droplets",
      title: "తీవ్రమైన రక్తస్రావం",
      steps: [
        { title: "ఒత్తిడిని కలిగించండి", description: "గాయంపై శుభ్రమైన గుడ్డ లేదా బ్యాండేజీని గట్టిగా నొక్కండి." }
      ]
    }
  ],
  ta: [
    {
      id: "cpr",
      icon: "HeartPulse",
      title: "CPR (பெரியவர்கள்)",
      steps: [
        { title: "சுற்றுப்புறத்தைச் சரிபார்க்கவும்", description: "பகுதி உங்களுக்கும் பாதிக்கப்பட்டவருக்கும் பாதுகாப்பானது என்பதை உறுதிப்படுத்தவும்." },
        { title: "பதிலைச் சரிபார்க்கவும்", description: "தோள்களைத் தட்டி சத்தம் போடவும். பதில் இல்லையெனில் அவசர சேவையை அழைக்கவும்." }
      ]
    },
    {
      id: "bleeding",
      icon: "Droplets",
      title: "கடுமையான இரத்தப்போக்கு",
      steps: [
        { title: "அழுத்தம் கொடுக்கவும்", description: "காயத்தின் மீது சுத்தமான துணி அல்லது கட்டை வைத்து பலமாக அழுத்தவும்." }
      ]
    }
  ]
};
