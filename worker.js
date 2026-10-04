export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // HPX AI CHAT API
    // =========================
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Method Not Allowed" }, 405);
      }

      try {
        if (!env.OPENROUTER_API_KEY) {
          return json(
            { error: "OPENROUTER_API_KEY is not configured." },
            500
          );
        }

        const body = await request.json();

        let messages = Array.isArray(body.messages)
          ? body.messages
          : [];

        messages = messages
          .filter(function (m) {
            return (
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
            );
          })
          .slice(-40);

        const memory =
          typeof body.memory === "string"
            ? body.memory.slice(0, 5000)
            : "";

        const system =
          "You are HPX AI, the official AI assistant of HPX LABS.\n" +
          "AI name: HPX AI.\n" +
          "Organization: HPX LABS.\n" +
          "Founder: Harshit Patel.\n" +
          "Version: HPX AI v1.0.\n" +
          "Purpose: General-purpose AI assistant.\n\n" +
          "Rules:\n" +
          "- If asked who you are, say HPX AI.\n" +
          "- If asked who founded HPX LABS, say Harshit Patel.\n" +
          "- Do not claim to be ChatGPT, Gemini, Claude or another AI.\n" +
          "- Do not invent facts about HPX LABS or Harshit Patel.\n" +
          "- Do not claim live web access unless it is actually available.\n" +
          "- Match the user's language.\n" +
          "- Use natural Hinglish when the user uses Hinglish.\n" +
          "- Be clear, helpful and concise.\n" +
          "- Use Markdown when useful.";

        const prompt = memory
          ? system +
            "\n\nLOCAL USER MEMORY:\n" +
            memory +
            "\nUse this memory only when relevant."
          : system;

        const controller = new AbortController();

        const timeout = setTimeout(function () {
          controller.abort();
        }, 60000);

        let response;

        try {
          response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization:
                  "Bearer " + env.OPENROUTER_API_KEY,
                "Content-Type": "application/json",
                "HTTP-Referer": url.origin,
                "X-Title": "HPX AI"
              },
              body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                  {
                    role: "system",
                    content: prompt
                  }
                ].concat(messages)
              }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timeout);
        }

        const data = await response.json();

        if (!response.ok) {
          return json(
            {
              error:
                data &&
                data.error &&
                data.error.message
                  ? data.error.message
                  : "OpenRouter request failed."
            },
            response.status
          );
        }

        const reply =
          data &&
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content
            ? String(data.choices[0].message.content)
            : "Sorry, I could not generate a response.";

        return json({
          reply: reply,
          model:
            data && data.model
              ? String(data.model)
              : "openrouter/free"
        });
      } catch (error) {
        if (error && error.name === "AbortError") {
          return json(
            {
              error: "Request timed out. Please try again."
            },
            504
          );
        }

        return json(
          {
            error:
              error && error.message
                ? error.message
                : "Something went wrong."
          },
          500
        );
      }
    }

    // =========================
    // HPX AI WEB APP
    // =========================
    return new Response(createHTML(), {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};


// =========================
// JSON HELPER
// =========================

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}


// =========================
// HTML APP
// =========================

function createHTML() {
  return String.raw`<!doctype html>
<html lang="en">
<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<meta
  name="theme-color"
  content="#07111f"
>

<title>HPX AI</title>

<style>

:root {
  --bg:#07111f;
  --panel:#0b1728;
  --panel2:#102036;
  --border:#213750;
  --text:#f5f7fb;
  --muted:#93a4ba;
  --accent:#22d3ee;
  --user:#153b5b;
}

* {
  box-sizing:border-box;
}

html,
body {
  margin:0;
  width:100%;
  height:100%;
}

body {
  overflow:hidden;
  background:var(--bg);
  color:var(--text);
  font-family:Arial,Helvetica,sans-serif;
}

button,
input,
textarea,
select {
  font:inherit;
}

button {
  cursor:pointer;
}

.app {
  display:flex;
  height:100vh;
}

.side {
  width:285px;
  background:var(--panel);
  border-right:1px solid var(--border);
  display:flex;
  flex-direction:column;
  z-index:20;
}

.brand {
  padding:16px;
  border-bottom:1px solid var(--border);
  display:flex;
  gap:10px;
  align-items:center;
}

.logo {
  width:42px;
  height:42px;
  border-radius:12px;
  display:grid;
  place-items:center;
  background:linear-gradient(
    135deg,
    var(--accent),
    #3b82f6
  );
  color:#00121d;
  font-weight:900;
}

.brand b {
  font-size:19px;
}

.brand small {
  display:block;
  color:var(--muted);
  margin-top:3px;
}

.new {
  margin:12px;
  padding:11px;
  border-radius:10px;
  border:1px solid var(--border);
  background:var(--panel2);
  color:var(--text);
  font-weight:700;
}

.search {
  margin:0 12px 10px;
  padding:10px;
  border-radius:9px;
  border:1px solid var(--border);
  background:#071321;
  color:var(--text);
  outline:0;
  width:calc(100% - 24px);
}

.history {
  flex:1;
  overflow:auto;
  padding:0 8px;
}

.histTitle {
  font-size:11px;
  color:var(--muted);
  padding:8px;
}

.item {
  position:relative;
  padding:10px;
  border-radius:9px;
  margin-bottom:4px;
  cursor:pointer;
  border:1px solid transparent;
}

.item:hover,
.item.active {
  background:var(--panel2);
  border-color:var(--border);
}

.name {
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  padding-right:70px;
  font-size:13px;
}

.meta {
  color:var(--muted);
  font-size:10px;
  margin-top:4px;
}

.acts {
  display:none;
  position:absolute;
  right:5px;
  top:7px;
  gap:2px;
}

.item:hover .acts {
  display:flex;
}

.mini {
  border:0;
  background:transparent;
  color:var(--muted);
  padding:3px;
}

.mini:hover {
  color:var(--text);
}

.sidebottom {
  border-top:1px solid var(--border);
  padding:9px;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:6px;
}

.sidebottom button {
  padding:8px;
  border:1px solid var(--border);
  background:var(--panel2);
  color:var(--text);
  border-radius:8px;
  font-size:12px;
}

.main {
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
}

.top {
  height:60px;
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 15px;
  background:rgba(7,17,31,.95);
}

.left {
  display:flex;
  align-items:center;
  gap:9px;
}

.menu {
  display:none;
  padding:8px;
  border:1px solid var(--border);
  background:var(--panel2);
  color:var(--text);
  border-radius:8px;
}

.status {
  font-size:11px;
  color:#4ade80;
}

.dot {
  display:inline-block;
  width:7px;
  height:7px;
  border-radius:50%;
  background:#4ade80;
  margin-right:5px;
}

.messages {
  flex:1;
  overflow:auto;
  padding:22px max(
    12px,
    calc((100vw - 900px) / 2)
  );
}

.welcome {
  min-height:70%;
  display:grid;
  place-items:center;
  text-align:center;
  align-content:center;
  gap:10px;
}

.welcome .big {
  width:68px;
  height:68px;
  border-radius:20px;
  display:grid;
  place-items:center;
  background:linear-gradient(
    135deg,
    var(--accent),
    #3b82f6
  );
  color:#00121d;
  font-weight:900;
  font-size:24px;
}

.welcome h2 {
  margin:0;
  font-size:29px;
}

.welcome p {
  margin:0;
  color:var(--muted);
  max-width:600px;
}

.suggest {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  max-width:620px;
  width:100%;
  margin-top:8px;
}

.suggest button {
  padding:10px;
  text-align:left;
  background:var(--panel);
  color:var(--text);
  border:1px solid var(--border);
  border-radius:9px;
}

.msg {
  display:flex;
  gap:9px;
  margin-bottom:18px;
}

.avatar {
  width:33px;
  height:33px;
  min-width:33px;
  border-radius:9px;
  display:grid;
  place-items:center;
  font-size:10px;
  font-weight:800;
  background:var(--panel2);
}

.assistant .avatar {
  background:linear-gradient(
    135deg,
    var(--accent),
    #3b82f6
  );
  color:#00121d;
}

.bubble {
  max-width:calc(100% - 43px);
  line-height:1.55;
  font-size:15px;
  overflow-wrap:anywhere;
}

.user .bubble {
  background:var(--user);
  padding:10px 12px;
  border-radius:11px;
}

.assistant .bubble {
  background:#0d1c2e;
  border:1px solid var(--border);
  padding:11px 13px;
  border-radius:11px;
}

.bubble p {
  margin:0 0 8px;
}

.bubble p:last-child {
  margin:0;
}

.bubble code {
  background:#06101c;
  border:1px solid var(--border);
  padding:2px 4px;
  border-radius:4px;
  font-family:monospace;
}

.bubble ul {
  padding-left:20px;
}

.code {
  background:#050c15;
  border:1px solid var(--border);
  border-radius:8px;
  overflow:hidden;
  margin:8px 0;
}

.codehead {
  padding:6px 9px;
  background:#0b1725;
  color:var(--muted);
  font-size:10px;
  display:flex;
  justify-content:space-between;
}

.codehead button {
  border:1px solid var(--border);
  background:var(--panel2);
  color:var(--text);
  border-radius:5px;
  font-size:10px;
  padding:3px 7px;
}

.code pre {
  margin:0;
  padding:11px;
  overflow:auto;
  font:13px/1.5 monospace;
}

.tools {
  display:flex;
  gap:3px;
  margin-top:5px;
}

.tools button {
  border:1px solid transparent;
  background:transparent;
  color:var(--muted);
  font-size:10px;
  padding:4px 6px;
  border-radius:5px;
}

.tools button:hover {
  background:var(--panel2);
  color:var(--text);
  border-color:var(--border);
}

.composeWrap {
  padding:9px max(
    12px,
    calc((100vw - 900px) / 2)
  ) 13px;
  border-top:1px solid var(--border);
}

.compose {
  display:flex;
  gap:6px;
  align-items:end;
  padding:7px;
  border:1px solid var(--border);
  background:var(--panel);
  border-radius:13px;
}

.compose:focus-within {
  border-color:var(--accent);
}

#input {
  flex:1;
  min-height:40px;
  max-height:170px;
  resize:none;
  background:transparent;
  border:0;
  outline:0;
  color:var(--text);
  padding:9px;
}

.icon {
  width:39px;
  height:39px;
  border:0;
  border-radius:9px;
  background:transparent;
  color:var(--muted);
}

.icon:hover {
  background:var(--panel2);
  color:var(--text);
}

.send {
  background:linear-gradient(
    135deg,
    var(--accent),
    #3b82f6
  );
  color:#00121d;
  font-weight:900;
}

.stop {
  background:#67232b;
  color:white;
}

.modalbg {
  position:fixed;
  inset:0;
  background:#0009;
  display:none;
  place-items:center;
  z-index:100;
  padding:15px;
}

.modalbg.open {
  display:grid;
}

.modal {
  width:min(530px,100%);
  max-height:90vh;
  overflow:auto;
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:14px;
  padding:16px;
}

.modalhead {
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.modal h3 {
  margin:0;
}

.close {
  background:transparent;
  border:0;
  color:var(--muted);
  font-size:22px;
}

.set {
  padding:12px 0;
  border-bottom:1px solid var(--border);
}

.set label {
  display:block;
  font-size:12px;
  margin-bottom:6px;
}

.set input,
.set textarea,
.set select {
  width:100%;
  background:#071321;
  color:var(--text);
  border:1px solid var(--border);
  border-radius:8px;
  padding:9px;
  outline:0;
}

.set textarea {
  min-height:85px;
  resize:vertical;
}

.row {
  display:flex;
  gap:7px;
  flex-wrap:wrap;
}

.action {
  padding:8px 10px;
  background:var(--panel2);
  color:var(--text);
  border:1px solid var(--border);
  border-radius:7px;
}

.toast {
  position:fixed;
  bottom:78px;
  left:50%;
  transform:translateX(-50%);
  display:none;
  background:#102036;
  border:1px solid var(--border);
  padding:8px 12px;
  border-radius:8px;
  z-index:200;
  font-size:12px;
}

.toast.show {
  display:block;
}

.typing {
  display:flex;
  gap:4px;
}

.typing i {
  width:6px;
  height:6px;
  border-radius:50%;
  background:var(--muted);
  animation:b 1s infinite;
}

.typing i:nth-child(2) {
  animation-delay:.15s;
}

.typing i:nth-child(3) {
  animation-delay:.3s;
}

@keyframes b {
  30% {
    transform:translateY(-5px);
  }
}

body.compact .msg {
  margin-bottom:8px;
}

body.compact .bubble {
  padding:7px 9px;
}

@media(max-width:760px) {

  .side {
    position:fixed;
    top:0;
    bottom:0;
    left:-295px;
    transition:.2s;
  }

  .side.open {
    left:0;
    box-shadow:8px 0 30px #0008;
  }

  .menu {
    display:block;
  }

  .suggest {
    grid-template-columns:1fr;
  }

  .welcome h2 {
    font-size:24px;
  }

  .messages {
    padding:15px 8px;
  }

  .composeWrap {
    padding:8px;
  }

  .bubble {
    font-size:14px;
  }
}

</style>
</head>

<body>

<div class="app">

<aside class="side" id="side">

<div class="brand">
<div class="logo">HPX</div>

<div>
<b>HPX AI</b>
<small>HPX LABS • v1.0</small>
</div>

</div>

<button
class="new"
onclick="newChat()"
>
＋ New Chat
</button>

<input
class="search"
id="search"
placeholder="Search chats..."
oninput="renderHistory()"
>

<div
class="history"
id="history"
></div>

<div class="sidebottom">

<button onclick="openSettings()">
⚙ Settings
</button>

<button onclick="about()">
ⓘ About
</button>

</div>

</aside>


<main class="main">

<header class="top">

<div class="left">

<button
class="menu"
onclick="toggleSide()"
>
☰
</button>

<span>
HPX AI
<small
id="model"
style="color:var(--muted)"
>
• Free Model
</small>
</span>

</div>

<div class="status">

<span class="dot"></span>

<span id="status">
Ready
</span>

</div>

</header>


<section
class="messages"
id="messages"
></section>


<div class="composeWrap">

<div class="compose">

<button
class="icon"
onclick="voice()"
title="Voice input"
>
🎙
</button>

<textarea
id="input"
placeholder="Message HPX AI..."
rows="1"
onkeydown="key(event)"
oninput="resizeInput()"
></textarea>

<button
class="icon"
onclick="calc()"
title="Calculator"
>
🧮
</button>

<button
class="icon stop"
id="stop"
onclick="stopGeneration()"
style="display:none"
>
⏹
</button>

<button
class="icon send"
id="send"
onclick="send()"
>
➤
</button>

</div>

<div
style="
text-align:center;
color:var(--muted);
font-size:9px;
margin-top:5px
"
>
Enter to send • Shift+Enter for new line
</div>

</div>

</main>

</div>


<div
class="modalbg"
id="modal"
onclick="
if(event.target===this)closeSettings()
"
>

<div class="modal">

<div class="modalhead">

<h3>
HPX AI Settings
</h3>

<button
class="close"
onclick="closeSettings()"
>
×
</button>

</div>


<div class="set">

<label>
Theme
</label>

<select
id="theme"
onchange="setTheme(this.value)"
>

<option value="dark">
Dark
</option>

<option value="light">
Light
</option>

<option value="system">
System
</option>

</select>

</div>


<div class="set">

<label>
Accent
</label>

<div class="row">

<button
class="action"
onclick="accent('#22d3ee')"
>
Cyan
</button>

<button
class="action"
onclick="accent('#8b5cf6')"
>
Purple
</button>

<button
class="action"
onclick="accent('#22c55e')"
>
Green
</button>

<button
class="action"
onclick="accent('#f59e0b')"
>
Orange
</button>

</div>

</div>


<div class="set">

<label>
Font size
</label>

<select
id="font"
onchange="setFont(this.value)"
>

<option value="14px">
Small
</option>

<option value="15px">
Normal
</option>

<option value="17px">
Large
</option>

<option value="19px">
Extra Large
</option>

</select>

</div>


<div class="set">

<label>
Layout
</label>

<div class="row">

<button
class="action"
onclick="setCompact(false)"
>
Comfortable
</button>

<button
class="action"
onclick="setCompact(true)"
>
Compact
</button>

</div>

</div>


<div class="set">

<label>
Local Memory
</label>

<textarea
id="memory"
placeholder="Example: User prefers Hinglish and concise answers."
></textarea>

<div
class="row"
style="margin-top:7px"
>

<button
class="action"
onclick="saveMemory()"
>
Save Memory
</button>

<button
class="action"
onclick="forgetMemory()"
>
Forget Memory
</button>

</div>

</div>


<div class="set">

<label>
Saved Prompt
</label>

<textarea
id="prompt"
placeholder="Save a prompt you use often..."
></textarea>

<div
class="row"
style="margin-top:7px"
>

<button
class="action"
onclick="savePrompt()"
>
Save Prompt
</button>

<button
class="action"
onclick="usePrompt()"
>
Use Saved Prompt
</button>

</div>

</div>


<div class="set">

<label>
Backup and Export
</label>

<div class="row">

<button
class="action"
onclick="backup()"
>
Export Backup
</button>

<button
class="action"
onclick="
document.getElementById('file').click()
"
>
Import Backup
</button>

<button
class="action"
onclick="exportTXT()"
>
Export TXT
</button>

<button
class="action"
onclick="exportHTML()"
>
Export HTML
</button>

</div>

</div>


<div class="set">

<label>
History
</label>

<button
class="action"
onclick="clearAll()"
>
Clear All History
</button>

</div>


<div class="set">

<label>
About
</label>

<div
style="
color:var(--muted);
font-size:12px;
line-height:1.6
"
>

HPX AI v1.0<br>
HPX LABS<br>
Founder: Harshit Patel<br>
General-purpose AI assistant

</div>

</div>

</div>

</div>


<input
id="file"
type="file"
accept=".json,application/json"
style="display:none"
onchange="restore(event)"
>

<div
class="toast"
id="toast"
></div>


<script>

const KEY = "hpx_ai_v2";
const SET = "hpx_ai_settings_v2";

let data = {
  chats: [],
  memory: "",
  prompts: []
};

let cfg = {
  theme: "dark",
  accent: "#22d3ee",
  font: "15px",
  compact: false
};

let current = null;
let controller = null;
let busy = false;


// =========================
// LOAD
// =========================

function load() {

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(KEY) || "{}"
      );

    data = Object.assign(data, saved);
  } catch (e) {}

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(SET) || "{}"
      );

    cfg = Object.assign(cfg, saved);
  } catch (e) {}

  apply();

  document.getElementById("memory").value =
    data.memory || "";

  document.getElementById("theme").value =
    cfg.theme;

  document.getElementById("font").value =
    cfg.font;

  if (data.chats.length) {
    current = data.chats[0].id;
    renderChat();
  } else {
    welcome();
  }

  renderHistory();
}


// =========================
// SAVE
// =========================

function save() {
  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );
}

function saveCfg() {
  localStorage.setItem(
    SET,
    JSON.stringify(cfg)
  );
}


// =========================
// ID
// =========================

function makeI
