const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Render uses dynamic port
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("🧠 LimuAI backend is running");
});

// Chat route
app.post("/chat", (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  return res.json({
    reply: "LimuAI: received → " + message
  });
});

// IMPORTANT for Render (bind to 0.0.0.0)
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});