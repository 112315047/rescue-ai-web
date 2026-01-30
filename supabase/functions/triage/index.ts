import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId, message, language, location, conversationHistory } = await req.json();

    if (!caseId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing caseId or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const languageName = LANGUAGE_MAP[language] || "English";

    // Build conversation context
    const conversationContext = conversationHistory
      ?.map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join("\n") || "";

    const systemPrompt = `You are RescueAI, an emergency triage assistant deployed in disaster zones. Your role is to:
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
{
  "priority": "P1" | "P2" | "P3" | "P4",
  "urgencyScore": 0-100,
  "category": "medical" | "fire" | "trapped" | "shelter" | "food" | "water" | "mental" | "other",
  "actions": ["action1", "action2", "action3"],
  "questions": ["question1", "question2"],
  "escalationNeeded": true | false
}

After the JSON, on a new line starting with "REPLY:", provide a compassionate response in ${languageName} that:
- Acknowledges their situation
- Includes the most critical safety action
- Asks any necessary follow-up questions
- Reassures them help is being coordinated

${location ? `Reported location: ${location}` : "Location not provided - consider asking for it if relevant."}`;

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    } else {
      messages.push({ role: "user", content: message });
    }

    // If the last message wasn't the current one, add it
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "user" || lastMsg.content !== message) {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse the response
    let triageData = {
      priority: "P4" as const,
      urgencyScore: 25,
      category: "other" as const,
      actions: ["Stay calm and wait for assistance"],
      questions: [],
      escalationNeeded: false,
    };
    let userReply = "I'm here to help. Could you please tell me more about your situation?";

    try {
      // Extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        triageData = {
          priority: parsed.priority || "P4",
          urgencyScore: parsed.urgencyScore || 25,
          category: parsed.category || "other",
          actions: parsed.actions || [],
          questions: parsed.questions || [],
          escalationNeeded: parsed.escalationNeeded || false,
        };
      }

      // Extract reply after "REPLY:"
      const replyMatch = aiContent.match(/REPLY:\s*([\s\S]*)/i);
      if (replyMatch) {
        userReply = replyMatch[1].trim();
      } else if (!jsonMatch) {
        // If no structured response, use the whole content
        userReply = aiContent;
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      userReply = aiContent || userReply;
    }

    // Update case with triage data
    const { error: updateError } = await supabase
      .from("cases")
      .update({
        priority: triageData.priority,
        urgency_score: triageData.urgencyScore,
        category: triageData.category,
        escalation_needed: triageData.escalationNeeded,
        last_message: message.substring(0, 500),
        triage_data: triageData,
      })
      .eq("id", caseId);

    if (updateError) {
      console.error("Error updating case:", updateError);
    }

    // Insert assistant message
    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        case_id: caseId,
        sender: "assistant",
        content: userReply,
      });

    if (msgError) {
      console.error("Error inserting message:", msgError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        triage: triageData,
        reply: userReply,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Triage error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
