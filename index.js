const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log(
  "OPENROUTER KEY EXISTS:",
  process.env.OPENROUTER_API_KEY ? "YES" : "NO"
);

// =========================
// MEMORY (FAST + COMPRESSED)
// =========================
const conversations = {};
const summaries = {};

// simple auto-summary trigger
function shouldCompress(history) {
  return history.length > 14;
}

// VERY light summary (no extra API calls)
function quickSummary(history) {
  const lastSpecs = history
    .filter(m =>
      m.content.toLowerCase().includes("rx") ||
      m.content.toLowerCase().includes("gtx") ||
      m.content.toLowerCase().includes("rtx") ||
      m.content.toLowerCase().includes("i5") ||
      m.content.toLowerCase().includes("ryzen") ||
      m.content.toLowerCase().includes("ram")
    )
    .slice(-5)
    .map(m => m.content)
    .join(" | ");

  return lastSpecs || summaries["none"] || "";
}

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (optimized memory version)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const { message, sessionId = "global" } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  if (!conversations[sessionId]) {
    conversations[sessionId] = [];
    summaries[sessionId] = "";
  }

  conversations[sessionId].push({
    role: "user",
    content: message
  });

  // compress memory (keep only last messages)
  if (shouldCompress(conversations[sessionId])) {
    summaries[sessionId] =
      quickSummary(conversations[sessionId]) || summaries[sessionId];

    conversations[sessionId] = conversations[sessionId].slice(-6);
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are LimuAI, a PC hardware expert assistant.

MEMORY:
${summaries[sessionId] || "No stored memory yet"}

RULES:
- Use memory if available
- Never invent PC specs
- If unknown, say unknown
- Be direct, short, and helpful
`
          },
          ...conversations[sessionId]
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jorgolimuai.netlify.app",
          "X-Title": "LimuAI"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    conversations[sessionId].push({
      role: "assistant",
      content: aiReply
    });

    return res.json({ reply: aiReply });
  } catch (error) {
    console.log("OPENROUTER ERROR:", error.response?.data || error.message);

    return res.json({
      reply: "AI error (OpenRouter failed request)"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});