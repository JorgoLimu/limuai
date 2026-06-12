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
            content:
              "You are LimuAI, a PC specialist AI. Always ask for the user's specs first (CPU, GPU, RAM, storage, motherboard, PSU, monitor resolution, budget, and intended use). Never assume specs. Give accurate PC building, upgrade, troubleshooting, and performance advice based on the user's hardware and needs."
          },
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