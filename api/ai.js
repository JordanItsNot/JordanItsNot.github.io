
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing AI_GATEWAY_API_KEY environment variable"
    });
  }

  try {
    const { prompt } = req.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      "https://ai-gateway.vercel.sh/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, data);
      return res.status(502).json({
        error: "AI Gateway request failed",
        details: data.error?.message || "Check Vercel function logs"
      });
    }

    const text = data.choices?.[0]?.message?.content;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(502).json({ error: "AI returned no text" });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("AI API error:", error);
    return res.status(500).json({ error: "AI request failed" });
  }
}
