const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log("OPENROUTER KEY EXISTS:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

// simple in-memory store (per server session)
const memory = {};

// extract simple PC specs safely (NO guessing)
function extractSpecs(text) {
  const specs = {};

  if (/rx|gtx|rtx|radeon/i.test(text)) specs.gpu = text.match(/(rx|gtx|rtx|radeon)[^, ]*/i)?.[0];
  if (/i[3579]-?\d{3,5}/i.test(text)) specs.cpu = text.match(/i[3579]-?\d{3,5}/i)?.[0];
  if (/\d+\s?gb\s?ram/i.test(text)) specs.ram = text.match(/\d+\s?gb\s?ram/i)?.[0];

  return specs;
}

// Health
app.get("/", (req, res) => {
  res.send("🧠 LimuAI fixed memory version running");
});

// CHAT
app.post("/chat", async (req, res) => {
  const { message, sessionId = "default" } = req.body;

  if (!message) return res.json({ reply: "No message received" });

  if (!memory[sessionId]) {
    memory[sessionId] = {
      specs: {}
    };
  }

  // try extract specs ONLY from real text
  const extracted = extractSpecs(message);
  memory[sessionId].specs = {
    ...memory[sessionId].specs,
    ...extracted
  };

  const userSpecs = memory[sessionId].specs;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are LimuAI, a PC hardware expert.

CRITICAL RULES:
- NEVER invent PC specs.
- Only use specs that are explicitly given.
- If something is unknown, say "unknown".
- Do NOT guess CPUs or GPUs.
- Do NOT hallucinate full builds.

KNOWN USER SPECS:
${JSON.stringify(userSpecs)}

BEHAVIOR:
- If specs exist → use them directly
- If missing → ask ONLY for missing part
- Be accurate, not creative
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

  } catch (err) {
    console.log(err.response?.data || err.message);
    return res.json({ reply: "AI error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});