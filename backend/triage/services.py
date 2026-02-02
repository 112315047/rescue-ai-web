import json
import os
from openai import OpenAI
from django.conf import settings

LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
}

class TriageService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def triage(self, message, conversation_history=None, language="en", location=None):
        if not self.client:
            print("WARNING: No OpenAI Key found. Using Mock Triage.")
            return {
                "triage": {
                    "priority": "P4",
                    "urgencyScore": 10,
                    "category": "other",
                    "actions": ["Mock Action: Ensure safety"],
                    "questions": ["Is this a real emergency? (Mock Mode)"],
                    "escalationNeeded": False
                },
                "reply": "System Alert: AI is running in offline/mock mode. Please contact 911 for real emergencies.",
                "raw": "Mock response"
            }

        language_name = LANGUAGE_MAP.get(language, "English")
        
        system_prompt = f"""You are RescueAI, an emergency triage assistant deployed in disaster zones. Your role is to:
1. Assess emergency situations quickly and accurately
2. Provide structured triage information
3. Give clear, actionable safety advice
4. Ask follow-up questions when critical information is missing

CRITICAL RULES:
- NEVER hallucinate or make up information you don't have
- If information is missing, ask specific questions to gather it
- For life-threatening situations, ALWAYS set escalationNeeded to true
- Prioritize life safety above all else

TRIAGE CATEGORIES:
- P1 (Critical): Immediate life threat - unconscious, not breathing, severe bleeding, chest pain
- P2 (Urgent): Serious but stable - broken bones, burns, moderate bleeding
- P3 (Delayed): Minor injuries - cuts, bruises, mild pain
- P4 (Minor): Non-urgent - general inquiries, minor discomfort

You must ALWAYS respond with valid JSON in this exact format:
{{
  "priority": "P1" | "P2" | "P3" | "P4",
  "urgencyScore": 0-100,
  "category": "medical" | "fire" | "trapped" | "shelter" | "food" | "water" | "mental" | "other",
  "actions": ["action1", "action2", "action3"],
  "questions": ["question1", "question2"],
  "escalationNeeded": true | false
}}

After the JSON, on a new line starting with "REPLY:", provide a compassionate response in {language_name} that:
- Acknowledges their situation
- Includes the most critical safety action
- Asks any necessary follow-up questions
- Reassures them help is being coordinated

{f"Reported location: {location}" if location else "Location not provided - consider asking for it if relevant."}"""

        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3
            )
            
            ai_content = response.choices[0].message.content
            
            # Parse response
            triage_data = {
                "priority": "P4",
                "urgencyScore": 25,
                "category": "other",
                "actions": ["Stay calm and wait for assistance"],
                "questions": [],
                "escalationNeeded": False,
            }
            reply = "I'm here to help. Could you please tell me more about your situation?"

            # Extract JSON
            import re
            json_match = re.search(r'\{[\s\S]*?\}', ai_content)
            if json_match:
                try:
                    triage_data.update(json.loads(json_match.group(0)))
                except json.JSONDecodeError:
                    pass
            
            # Extract Reply
            reply_match = re.search(r'REPLY:\s*([\s\S]*)', ai_content, re.IGNORECASE)
            if reply_match:
                reply = reply_match.group(1).strip()
            elif not json_match:
                reply = ai_content

            return {
                "triage": triage_data,
                "reply": reply,
                "raw": ai_content
            }

        except Exception as e:
            print(f"AI Error: {e}")
            return {
                "error": str(e),
                "reply": "I am having trouble processing your request. Please stay safe.",
                "triage": {}
            }
