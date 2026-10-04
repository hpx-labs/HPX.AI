export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // HPX AI API
    // =========================================================
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
              m.content.trim().length > 0
            );
          })
          .slice(-40);

        const memory =
          typeof body.memory === "string"
            ? body.memory.slice(0, 5000)
            : "";

        const systemPrompt =
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
          "- Match the users language.\n" +
          "- For Hindi or Hinglish, respond naturally in Hinglish.\n" +
          "- Be useful, clear and reasonably concise.\n" +
          "- For coding questions, provide clean code.\n" +
          "- For calculations, calculate carefully.\n" +
          "- Use Markdown when useful.";

        const finalSystemPrompt = memory
          ? systemPrompt +
            "\n\nLOCAL USER MEMORY:\n" +
            memory +
            "\nUse this memory only when relevant."
          : systemPrompt;

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
            ? data.choices[0].message.content
            : "Sorry, I could not generate a response.";

        return json({
          reply: String(reply),
          model:
            data && data.model
              ? String(data.model)
              : "openrouter/free"
        });
      } catch (error) {
        if (error && error.name === "AbortError") {
          return json(
            { error: "Request timed out. Please try again." },
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

    // =========================================================
    // HPX AI FRONTEND
    // =========================================================

    return new Response(createHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};


// =============================================================
// JSON HELPER
// =============================================================

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}


// =============================================================
// FRONTEND
// =============================================================

function createHTML() {
  const lines = [

'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1.0">',
'<meta name="theme-color" content="#07111f">',
'<title>HPX AI</title>',

'<style>',

'*{box-sizing:border-box;margin:0;padding:0}',

':root{',
'--bg:#07111f;',
'--panel:#0b1728;',
'--panel2:#101f34;',
'--border:#203550;',
'--text:#f5f7fb;',
'--muted:#91a0b5;',
'--accent:#22d3ee;',
'--accent2:#3b82f6;',
'--danger:#ef4444;',
'--user:#153b5b;',
'--assistant:#0d1c2e',
'}',

'body{',
'font-family:Arial,Helvetica,sans-serif;',
'background:var(--bg);',
'color:var(--text);',
'height:100vh;',
'overflow:hidden',
'}',

'button,input,textarea,select{font:inherit}',

'button{cursor:pointer}',

'.app{display:flex;height:100vh;width:100vw}',

'.sidebar{',
'width:290px;',
'background:var(--panel);',
'border-right:1px solid var(--border);',
'display:flex;',
'flex-direction:column;',
'transition:.25s;',
'z-index:20',
'}',

'.brand{',
'padding:18px;',
'border-bottom:1px solid var(--border);',
'display:flex;',
'align-items:center;',
'gap:12px',
'}',

'.logo{',
'width:42px;',
'height:42px;',
'border-radius:12px;',
'display:flex;',
'align-items:center;',
'justify-content:center;',
'font-weight:900;',
'background:linear-gradient(135deg,var(--accent),var(--accent2));',
'color:#00111c',
'}',

'.brand h1{font-size:20px}',
'.brand small{display:block;color:var(--muted);margin-top:3px}',

'.newChat{',
'margin:14px;',
'padding:12px;',
'border:1px solid var(--border);',
'border-radius:12px;',
'background:var(--panel2);',
'color:var(--text);',
'font-weight:700',
'}',

'.newChat:hover{border-color:var(--accent)}',

'.searchBox{padding:0 14px 12px}',

'.searchBox input{',
'width:100%;',
'padding:11px 12px;',
'border-radius:10px;',
'border:1px solid var(--border);',
'background:#071321;',
'color:var(--text);',
'outline:none',
'}',

'.history{',
'flex:1;',
'overflow:auto;',
'padding:0 10px 10px',
'}',

'.historyTitle{',
'font-size:12px;',
'color:var(--muted);',
'padding:8px 6px',
'}',

'.chatItem{',
'padding:11px;',
'border-radius:10px;',
'margin-bottom:4px;',
'cursor:pointer;',
'position:relative;',
'border:1px solid transparent',
'}',

'.chatItem:hover{background:var(--panel2)}',
'.chatItem.active{background:#13263d;border-color:var(--border)}',

'.chatName{',
'white-space:nowrap;',
'overflow:hidden;',
'text-overflow:ellipsis;',
'padding-right:70px;',
'font-size:14px',
'}',

'.chatMeta{font-size:11px;color:var(--muted);margin-top:4px}',

'.chatActions{',
'position:absolute;',
'right:6px;',
'top:8px;',
'display:none;',
'gap:3px',
'}',

'.chatItem:hover .chatActions{display:flex}',

'.miniBtn{',
'border:0;',
'background:transparent;',
'color:var(--muted);',
'padding:4px;',
'border-radius:5px',
'}',

'.miniBtn:hover{color:var(--text);background:#1a304b}',

'.sideBottom{',
'border-top:1px solid var(--border);',
'padding:10px;',
'display:grid;',
'grid-template-columns:1fr 1fr;',
'gap:7px',
'}',

'.sideBottom button{',
'padding:9px;',
'background:var(--panel2);',
'color:var(--text);',
'border:1px solid var(--border);',
'border-radius:9px;',
'font-size:12px',
'}',

'.main{',
'flex:1;',
'display:flex;',
'flex-direction:column;',
'min-width:0',
'}',

'.topbar{',
'height:62px;',
'border-bottom:1px solid var(--border);',
'display:flex;',
'align-items:center;',
'justify-content:space-between;',
'padding:0 16px;',
'background:rgba(7,17,31,.92);',
'backdrop-filter:blur(10px);',
'z-index:5',
'}',

'.topLeft{display:flex;align-items:center;gap:10px}',

'.menuBtn{',
'display:none;',
'border:1px solid var(--border);',
'background:var(--panel2);',
'color:var(--text);',
'border-radius:9px;',
'padding:8px 10px',
'}',

'.model{',
'font-size:13px;',
'color:var(--muted)',
'}',

'.status{',
'font-size:12px;',
'color:#4ade80;',
'display:flex;',
'align-items:center;',
'gap:5px',
'}',

'.dot{width:7px;height:7px;border-radius:50%;background:#4ade80}',

'.messages{',
'flex:1;',
'overflow-y:auto;',
'padding:25px max(16px,calc((100vw - 900px)/2));',
'scroll-behavior:smooth',
'}',

'.welcome{',
'min-height:70%;',
'display:flex;',
'align-items:center;',
'justify-content:center;',
'flex-direction:column;',
'text-align:center;',
'gap:12px',
'}',

'.welcomeLogo{',
'width:70px;',
'height:70px;',
'border-radius:20px;',
'display:flex;',
'align-items:center;',
'justify-content:center;',
'font-size:28px;',
'font-weight:900;',
'background:linear-gradient(135deg,var(--accent),var(--accent2));',
'color:#00111c;',
'box-shadow:0 0 40px rgba(34,211,238,.15)',
'}',

'.welcome h2{font-size:30px}',
'.welcome p{color:var(--muted);max-width:520px}',

'.suggestions{',
'display:grid;',
'grid-template-columns:repeat(2,1fr);',
'gap:8px;',
'width:min(600px,100%);',
'margin-top:12px',
'}',

'.suggestion{',
'padding:11px;',
'border:1px solid var(--border);',
'background:var(--panel);',
'color:var(--text);',
'border-radius:10px;',
'text-align:left',
'}',

'.suggestion:hover{border-color:var(--accent)}',

'.message{display:flex;margin:0 auto 20px;width:100%;gap:11px}',

'.avatar{',
'width:34px;',
'height:34px;',
'border-radius:9px;',
'display:flex;',
'align-items:center;',
'justify-content:center;',
'flex-shrink:0;',
'font-size:12px;',
'font-weight:800',
'}',

'.message.user .avatar{background:#1c4f75}',
'.message.assistant .avatar{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#00111c}',

'.bubble{',
'max-width:calc(100% - 45px);',
'line-height:1.6;',
'font-size:15px;',
'overflow-wrap:anywhere',
'}',

'.message.user .bubble{',
'background:var(--user);',
'padding:10px 13px;',
'border-radius:12px',
'}',

'.message.assistant .bubble{',
'background:var(--assistant);',
'border:1px solid var(--border);',
'padding:12px 14px;',
'border-radius:12px',
'}',

'.bubble p{margin-bottom:8px}',
'.bubble p:last-child{margin-bottom:0}',
'.bubble ul,.bubble ol{margin:7px 0 7px 22px}',
'.bubble li{margin:3px 0}',
'.bubble strong{font-weight:800}',
'.bubble code{',
'background:#06101d;',
'border:1px solid #1b3048;',
'padding:2px 5px;',
'border-radius:5px;',
'font-family:monospace',
'}',

'.codeBox{',
'background:#050c15;',
'border:1px solid var(--border);',
'border-radius:9px;',
'margin:10px 0;',
'overflow:hidden',
'}',

'.codeHead{',
'display:flex;',
'justify-content:space-between;',
'align-items:center;',
'padding:7px 10px;',
'background:#0b1725;',
'color:var(--muted);',
'font-size:11px',
'}',

'.codeCopy{',
'border:1px solid var(--border);',
'background:#12243a;',
'color:var(--text);',
'padding:4px 8px;',
'border-radius:6px;',
'font-size:11px',
'}',

'.codeBox pre{',
'padding:12px;',
'overflow:auto;',
'font-family:monospace;',
'font-size:13px;',
'line-height:1.5',
'}',

'.math{',
'font-family:Georgia,serif;',
'background:#091526;',
'padding:4px 7px;',
'border-radius:5px;',
'display:inline-block',
'}',

'.msgTools{',
'display:flex;',
'gap:4px;',
'margin-top:6px',
'}',

'.toolBtn{',
'border:1px solid transparent;',
'background:transparent;',
'color:var(--muted);',
'padding:5px 7px;',
'border-radius:6px;',
'font-size:11px',
'}',

'.toolBtn:hover{',
'color:var(--text);',
'background:var(--panel2);',
'border-color:var(--border)',
'}',

'.composerWrap{',
'padding:10px max(16px,calc((100vw - 900px)/2)) 15px;',
'border-top:1px solid var(--border);',
'background:var(--bg)',
'}',

'.composer{',
'display:flex;',
'align-items:flex-end;',
'gap:8px;',
'background:var(--panel);',
'border:1px solid var(--border);',
'border-radius:15px;',
'padding:8px',
'}',

'.composer:focus-within{border-color:var(--accent)}',

'#input{',
'flex:1;',
'resize:none;',
'max-height:180px;',
'min-height:42px;',
'border:0;',
'outline:0;',
'background:transparent;',
'color:var(--text);',
'padding:10px;',
'line-height:1.4',
'}',

'.iconBtn{',
'width:40px;',
'height:40px;',
'border:0;',
'border-radius:10px;',
'background:transparent;',
'color:var(--muted)',
'}',

'.iconBtn:hover{background:var(--panel2);color:var(--text)}',

'.sendBtn{',
'background:linear-gradient(135deg,var(--accent),var(--accent2));',
'color:#00111c;',
'font-weight:900',
'}',

'.stopBtn{background:#5b1d25;color:#fff}',

'.settings{',
'position:fixed;',
'inset:0;',
'background:rgba(0,0,0,.6);',
'display:none;',
'align-items:center;',
'justify-content:center;',
'z-index:100;',
'padding:15px',
'}',

'.settings.open{display:flex}',

'.modal{',
'width:min(520px,100%);',
'max-height:90vh;',
'overflow:auto;',
'background:var(--panel);',
'border:1px solid var(--border);',
'border-radius:16px;',
'padding:18px',
'}',

'.modalHead{',
'display:flex;',
'justify-content:space-between;',
'align-items:center;',
'margin-bottom:15px',
'}',

'.modal h3{font-size:20px}',

'.close{',
'border:0;',
'background:transparent;',
'color:var(--muted);',
'font-size:22px',
'}',

'.setting{',
'padding:12px 0;',
'border-bottom:1px solid var(--border)',
'}',

'.setting:last-child{border-bottom:0}',

'.setting label{display:block;font-size:13px;margin-bottom:7px}',

'.setting input,.setting select,.setting textarea{',
'width:100%;',
'background:#071321;',
'border:1px solid var(--border);',
'border-radius:9px;',
'padding:10px;',
'color:var(--text);',
'outline:none',
'}',

'.setting textarea{min-height:100px;resize:vertical}',

'.row{display:flex;gap:8px;flex-wrap:wrap}',

'.action{',
'padding:9px 12px;',
'border:1px solid var(--border);',
'background:var(--panel2);',
'color:var(--text);',
'border-radius:8px',
'}',

'.action:hover{border-color:var(--accent)}',

'.danger{border-color:#63242a;color:#ff8d96}',

'.toast{',
'position:fixed;',
'bottom:85px;',
'left:50%;',
'transform:translateX(-50%);',
'background:#101f32;',
'border:1px solid var(--border);',
'padding:9px 13px;',
'border-radius:9px;',
'font-size:13px;',
'display:none;',
'z-index:200',
'}',

'.toast.show{display:block}',

'.typing{display:flex;gap:4px;padding:4px}',
'.typing span{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:bounce 1s infinite}',
'.typing span:nth-child(2){animation-delay:.15s}',
'.typing span:nth-child(3){animation-delay:.3s}',

'@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',

'body.compact .message{margin-bottom:10px}',
'body.compact .bubble{padding:8px 11px}',
'body.compact .messages{padding-top:15px}',

'@media(max-width:760px){',
'.sidebar{position:fixed;left:-300px;top:0;bottom:0}',
'.sidebar.open{left:0;box-shadow:10px 0 40px rgba(0,0,0,.4)}',
'.menuBtn{display:block}',
'.suggestions{grid-template-columns:1fr}',
'.welcome h2{font-size:25px}',
'.messages{padding-left:10px;padding-right:10px}',
'.composerWrap{padding-left:8px;padding-right:8px}',
'.bubble{font-size:14px}',
'}',

'</style>',
'</head>',

'<body>',

'<div class="app">',

'<aside class="sidebar" id="sidebar">',

'<div class="brand">',
'<div class="logo">HPX</div>',
'<div>',
'<h1>HPX AI</h1>',
'<small>HPX LABS • v1.0</small>',
'</div>',
'</div>',

'<button class="newChat" onclick="newChat()">＋ New Chat</button>',

'<div class="searchBox">',
'<input id="historySearch" placeholder="Search chats..." oninput="renderHistory()">',
'</div>',

'<div class="history" id="history"></div>',

'<div class="sideBottom">',
'<button onclick="openSettings()">⚙ Settings</button>',
'<button onclick="aboutHPX()">ⓘ About</button>',
'</div>',

'</aside>',

'<main class="main">',

'<header class="topbar">',
'<div class="topLeft">',
'<button class="menuBtn" onclick="toggleSidebar()">☰</button>',
'<div class="model">HPX AI <span id="modelName">• Free Model</span></div>',
'</div>',
'<div class="status"><span class="dot"></span><span id="statusText">Ready</span></div>',
'</header>',

'<section class="messages" id="messages"></section>',

'<div class="composerWrap">',
'<div class="composer">',

'<button class="iconBtn" onclick="startVoice()" title="Voice input">🎙</button>',

'<textarea id="input" rows="1" placeholder="Message HPX AI..." onkeydown="handleKey(event)" oninput="resizeInput(this)"></textarea>',

'<button class="iconBtn" onclick="calculateInput()" title="Calculator">🧮</button>',

'<button class="iconBtn" onclick="stopGeneration()" id="stopBtn" style="display:none" title="Stop">⏹</button>',

'<button class="iconBtn sendBtn" onclick="sendMessage()" id="sendBtn" title="Send">➤</button>',

'</div>',
'<div style="font-size:10px;color:var(--muted);text-align:center;margin-top:6px">Enter to send • Shift+Enter for new line</div>',
'</div>',

'</main>',
'</div>',

'<div class="settings" id="settings">',
'<div class="modal">',

'<div class="modalHead">',
'<h3>HPX AI Settings</h3>',
'<button class="close" onclick="closeSettings()">×</button>',
'</div>',

'<div class="setting">',
'<label>Theme</label>',
'<select id="themeSelect" onchange="changeTheme(this.value)">',
'<option value="dark">Dark</option>',
'<option value="light">Light</option>',
'<option value="system">System</option>',
'</select>',
'</div>',

'<div class="setting">',
'<label>Accent Color</label>',
'<div class="row">',
'<button class="action" onclick="setAccent(\'#22d3ee\')">Cyan</button>',
'<button class="action" onclick="setAccent(\'#8b5cf6\')">Purple</button>',
'<button class="action" onclick="setAccent(\'#22c55e\')">Green</button>',
'<button class="action" onclick="setAccent(\'#f59e0b\')">Orange</button>',
'<button class="action" onclick="setAccent(\'#ef4444\')">Red</button>',
'</div>',
'</div>',

'<div class="setting">',
'<label>Font Size</label>',
'<select id="fontSelect" onchange="changeFont(this.value)">',
'<option value="14px">Small</option>',
'<option value="15px">Normal</option>',
'<option value="17px">Large</option>',
'<option value="19px">Extra Large</option>',
'</select>',
'</div>',

'<div class="setting">',
'<label>Layout</label>',
'<div class="row">',
'<button class="action" onclick="setCompact(false)">Comfortable</button>',
'<button class="action" onclick="setCompact(true)">Compact</button>',
'</div>',
'</div>',

'<div class="setting">',
'<label>Local Memory</label>',
'<textarea id="memoryInput" placeholder="Example: User prefers Hinglish and concise answers."></textarea>',
'<div class="row" style="margin-top:8px">',
'<button class="action" onclick="saveMemory()">💾 Save Memory</button>',
'<button class="action danger" onclick="clearMemory()">Forget Memory</button>',
'</div>',
'</div>',

'<div class="setting">',
'<label>Saved Prompts</label>',
'<textarea id="promptInput" placeholder="Write a prompt you use often..."></textarea>',
'<div class="row" style="margin-top:8px">',
'<button class="action" onclick="savePrompt()">Save Prompt</button>',
'<button class="action" onclick="showPrompts()">Show Prompts</button>',
'</div>',
'
