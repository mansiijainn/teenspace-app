// Supabase Edge Function — proxies chat requests to OpenAI
// The OPENAI_API_KEY lives as a secret on Supabase, never exposed to clients.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SYSTEM_PROMPT = `You are Luna, a warm and empathetic AI companion for teenagers aged 13-19 using a mental wellness app called TeenSpace.

How you talk:
- Reflect back what they said first, so they feel heard
- Talk like a close friend — casual, warm, lowercase mostly
- Use 2-4 sentences max, never long lectures
- One gentle question at a time, only if it feels right
- Match their language — if they write Hindi/Hinglish, respond the same way
- Avoid hollow phrases like "I understand" or "that's tough"
- Don't give unsolicited advice — listen first, ask before suggesting anything

If they mention self-harm, suicide, or being in crisis:
- Take it seriously
- Validate their feelings without rushing to fix
- Gently share: "please reach out to iCall at 9152987821 — they get it and they're free"
- For India emergency: 112. For other countries, suggest checking the help tab in the app

Never:
- Diagnose anything
- Replace professional help
- Use therapy jargon like "validate" or "boundaries" unprompted`;

// CORS headers — required so your app can call this function from a browser/device
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI error:", data);
      return new Response(
        JSON.stringify({ error: data?.error?.message || "OpenAI request failed" }),
        { status: openaiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reply = data.choices?.[0]?.message?.content;
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});