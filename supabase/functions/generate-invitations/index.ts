import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, groomName, brideName, childName, familyName, groomParents, brideParents, introText, eventDate, hebrewDate, receptionTime, ceremonyTime, venueName, venueLocation, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build dynamic text content based on event type
    const isWedding = eventType === "חתונה" || eventType === "אירוסין";
    let textContent = "";

    if (isWedding) {
      textContent = `
שם החתן: ${groomName || ""}
שם הכלה: ${brideName || ""}
הורי החתן: ${groomParents || ""}
הורי הכלה: ${brideParents || ""}`;
    } else {
      textContent = `
שם: ${childName || ""}
משפחה: ${familyName || ""}`;
    }

    const styles = [
      { id: 1, style: "קלאסי פרחוני", description: "elegant floral wedding invitation with soft pink roses, gold accents, ornate botanical frame, luxurious feel, professional print-ready design" },
      { id: 2, style: "מודרני מינימליסטי", description: "modern minimalist invitation, clean white background, thin gold geometric lines, contemporary typography, sleek and sophisticated" },
      { id: 3, style: "יוקרתי זהב ושחור", description: "luxury black and gold invitation, art deco style, shimmering gold foil effect, dramatic dark background, prestigious feel" },
      { id: 4, style: "רומנטי פסטלי", description: "romantic pastel watercolor invitation, soft lavender and blush tones, dreamy floral elements, delicate calligraphy style fonts" },
    ];

    const invitations = [];

    for (const styleInfo of styles) {
      const prompt = `Create a stunning, professional Hebrew event invitation image. 
Style: ${styleInfo.description}

This is a ${eventType || "חתונה"} invitation.

The invitation MUST include this Hebrew text (RTL right-to-left):
- Title/Intro: ${introText || "בשמחה רבה אנו מזמינים אתכם"}
${textContent}
- תאריך: ${eventDate || ""}
${hebrewDate ? `- תאריך עברי: ${hebrewDate}` : ""}
${receptionTime ? `- קבלת פנים: ${receptionTime}` : ""}
${ceremonyTime ? `- חופה: ${ceremonyTime}` : ""}
${venueName ? `- מקום: ${venueName}` : ""}
${venueLocation ? `- כתובת: ${venueLocation}` : ""}
${notes ? `- הערות: ${notes}` : ""}

CRITICAL REQUIREMENTS:
- All text MUST be in Hebrew, written right-to-left
- The design should be print-ready, 5:7 aspect ratio (portrait)
- Use beautiful typography with clear hierarchy
- Names should be prominent and elegant
- Include decorative elements matching the style
- Professional quality, suitable for printing`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              { role: "user", content: prompt }
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          const status = response.status;
          console.error(`Failed to generate image for style ${styleInfo.style}: status ${status}`);
          if (status === 429) {
            return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב מאוחר יותר" }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (status === 402) {
            return new Response(JSON.stringify({ error: "נדרש תשלום, אנא הוסף קרדיטים" }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          invitations.push({
            id: styleInfo.id,
            style: styleInfo.style,
            imageUrl: imageUrl,
          });
        }
      } catch (styleError) {
        console.error(`Error generating style ${styleInfo.style}:`, styleError);
      }
    }

    if (invitations.length === 0) {
      return new Response(JSON.stringify({ error: "לא הצלחנו ליצור הזמנות, נסה שוב" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ invitations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    const error = err as { message?: string; status?: number };

    if (error.message?.includes("429") || error.status === 429) {
      return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב מאוחר יותר" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error.message?.includes("402") || error.status === 402) {
      return new Response(JSON.stringify({ error: "נדרש תשלום, אנא הוסף קרדיטים" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: error.message || "שגיאה לא ידועה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
