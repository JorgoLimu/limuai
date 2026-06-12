const chat = document.getElementById("chat");
const landing = document.getElementById("landing");
const input = document.getElementById("input");

/* FULL CHAT MEMORY (UI ONLY) */
let messages = [];

/* =========================
   SESSION ID (IMPORTANT FIX)
========================= */
function getSessionId() {
  let id = localStorage.getItem("sessionId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }

  return id;
}

/* particles */
function createParticles() {
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = (3 + Math.random() * 5) + "s";
    document.body.appendChild(p);
  }
}
createParticles();

/* UI message */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("msg", type);
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* start chat */
function startChat() {
  landing.style.opacity = "0";

  setTimeout(() => {
    landing.style.display = "none";
    chat.classList.remove("hidden");
  }, 400);
}

/* SEND MESSAGE */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  startChat();

  addMessage(message, "user");
  input.value = "";

  // store UI memory
  messages.push({ role: "user", content: message });

  try {
    const res = await fetch("https://limuai-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        sessionId: getSessionId()   // 🔥 THIS IS THE FIX
      })
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();

    addMessage(data.reply, "bot");

    messages.push({ role: "assistant", content: data.reply });

  } catch (err) {
    console.error(err);
    addMessage("❌ Backend not responding. Try again.", "bot");
  }
}