const chat = document.getElementById("chat");
const landing = document.getElementById("landing");
const input = document.getElementById("input");

/* SESSION ID (CRITICAL FIX) */
function getSessionId() {
  let id = localStorage.getItem("sessionId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }

  return id;
}

/* UI */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("msg", type);
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function startChat() {
  landing.style.opacity = "0";
  setTimeout(() => {
    landing.style.display = "none";
    chat.classList.remove("hidden");
  }, 400);
}

/* SEND */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  startChat();

  addMessage(message, "user");
  input.value = "";

  const sessionId = getSessionId();

  const res = await fetch("https://limuai-backend.onrender.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      sessionId
    })
  });

  const data = await res.json();

  addMessage(data.reply, "bot");
}