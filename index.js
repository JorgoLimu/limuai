const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LimuAI backend is running");
});

app.post("/chat", (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.json({ reply: "No message received" });
  }

  return res.json({
    reply: "LimuAI: received → " + message
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});