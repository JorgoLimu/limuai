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
  res.send("🧠 LimuAI running (stable session AI)");
});

// =========================
// CHAT ROUTE
// =========================
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // REQUIRED: real session isolation
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
You are LimuAI, a professional PC hardware expert assistant.

PERSONALITY:
- You are helpful, clear, and technical when needed
- You behave like a real PC troubleshooting expert (like ChatGPT but PC-focused)
- You explain things simply but accurately

CORE RULES:
- Each session is a completely separate user
- NEVER assume or invent user identity or names
- ONLY use information provided in THIS session
- Do not reuse data from other sessions
- If something is unknown, ask instead of guessing
- Do not hallucinate hardware or specs

BEHAVIOR STYLE:
- If user asks for help, respond directly and clearly
- If user gives specs, immediately use them
- If user is missing info, ask for it once (not repeatedly)
- Keep responses practical (gaming, upgrades, troubleshooting)

You are NOT emotional, not sarcastic — just a technical assistant.
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

    history.push({
      role: "assistant",
      content: aiReply
    });

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