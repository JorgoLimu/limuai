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
// SESSION MEMORY (RAM ONLY)
// =========================
const conversations = {};

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (session memory only)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const { message, sessionId = "global" } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // create session if missing
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
You are LimuAI, a professional PC hardware expert assistant.

PERSONALITY:
- You are helpful, direct, and technical when needed
- You help users with PC builds, upgrades, and troubleshooting

CRITICAL RULES:
- You remember everything inside this session
- Never say you forgot or that this is the first message
- Never invent PC specs or hardware
- Only use information given in this conversation
- If something is unknown, say it is unknown instead of guessing
- Do not hallucinate full PC builds

BEHAVIOR:
- If user provides specs, use them immediately
- If user asks "what are my specs", extract from chat history
- If user asks for upgrades, respond directly
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