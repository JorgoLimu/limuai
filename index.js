const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// DEBUG: check if Render has the API key
console.log("GROQ KEY LOADED:", !!process.env.GROQ_API_KEY);

const app = express();

// Render port
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI backend is running");
});

// CHAT ROUTE (REAL AI)
app.post("/chat", async (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
You are LimuAI, a professional PC building assistant.

Your job:
- Ask users for their PC specs if missing (CPU, GPU, RAM, budget, monitor resolution)
- Do NOT assume specs
- Help users build the best PC for THEIR needs
- Optimize performance for their setup
- Suggest upgrades only if needed
- Be clear and practical, not overly technical unless asked
`
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    res.json({
      reply: aiReply
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.json({
      reply: "AI error: check API key or Groq limit"
    });
  }
});

// IMPORTANT for Render
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});