const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log("OPENROUTER KEY EXISTS:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI backend is running (fixed memory version)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const message = req.body.message;
  const history = Array.isArray(req.body.history) ? req.body.history : [];

  if (!message) {
    return res.json({ reply: "No message received" });
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

CRITICAL RULES:
- You DO have full conversation memory inside this chat.
- NEVER say "I don't have previous messages" or "this is the first message".
- If the user previously mentioned specs, you MUST remember them from chat history.
- If specs appear anywhere in conversation, treat them as stored facts.
- NEVER ask the user to repeat specs unless they are missing.

BEHAVIOR:
- Answer directly first.
- Use past messages as truth.
- If user asks "what are my specs", extract them from chat history.
- If user asks for upgrade advice, respond immediately based on known specs.

NO LOOPING:
- Do not ask for clarification if info already exists.
- Do not pretend memory is missing.
`
          },

          // STRICT history formatting (this is the important part)
          ...history.map(m => ({
            role: m.role,
            content: m.content
          })),

          {
            role: "user",
            content: message
          }
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

    return res.json({
      reply: response.data.choices[0].message.content
    });

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