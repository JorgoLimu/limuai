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
  res.send("🧠 LimuAI backend is running (OpenRouter version)");
});

// CHAT ROUTE
app.post("/chat", async (req, res) => {
  const message = req.body.message;
  const history = req.body.history || [];

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
You are LimuAI, a highly intelligent PC hardware expert assistant.

CORE RULES:
- You ALWAYS remember everything the user says in the conversation.
- If the user gives PC specs (CPU, GPU, RAM, etc), you must store and use them.
- NEVER ask for specs again if they were already given.
- Answer directly without unnecessary questions.
- If user asks "what are my specs", extract them from chat history.
- If user asks "upgrade", immediately give clear upgrade advice based on known specs.

BEHAVIOR:
- Be direct and confident.
- Do not act like a chatbot that forgets things.
- Do not repeat questions.
- Do not stall with “tell me more”.

GOAL:
- Act like a real PC expert who remembers everything and gives instant answers.
`
          },

          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
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

    const aiReply = response.data.choices[0].message.content;

    return res.json({
      reply: aiReply
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