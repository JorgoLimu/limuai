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
// SESSION MEMORY STORAGE
// =========================
const conversations = {};

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("🧠 LimuAI running (true isolated sessions)");
});

// =========================
// CHAT ROUTE
// =========================
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // ❌ CRITICAL FIX:
  // Do NOT fallback to "guest" — it causes ALL users to share memory
  if (!sessionId) {
    return res.json({
      reply: "Missing sessionId (frontend must generate unique session per browser)"
    });
  }

  const sid = sessionId;

  if (!conversations[sid]) {
    conversations[sid] = [];
  }

  const history = conversations[sid];

  // store user message
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
You are LimuAI.

ABSOLUTE RULES:
- Each session is completely independent
- NEVER assume or reuse any identity or name (including "Jorgo")
- NEVER guess user identity from past messages
- ONLY use information in THIS session
- If no name is given in current message, treat user as anonymous
- Do NOT carry identity across sessions or users
- Do NOT hallucinate names or personal info

You are a PC hardware assistant only.
`
          },
          ...history
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
    history.push({
      role: "assistant",
      content: aiReply
    });

    // limit memory size
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

// =========================
// START SERVER
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});