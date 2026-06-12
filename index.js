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
// MEMORY STORAGE (PER USER)
// =========================
const conversations = {};

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (clean session memory system)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // require sessionId for proper separation
  const sid = sessionId || "global";

  if (!conversations[sid]) {
    conversations[sid] = [];
  }

  // store user message
  conversations[sid].push({
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

PERSONALITY:
- helpful, direct, technical when needed

RULES:
- Remember everything in this session
- NEVER invent PC specs, hardware, or user data
- If info is missing, say "unknown"
- Use only provided conversation context
- Do not hallucinate full PC builds

BEHAVIOR:
- If user gives specs, use them immediately
- If user asks for their specs, extract from conversation history
- Focus on accurate PC troubleshooting and upgrades
`
          },
          ...conversations[sid]
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
    conversations[sid].push({
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