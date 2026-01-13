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

    const styles = [
      { id: 1, style: "קלאסי ומסורתי", description: "elegant classic Hebrew wedding invitation with ornate borders, gold accents, traditional Jewish design elements, serif fonts" },
      { id: 2, style: "מודרני ועכשווי", description: "modern minimalist Hebrew wedding invitation, clean lines, contemporary design, sans-serif fonts, subtle geometric patterns" },
      { id: 3, style: "רומנטי ופואטי", description: "romantic Hebrew wedding invitation with soft watercolor flowers, blush pink and gold colors, elegant calligraphy style" },
      { id: 4, style: "אלגנטי ופשוט", description: "simple elegant Hebrew wedding invitation, white background, delicate border, refined typography, understated luxury" },
    ];

    const invitations = [];

    for (const styleInfo of styles) {
      const prompt = `Create a beautiful Hebrew wedding invitation image. Style: ${styleInfo.description}. 
The invitation should include this text in Hebrew (right-to-left):
- Groom name: ${groomName}
- Bride name: ${brideName}
- Groom's parents: ${groomParents || "לא צוין"}
- Bride's parents: ${brideParents || "לא צוין"}
- Groom's grandparents: ${groomGrandparents || ""}
- Bride's grandparents: ${brideGrandparents || ""}
- Introduction text: ${introText || "הנכם מוזמנים לחתונתנו"}

Make it a professional, print-ready wedding invitation design. The text should be clearly readable in Hebrew. Include decorative elements that match the style.`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              { role: "user", content: prompt }
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          console.error(`Failed to generate image for style ${styleInfo.style}:`, response.status);
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
      return new Response(JSON.stringify({ error: "לא הצלחנו ליצור הזמנות" }), {
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
