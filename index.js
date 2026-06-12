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
// MEMORY STORAGE (PER SESSION)
// =========================
const conversations = {};

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (session-based memory)");
});

// =========================
// CHAT ROUTE
// =========================
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // 🔥 FIX: STRICT SESSION ISOLATION
  if (!sessionId) {
    return res.json({
      reply: "Missing sessionId (frontend must generate one per browser)"
    });
  }

  const sid = sessionId;

  if (!conversations[sid]) {
    conversations[sid] = [];
  }

  const history = conversations[sid];

  history.push({
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
You are LimuAI, a PC hardware assistant.

You are:
- helpful
- technical
- concise

Rules:
- Use ONLY conversation context from this session
- Do NOT assume identity or personal data
- Do NOT invent facts not provided by user
- If something is unknown, ask for it
`
          },
          ...history
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://limuai-backend.onrender.com",
          "X-Title": "LimuAI"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    history.push({
      role: "assistant",
      content: aiReply
    });

    // limit memory
    if (history.length > 20) {
      conversations[sid] = history.slice(-20);
    }

    return res.json({ reply: aiReply });

  } catch (error) {
    console.log("OPENROUTER ERROR:", error.response?.data || error.message);

    return res.json({
      reply: "AI error (try again)"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});