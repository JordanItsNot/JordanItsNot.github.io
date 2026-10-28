
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not configured");
    return res.status(500).json({
      error: "AI service is not configured"
    });
  }

  const prompt = req.body?.prompt;

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > 50000
  ) {
    return res.status(400).json({
      error: "A valid prompt is required"
    });
  }

  try {
    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2500,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Anthropic API error:",
        response.status,
        data.error?.type || "unknown"
      );

      if (response.status === 429) {
        return res.status(429).json({
          error: "Rate limit reached. Please try again shortly."
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: "AI authentication failed. Check the server configuration."
        });
      }

      return res.status(502).json({
        error: "The AI provider could not complete the request."
      });
    }

    const text = (data.content || [])
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("");

    if (!text.trim()) {
      return res.status(502).json({
        error: "The AI provider returned an empty response."
      });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("AI request failed:", error.message);

    return res.status(502).json({
      error: "Could not connect to the AI provider."
    });
  }
}
