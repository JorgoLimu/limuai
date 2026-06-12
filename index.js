const chat = document.getElementById("chat");
const landing = document.getElementById("landing");
const input = document.getElementById("input");

/* =========================
   SESSION (FIXED - AUTO)
========================= */
let sessionId = localStorage.getItem("sessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

/* =========================
   PARTICLES
========================= */
function createParticles() {
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 3 + Math.random() * 5 + "s";
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
  const message = input.value.trim();
  if (!message) return;

  startChat();

  addMessage(message, "user");
  input.value = "";

  try {
    const res = await fetch("https://limuai-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    if (!res.ok) {
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();

    addMessage(data.reply, "bot");

  } catch (err) {
    console.error(err);
    addMessage("❌ Backend not responding. Try again.", "bot");
  }
}

/* =========================
   ENTER KEY SUPPORT
========================= */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});