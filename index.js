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
// STRICT PER-SESSION MEMORY
// =========================
const conversations = {};

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (STRICT per-device sessions)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  // ❌ NO SESSION = REJECT (prevents shared/global memory bugs)
  if (!sessionId) {
    return res.json({
      reply: "Missing sessionId. Each device must have its own session."
    });
  }

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // create isolated memory per device
  if (!conversations[sessionId]) {
    conversations[sessionId] = [];
  }

  // store user message
  conversations[sessionId].push({
    role: "user",
    content: message
  });

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

CRITICAL RULES:
- You ONLY know the current session
- You MUST NOT mix users or devices
- You MUST NOT assume identity or reuse names
- If something is not in this session, say unknown
- Never invent PC specs
- Be accurate, direct, and technical
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

    // store assistant reply
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