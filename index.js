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
  res.send("🧠 LimuAI running (stable + isolated sessions)");
});

// =========================
// CHAT ROUTE
// =========================
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  // Each device gets its own isolated session
  const sid = sessionId || "guest";

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
- Each session is a separate anonymous user
- NEVER assume or guess the user's name
- NEVER invent identity, even if it seems consistent
- Only use a name if the user explicitly writes it in THIS message
- Otherwise treat user as anonymous
- Do not personalize responses with identity
- Do not hallucinate user information
- Only use provided conversation data

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

    // prevent memory overload
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