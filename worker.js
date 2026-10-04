export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // AI API
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
          .slice(-30);

        const memory =
          typeof body.memory === "string"
            ? body.memory.slice(0, 4000)
            : "";

        const systemPrompt =
          "You are HPX AI, the official AI assistant of HPX LABS.\n\n" +
          "IDENTITY:\n" +
          "- AI name: HPX AI\n" +
          "- Organization: HPX LABS\n" +
          "- Founder: Harshit Patel\n" +
          "- Version: HPX AI v1.0\n" +
          "- Purpose: General-purpose AI assistant.\n\n" +
          "RULES:\n" +
          "- If asked who you are, say you are HPX AI.\n" +
          "- If asked who founded HPX LABS, say Harshit Patel.\n" +
          "- Do not claim to be ChatGPT, Gemini, Claude, or another AI.\n" +
          "- Do not invent facts about HPX LABS or Harshit Patel.\n" +
          "- Do not claim live web access unless it is actually available.\n" +
          "- Match the user's language.\n" +
          "- For Hindi/Hinglish, use natural Hinglish.\n" +
          "- Be clear, useful and concise.\n" +
          "- For coding, provide clean code.\n" +
          "- For calculations, calculate carefully.\n";

        const finalSystemPrompt = memory
          ? systemPrompt +
            "\nLOCAL USER MEMORY:\n" +
            memory +
            "\nUse this memory only when relevant."
          : systemPrompt;

        const apiResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + env.OPENROUTER_API_KEY,
              "Content-Type": "application/json",
              "HTTP-Referer": url.origin,
              "X-Title": "HPX AI"
            },
            body: JSON.stringify({
              model: "openrouter/free",
              messages: [
                {
                  role: "system",
                  content: finalSystemPrompt
                }
              ].concat(messages)
            })
          }
        );

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          return json(
            {
              error:
                data &&
                data.error &&
                data.error.message
                  ? data.error.message
                  : "OpenRouter request failed."
            },
            apiResponse.status
          );
        }

        const reply =
          data &&
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content
            ? data.choices[0].message.content
            : "Sorry, I could not generate a response.";

        return json({
          reply: String(reply)
        });
      } catch (error) {
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
    // FRONTEND
    // =========================

    return new Response(HTML, {
      status: 200,
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
      "Content-Type": "application/json;charset=UTF-8"
    }
  });
}


// =========================
// HTML
// =========================

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1"
>

<meta name="theme-color" content="#07111f">

<title>HPX AI</title>

<style>

* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background: #07111f;
  color: #edf6ff;
  overflow: hidden;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  display: flex;
  width: 100%;
  height: 100vh;
}

/* SIDEBAR */

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #081522;
  border-right: 1px solid #193047;
  display: flex;
  flex-direction: column;
  z-index: 30;
  transition: left .25s ease;
}

.brand {
  padding: 20px;
  border-bottom: 1px solid #193047;
}

.brand-title {
  font-size: 25px;
  font-weight: 900;
}

.brand-sub {
  margin-top: 5px;
  color: #8da6bc;
  font-size: 12px;
}

.new-chat {
  margin: 15px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #168ed5;
  background: #0b2237;
  color: white;
  font-weight: 700;
}

.history-title {
  padding: 0 15px 9px;
  color: #7891a7;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.history-search {
  width: calc(100% - 30px);
  margin: 0 15px 10px;
  padding: 10px 11px;
  border: 1px solid #20384f;
  border-radius: 10px;
  outline: none;
  background: #0b1c2c;
  color: white;
}

.history {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px;
  margin-bottom: 4px;
  border-radius: 10px;
  color: #cbd9e6;
}

.history-item:hover,
.history-item.active {
  background: #102a40;
}

.history-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.history-delete {
  border: 0;
  background: transparent;
  color: #718ba0;
  font-size: 18px;
  padding: 0 3px;
}

.history-delete:hover {
  color: #ff6f6f;
}

.sidebar-bottom {
  padding: 15px;
  border-top: 1px solid #193047;
}

.info-box {
  color: #849caf;
  font-size: 11px;
  line-height: 1.7;
}

/* MAIN */

.main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #07111f;
}

.topbar {
  height: 64px;
  flex-shrink: 0;
  padding: 0 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #193047;
  background: rgba(7,17,31,.96);
}

.top-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.mobile-menu {
  display: none;
  border: 0;
  background: transparent;
  color: white;
  font-size: 22px;
}

.title {
  font-size: 16px;
  font-weight: 800;
}

.status {
  margin-top: 2px;
  color: #52d88b;
  font-size: 10px;
}

.top-actions {
  display: flex;
  gap: 7px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #20384f;
  border-radius: 10px;
  background: #0b1c2c;
  color: #e3eef7;
}

/* CHAT */

.chat {
  flex: 1;
  overflow-y: auto;
  padding: 24px 14px 160px;
}

.chat-inner {
  width: 100%;
  max-width: 900px;
  margin: auto;
}

.empty {
  min-height: 65vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-card {
  max-width: 600px;
}

.logo {
  width: 72px;
  height: 72px;
  margin: auto;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,#0d77c7,#0bd6d6);
  box-shadow: 0 0 35px rgba(0,190,255,.18);
  font-size: 22px;
  font-weight: 900;
}

.empty h1 {
  margin: 18px 0 8px;
}

.empty p {
  color: #8da5ba;
  line-height: 1.6;
}

/* MESSAGES */

.message-row {
  display: flex;
  margin: 15px 0;
}

.message-row.user {
  justify-content: flex-end;
}

.message {
  max-width: min(790px,92%);
  padding: 13px 15px;
  border-radius: 17px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.user .message {
  background: #104a70;
  border: 1px solid #1c6b9d;
}

.assistant .message {
  background: #0c1d2d;
  border: 1px solid #193047;
}

.message-text {
  white-space: normal;
}

.message-text h2,
.message-text h3,
.message-text h4 {
  margin: 12px 0 6px;
}

.message-text ul,
.message-text ol {
  margin-top: 6px;
  margin-bottom: 6px;
  padding-left: 23px;
}

.inline-code {
  padding: 2px 5px;
  border-radius: 5px;
  background: #152b3f;
  font-family: monospace;
}

.code-container {
  margin: 10px 0;
  border: 1px solid #20384f;
  border-radius: 10px;
  overflow: hidden;
  background: #050b12;
}

.code-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 9px;
  border-bottom: 1px solid #20384f;
  color: #8da6bc;
  font-size: 10px;
}

.code-copy {
  border: 1px solid #28435b;
  border-radius: 6px;
  padding: 4px 7px;
  background: #10263a;
  color: #d8e7f3;
  font-size: 10px;
}

.code-container pre {
  margin: 0;
  padding: 13px;
  overflow-x: auto;
}

.code-container code {
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  font-size: 13px;
}

.message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}

.small-btn {
  border: 1px solid #28435b;
  border-radius: 8px;
  padding: 5px 8px;
  background: #10263a;
  color: #cbdbea;
  font-size: 11px;
}

.message a {
  color: #55c8ff;
}

.message table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.message th,
.message td {
  padding: 7px 9px;
  border: 1px solid #28435b;
  text-align: left;
}

.message th {
  background: #13283b;
}

/* TYPING */

.typing {
  display: inline-flex;
  gap: 5px;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7f9ab1;
  animation: bounce 1s infinite;
}

.typing span:nth-child(2) {
  animation-delay: .15s;
}

.typing span:nth-child(3) {
  animation-delay: .3s;
}

@keyframes bounce {
  0%,60%,100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

/* INPUT */

.input-area {
  position: fixed;
  left: 280px;
  right: 0;
  bottom: 0;
  padding: 12px 15px 14px;
  background: linear-gradient(to top,#07111f 70%,transparent);
}

.input-inner {
  max-width: 900px;
  margin: auto;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 7px;
}

.tool-btn {
  border: 1px solid #20384f;
  border-radius: 8px;
  padding: 6px 9px;
  background: #0b1c2c;
  color: #a9bed0;
  font-size: 11px;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  padding: 8px;
  border: 1px solid #25435c;
  border-radius: 15px;
  background: #0a1a29;
}

textarea {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  max-height: 150px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  padding: 9px 5px;
}

textarea::placeholder {
  color: #6e879c;
}

.send-btn {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  border: 0;
  border-radius: 11px;
  background: #1179bd;
  color: white;
  font-size: 18px;
}

.send-btn:disabled {
  opacity: .5;
}

.footer-note {
  margin-top: 6px;
  text-align: center;
  color: #61798e;
  font-size: 9px;
}

/* SETTINGS */

.overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0,0,0,.6);
}

.overlay.show {
  display: block;
}

.settings {
  display: none;
  position: fixed;
  top: 74px;
  right: 15px;
  z-index: 60;
  width: min(370px,calc(100% - 30px));
  max-height: calc(100vh - 90px);
  overflow-y: auto;
  padding: 18px;
  border: 1px solid #28435b;
  border-radius: 15px;
  background: #0b1c2c;
}

.settings.show {
  display: block;
}

.settings h3 {
  margin-top: 0;
}

.setting {
  padding: 13px 0;
  border-bottom: 1px solid #193047;
}

.setting:last-child {
  border-bottom: 0;
}

.setting-title {
  font-weight: 700;
  margin-bottom: 5px;
}

.setting-desc {
  color: #8299ae;
  font-size: 12px;
  line-height: 1.5;
}

/* LIGHT */

body.light {
  background: #f4f7fa;
  color: #172330;
}

body.light .sidebar,
body.light .main,
body.light .topbar {
  background: #f4f7fa;
}

body.light .sidebar,
body.light .topbar {
  border-color: #d6e0e8;
}

body.light .brand-sub,
body.light .history-title,
body.light .info-box,
body.light .empty p,
body.light .setting-desc,
body.light .footer-note {
  color: #66798a;
}

body.light .history-item {
  color: #304252;
}

body.light .history-item:hover,
body.light .history-item.active {
  background: #e5edf4;
}

body.light .history-search,
body.light .composer,
body.light .tool-btn,
body.light .icon-btn,
body.light .settings {
  background: white;
  color: #172330;
  border-color: #cbd8e2;
}

body.light textarea {
  color: #172330;
}

body.light .assistant .message {
  background: white;
  border-color: #d6e0e8;
}

body.light .user .message {
  background: #dceffc;
  border-color: #b9dff4;
}

body.light .code-container {
  background: #edf2f6;
  border-color: #ccd8e2;
}

/* MOBILE */

@media (max-width:760px) {

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: -290px;
  }

  .sidebar.open {
    left: 0;
    box-shadow: 10px 0 30px rgba(0,0,0,.3);
  }

  .mobile-menu {
    display: block;
  }

  .input-area {
    left: 0;
  }

  .message {
    max-width: 95%;
  }

  .chat {
    padding-left: 9px;
    padding-right: 9px;
  }
}

</style>
</head>

<body>

<div class="app">

<aside class="sidebar" id="sidebar">

  <div class="brand">
    <div class="brand-title">HPX AI</div>
    <div class="brand-sub">
      Official AI assistant of HPX LABS
    </div>
  </div>

  <button class="new-chat" id="newChatBtn">
    ＋ New Chat
  </button>

  <div class="history-title">
    Chat History
  </div>

  <input
    id="historySearch"
    class="history-search"
    placeholder="Search chats..."
  >

  <div id="history" class="history"></div>

  <div class="sidebar-bottom">
    <div class="info-box">
      Founder: <b>Harshit Patel</b><br>
      Version: HPX AI v1.0<br>
      Model: OpenRouter Free Router
    </div>
  </div>

</aside>

<main class="main">

<header class="topbar">

  <div class="top-left">

    <button
      id="mobileMenu"
      class="mobile-menu"
      aria-label="Menu"
    >
      ☰
    </button>

    <div>
      <div class="title">HPX AI</div>
      <div class="status">● Online</div>
    </div>

  </div>

  <div class="top-actions">

    <button
      id="topNewChat"
      class="icon-btn"
      title="New Chat"
    >
      ＋
    </button>

    <button
      id="settingsBtn"
      class="icon-btn"
      title="Settings"
    >
      ⚙
    </button>

  </div>

</header>

<section id="chat" class="chat">

  <div id="chatInner" class="chat-inner">

    <div id="empty" class="empty">

      <div class="empty-card">

        <div class="logo">
          HPX
        </div>

        <h1>
          How can I help you?
        </h1>

        <p>
          Ask HPX AI anything about learning,
          coding, ideas, explanations,
          productivity and more.
        </p>

      </div>

    </div>

  </div>

</section>

<div class="input-area">

  <div class="input-inner">

    <div class="tools">

      <button id="micBtn" class="tool-btn">
        🎤 Voice
      </button>

      <button id="calculatorBtn" class="tool-btn">
        🧮 Calculator
      </button>

      <button id="exportBtn" class="tool-btn">
        💾 Export
      </button>

    </div>

    <div class="composer">

      <textarea
        id="input"
        rows="1"
        placeholder="Message HPX AI..."
      ></textarea>

      <button
        id="send"
        class="send-btn"
        aria-label="Send"
      >
        ➤
      </button>

    </div>

    <div class="footer-note">
      HPX AI can make mistakes. Check important information.
    </div>

  </div>

</div>

</main>
</div>

<div id="overlay" class="overlay"></div>

<div id="settings" class="settings">

  <h3>⚙ HPX AI Settings</h3>

  <div class="setting">

    <div class="setting-title">
      Appearance
    </div>

    <div class="setting-desc">
      Switch between dark and light mode.
    </div>

    <button id="themeBtn" class="small-btn">
      🌙 / ☀️ Toggle Theme
    </button>

  </div>

  <div class="setting">

    <div class="setting-title">
      🧠 Local Memory
    </div>

    <div class="setting-desc">
      Save information locally for future conversations.
    </div>

    <button id="addMemoryBtn" class="small-btn">
      ＋ Add Memory
    </button>

    <button id="clearMemoryBtn" class="small-btn">
      🗑 Clear Memory
    </button>

  </div>

  <div class="setting">

    <div class="setting-title">
      💬 Chat Data
    </div>

    <div class="setting-desc">
      Chat history is stored locally in this browser.
    </div>

    <button id="clearHistoryBtn" class="small-btn">
      Delete All Chats
    </button>

  </div>

  <div class="setting">

    <div class="setting-title">
      ℹ About
    </div>

    <div class="setting-desc">
      HPX AI v1.0<br>
      Official AI assistant of HPX LABS<br>
      Founder: Harshit Patel
    </div>

  </div>

</div>


<script>

(function () {

"use strict";

/* =========================
   STATE
========================= */

var currentChatId = null;
var messages = [];
var isGenerating = false;

var HISTORY_KEY = "hpx_ai_history_v2";
var MEMORY_KEY = "hpx_ai_memory_v2";
var THEME_KEY = "hpx_ai_theme_v2";


/* =========================
   ELEMENTS
========================= */

var chat = document.getElementById("chat");
var chatInner = document.getElementById("chatInner");
var empty = document.getElementById("empty");
var input = document.getElementById("input");
var send = document.getElementById("send");
var history = document.getElementById("history");
var historySearch = document.getElementById("historySearch");

var sidebar = document.getElementById("sidebar");
var mobileMenu = document.getElementById("mobileMenu");

var settings = document.getElementById("settings");
var settingsBtn = document.getElementById("settingsBtn");
var overlay = document.getElementById("overlay");

var newChatBtn = document.getElementById("newChatBtn");
var topNewChat = document.getElementById("topNewChat");

var themeBtn = document.getElementById("themeBtn");
var addMemoryBtn = document.getElementById("addMemoryBtn");
var clearMemoryBtn = document.getElementById("clearMemoryBtn");
var clearHistoryBtn = document.getElementById("clearHistoryBtn");

var micBtn = document.getElementById("micBtn");
var calculatorBtn = document.getElementById("calculatorBtn");
var exportBtn = document.getElementById("exportBtn");


/* =========================
   STORAGE
========================= */

function loadHistory() {
  try {
    var data = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(data) {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(data)
  );
}

function loadMemory() {
  return localStorage.getItem(MEMORY_KEY) || "";
}


/* =========================
   CHAT ID
========================= */

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}


/* =========================
   NEW CHAT
========================= */

function newChat() {

  currentChatId = makeId();
  messages = [];

  renderMessages();
  renderHistory();

  closeSettings();
  closeMobile();

  input.focus();
}


/* =========================
