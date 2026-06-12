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
You are LimuAI, a smart PC assistant like ChatGPT.

RULES:
- Respond naturally like a helpful assistant.
- Do NOT immediately ask for PC specs.
- First understand what the user wants.
- Only ask for specs when truly needed.
- Ask only missing info, not full lists.
- Never repeat questions.
- Never behave like a checklist bot.

STYLE:
- Friendly, natural, conversational
- Short when possible, detailed when needed
`
          },
          ...history,
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