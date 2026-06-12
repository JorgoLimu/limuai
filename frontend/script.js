const chat = document.getElementById("chat");
const landing = document.getElementById("landing");
const inputEl = document.getElementById("input");

/* =========================
   SESSION SYSTEM
========================= */
function getSessionId() {
  let id = localStorage.getItem("sessionId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }

  return id;
}

/* =========================
   PARTICLES
========================= */
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

/* =========================
   CHAT UI
========================= */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("msg", type);
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* =========================
   TYPING INDICATOR
========================= */
let typingBubble = null;

function showTyping() {
  if (typingBubble) return;

  typingBubble = document.createElement("div");
  typingBubble.classList.add("msg", "bot");
  typingBubble.style.opacity = "0.7";
  typingBubble.innerText = "LimuAI is typing...";
  chat.appendChild(typingBubble);

  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  if (typingBubble) {
    typingBubble.remove();
    typingBubble = null;
  }
}

/* =========================
   START CHAT
========================= */
function startChat() {
  landing.style.opacity = "0";

  setTimeout(() => {
    landing.style.display = "none";
    chat.classList.remove("hidden");
  }, 400);
}

/* =========================
   SEND MESSAGE
========================= */
async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  startChat();

  addMessage(message, "user");
  inputEl.value = "";

  showTyping();

  try {
    const res = await fetch("https://limuai-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sessionId: getSessionId()
      })
    });

    if (!res.ok) {
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();

    hideTyping();

    if (!data || !data.reply) {
      throw new Error("Invalid response");
    }

    addMessage(data.reply, "bot");

  } catch (err) {
    hideTyping();
    console.error(err);
    addMessage("❌ Backend not responding. Try again.", "bot");
  }
}

/* =========================
   ENTER KEY SUPPORT
========================= */
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});