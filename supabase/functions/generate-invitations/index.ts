import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { groomName, brideName, groomParents, brideParents, groomGrandparents, brideGrandparents, introText } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `אתה מומחה לכתיבת הזמנות לחתונות בעברית. צור 4 הזמנות שונות לאירוע חתונה בסגנונות שונים:
1. קלאסי ומסורתי
2. מודרני ועכשווי
3. רומנטי ופואטי
4. אלגנטי ופשוט

כל הזמנה צריכה לכלול את הפרטים הבאים בצורה יצירתית:
- שמות החתן והכלה
- שמות ההורים
- שמות הסבים והסבתות (אם סופקו)
- טקסט מקדים (אם סופק)

החזר את התשובה בפורמט JSON בלבד עם המבנה הבא:
{
  "invitations": [
    {
      "id": 1,
      "style": "קלאסי",
      "title": "כותרת ההזמנה",
      "content": "טקסט ההזמנה המלא"
    }
  ]
}`;

    const userPrompt = `צור 4 הזמנות לחתונה עם הפרטים הבאים:
שם החתן: ${groomName}
שם הכלה: ${brideName}
הורי החתן: ${groomParents || "לא צוין"}
הורי הכלה: ${brideParents || "לא צוין"}
סבא וסבתא החתן: ${groomGrandparents || "לא צוין"}
סבא וסבתא הכלה: ${brideGrandparents || "לא צוין"}
טקסט מקדים: ${introText || "לא צוין"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב מאוחר יותר" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום, אנא הוסף קרדיטים" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "שגיאה ביצירת ההזמנות" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from response
    let invitations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        invitations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return new Response(JSON.stringify({ error: "שגיאה בעיבוד התשובה" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(invitations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא ידועה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
