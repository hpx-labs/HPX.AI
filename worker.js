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
          return json({
            error: "OPENROUTER_API_KEY is not configured in Cloudflare."
          }, 500);
        }

        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages.slice(-20)
          : [];

        if (!messages.length) {
          return json({ error: "No message provided." }, 400);
        }

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": url.origin,
              "X-Title": "HPX AI"
            },
            body: JSON.stringify({
              model: "openrouter/free",
              messages: messages,
              temperature: 0.7
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return json({
            error:
              data?.error?.message ||
              "OpenRouter request failed."
          }, response.status);
        }

        const reply =
          data?.choices?.[0]?.message?.content ||
          "Sorry, I couldn't generate a response.";

        return json({ reply });

      } catch (error) {
        return json({
          error: error?.message || "Server error."
        }, 500);
      }
    }

    // =========================
    // HPX AI WEBSITE
    // =========================

    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>HPX AI</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#050914;
  color:white;
  height:100vh;
  overflow:hidden;
}

.app{
  height:100vh;
  display:flex;
}

/* SIDEBAR */

.sidebar{
  width:260px;
  background:#080d1c;
  border-right:1px solid #17213b;
  padding:18px;
  display:flex;
  flex-direction:column;
}

.logo{
  font-size:25px;
  font-weight:bold;
  color:#19d9ff;
  margin-bottom:22px;
}

.new{
  width:100%;
  padding:12px;
  border:1px solid #19bde5;
  border-radius:10px;
  background:#0c172b;
  color:white;
  cursor:pointer;
  font-size:14px;
}

.new:hover{
  background:#10243e;
}

.history-title{
  margin-top:25px;
  color:#8995ad;
  font-size:13px;
}

.history-list{
  margin-top:10px;
  overflow-y:auto;
  flex:1;
}

.history-item{
  padding:10px;
  margin-bottom:5px;
  border-radius:8px;
  color:#cbd5e1;
  font-size:13px;
  cursor:pointer;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.history-item:hover{
  background:#111c31;
}

/* MAIN */

.main{
  flex:1;
  display:flex;
  flex-direction:column;
  min-width:0;
}

/* TOP */

.top{
  height:62px;
  padding:0 20px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #17213b;
}

.top-title{
  font-size:16px;
}

.online{
  color:#55e6a7;
  font-size:13px;
}

/* CHAT */

.chat{
  flex:1;
  overflow-y:auto;
  padding:25px 15px;
}

.welcome{
  text-align:center;
  margin-top:14vh;
}

.welcome h1{
  font-size:45px;
  margin-bottom:10px;
  background:linear-gradient(90deg,#19d9ff,#7b61ff);
  -webkit-background-clip:text;
  color:transparent;
}

.welcome p{
  color:#8995ad;
}

/* MESSAGE */

.msg{
  max-width:850px;
  margin:0 auto 15px;
  display:flex;
}

.msg.user{
  justify-content:flex-end;
}

.bubble{
  max-width:80%;
  padding:12px 15px;
  border-radius:14px;
  white-space:pre-wrap;
  line-height:1.5;
  word-wrap:break-word;
}

.user .bubble{
  background:#12688a;
}

.assistant .bubble{
  background:#10182a;
  border:1px solid #1b2945;
}

/* INPUT */

.input-area{
  padding:12px 15px 18px;
  border-top:1px solid #17213b;
}

.input{
  max-width:850px;
  margin:auto;
  display:flex;
  gap:8px;
  background:#0d1527;
  border:1px solid #20304e;
  border-radius:14px;
  padding:7px;
}

textarea{
  flex:1;
  resize:none;
  background:transparent;
  border:0;
  outline:0;
  color:white;
  padding:11px;
  font-size:15px;
}

.send{
  width:48px;
  border:0;
  border-radius:10px;
  background:#10bfe8;
  cursor:pointer;
  font-size:20px;
}

.send:disabled{
  opacity:.5;
  cursor:not-allowed;
}

/* SETTINGS */

.settings{
  position:fixed;
  right:20px;
  top:75px;
  width:280px;
  background:#0b1222;
  border:1px solid #1c2b49;
  border-radius:14px;
  padding:18px;
  display:none;
  z-index:20;
  box-shadow:0 10px 40px #0008;
}

.settings h3{
  margin-top:0;
}

.setting-row{
  margin:15px 0;
  color:#aab5ca;
  font-size:14px;
}

.close{
  float:right;
  border:0;
  background:none;
  color:white;
  font-size:18px;
  cursor:pointer;
}

.settings-btn{
  border:1px solid #20304e;
  background:#0d1527;
  color:white;
  border-radius:8px;
  padding:8px 12px;
  cursor:pointer;
}

/* MOBILE */

@media(max-width:700px){

  .sidebar{
    display:none;
  }

  .welcome{
    margin-top:12vh;
  }

  .welcome h1{
    font-size:36px;
  }

  .bubble{
    max-width:90%;
  }

  .settings{
    right:10px;
    left:10px;
    width:auto;
  }

}

</style>

</head>

<body>

<div class="app">

<!-- SIDEBAR -->

<aside class="sidebar">

<div class="logo">
⚡ HPX AI
</div>

<button class="new" onclick="newChat()">
＋ New Chat
</button>

<div class="history-title">
🕘 History
</div>

<div id="historyList" class="history-list"></div>

</aside>


<!-- MAIN -->

<main class="main">

<header class="top">

<div class="top-title">
<b>HPX AI</b>
</div>

<div>

<span class="online">
● Online
</span>

<button
class="settings-btn"
onclick="openSettings()">
⚙️
</button>

</div>

</header>


<section id="chat" class="chat">

<div id="welcome" class="welcome">

<h1>HPX AI</h1>

<p>
Intelligent AI assistant by HPX LABS.
</p>

</div>

</section>


<div class="input-area">

<div class="input">

<textarea
id="input"
rows="1"
placeholder="Message HPX AI..."
onkeydown="key(event)"
></textarea>

<button
id="send"
class="send"
onclick="send()">
➤
</button>

</div>

</div>

</main>

</div>


<!-- SETTINGS -->

<div id="settings" class="settings">

<button class="close"
onclick="closeSettings()">
×
</button>

<h3>⚙️ Settings</h3>

<div class="setting-row">
<b>Model</b><br>
OpenRouter Free Router
</div>

<div class="setting-row">
<b>Provider</b><br>
OpenRouter
</div>

<div class="setting-row">
<b>Version</b><br>
HPX AI v1.0
</div>

<div class="setting-row">
<b>Status</b><br>
<span style="color:#55e6a7">
● Connected
</span>
</div>

</div>


<script>

/* =========================
   DATA
========================= */

let messages = [];

let history =
JSON.parse(
localStorage.getItem("hpx_history") || "[]"
);


/* =========================
   ADD MESSAGE
========================= */

function add(role,text){

  const chat =
  document.getElementById("chat");

  const row =
  document.createElement("div");

  row.className =
  "msg " + role;

  const bubble =
  document.createElement("div");

  bubble.className =
  "bubble";

  bubble.textContent = text;

  row.appendChild(bubble);

  chat.appendChild(row);

  chat.scrollTop =
  chat.scrollHeight;

  return bubble;
}


/* =========================
   SEND
========================= */

async function send(){

  const input =
  document.getElementById("input");

  const button =
  document.getElementById("send");

  const text =
  input.value.trim();

  if(!text) return;

  document
  .getElementById("welcome")
  .style.display="none";


  messages.push({
    role:"user",
    content:text
  });


  add("user",text);

  input.value="";

  button.disabled=true;


  const replyBox =
  add("assistant","Thinking...");


  try{

    const response =
    await fetch("/api/chat",{

      method:"POST",

      headers:{
        "Content-Type":
        "application/json"
      },

      body:
      JSON.stringify({
        messages:messages
      })

    });


    const data =
    await response.json();


    if(!response.ok){

      throw new Error(
        data.error ||
        "Request failed"
      );

    }


    replyBox.textContent =
    data.reply;


    messages.push({

      role:"assistant",

      content:data.reply

    });


    saveHistory();


  }catch(error){

    replyBox.textContent =
    "⚠️ " + error.message;

  }


  button.disabled=false;

  input.focus();

}


/* =========================
   ENTER KEY
========================= */

function key(e){

  if(
    e.key==="Enter" &&
    !e.shiftKey
  ){

    e.preventDefault();

    send();

  }

}


/* =========================
   NEW CHAT
========================= */

function newChat(){

  if(messages.length){

    saveHistory();

  }

  messages=[];

  location.reload();

}


/* =========================
   HISTORY
========================= */

function saveHistory(){

  if(!messages.length)
  return;


  const firstUser =
  messages.find(
    m => m.role==="user"
  );


  const title =
  firstUser
  ? firstUser.content.slice(0,35)
  : "New Chat";


  history.unshift({

    title:title,

    messages:
    messages

  });


  history =
  history.slice(0,20);


  localStorage.setItem(
    "hpx_history",
    JSON.stringify(history)
  );


  renderHistory();

}


/* =========================
   RENDER HISTORY
========================= */

function renderHistory(){

  const list =
  document.getElementById(
    "historyList"
  );


  list.innerHTML="";


  history.forEach(
    (item,index)=>{

      const div =
      document.createElement("div");


      div.className =
      "history-item";


      div.textContent =
      "💬 " + item.title;


      div.onclick =
      function(){

        loadHistory(index);

      };


      list.appendChild(div);

    }
  );

}


/* =========================
   LOAD HISTORY
========================= */

function loadHistory(index){

  const item =
  history[index];

  if(!item) return;


  messages =
  item.messages || [];


  const chat =
  document.getElementById("chat");


  chat.innerHTML="";


  messages.forEach(
    message => {

      add(
        message.role,
        message.content
      );

    }
  );

}


/* =========================
   SETTINGS
========================= */

function openSettings(){

  document
  .getElementById("settings")
  .style.display="block";

}


function closeSettings(){

  document
  .getElementById("settings")
  .style.display="none";

}


/* =========================
   START
========================= */

renderHistory();

</script>

</body>
</html>`, {
      headers: {
        "Content-Type":
          "text/html;charset=UTF-8"
      }
    });
  }
};


/* =========================
   JSON RESPONSE
========================= */

function json(data,status=200){

  return new Response(
    JSON.stringify(data),
    {
      status:status,

      headers:{
        "Content-Type":
        "application/json;charset=UTF-8"
      }
    }
  );

      }
