const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DEBUG (checks if Render has the key)
console.log("GROQ KEY EXISTS:", process.env.GROQ_API_KEY ? "YES" : "NO");

// Health check
app.get("/", (req, res) => {
  res.send("🧠 LimuAI backend is running");
});

// CHAT ROUTE (Groq AI)
app.post("/chat", async (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are LimuAI, a PC building expert. Always ask for user specs first (CPU, GPU, RAM, budget, monitor). Help optimize PCs for gaming and performance."
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY?.trim()}`,
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    return res.json({
      reply: aiReply
    });

  } catch (error) {
    console.log("===== GROQ ERROR =====");
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data || error.message);
    console.log("======================");

    return res.json({
      reply: "AI error: Groq blocked request or invalid key"
    });
  }
});

// Render start
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});