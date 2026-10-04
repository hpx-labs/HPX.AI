export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // AI BACKEND
    // =========================
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Method Not Allowed" }, 405);
      }

      try {
        if (!env.OPENROUTER_API_KEY) {
          return json({
            error: "OPENROUTER_API_KEY is not configured."
          }, 500);
        }

        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages.slice(-30)
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
              messages,
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

        return json({
          reply:
            data?.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response."
        });

      } catch (error) {
        return json({
          error: error?.message || "Server error."
        }, 500);
      }
    }

    // =========================
    // HPX AI FRONTEND
    // =========================

    return new Response(`<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>HPX AI</title>

<style>

/* =========================
   BASE
========================= */

*{
  box-sizing:border-box;
}

html,
body{
  margin:0;
  width:100%;
  height:100%;
  overflow:hidden;
}

body{
  font-family:Arial,sans-serif;
  background:#050914;
  color:white;
}

/* =========================
   APP
========================= */

.app{
  width:100%;
  height:100dvh;
  min-height:100vh;
  display:flex;
}

/* =========================
   SIDEBAR
========================= */

.sidebar{
  width:260px;
  height:100%;
  flex-shrink:0;
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
  min-height:46px;
  padding:12px;
  border:1px solid #19bde5;
  border-radius:10px;
  background:#0c172b;
  color:white;
  cursor:pointer;
  font-size:14px;
}

.new:active{
  transform:scale(.98);
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
  padding:11px;
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

.history-empty{
  color:#59657b;
  font-size:12px;
  padding:10px 4px;
}

/* =========================
   MAIN
========================= */

.main{
  flex:1;
  min-width:0;
  height:100%;
  display:flex;
  flex-direction:column;
}

/* =========================
   TOP BAR
========================= */

.top{
  height:62px;
  min-height:62px;
  padding:0 20px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #17213b;
}

.top-title{
  font-size:16px;
}

.top-right{
  display:flex;
  align-items:center;
  gap:12px;
}

.online{
  color:#55e6a7;
  font-size:13px;
}

.settings-btn{
  border:1px solid #20304e;
  background:#0d1527;
  color:white;
  border-radius:8px;
  padding:8px 11px;
  cursor:pointer;
  font-size:16px;
}

/* =========================
   CHAT
========================= */

.chat{
  flex:1;
  min-height:0;
  overflow-y:auto;
  padding:25px 15px 20px;
  -webkit-overflow-scrolling:touch;
}

.welcome{
  text-align:center;
  margin-top:14vh;
  padding:0 15px;
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

/* =========================
   MESSAGES
========================= */

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
  word-break:break-word;
}

.user .bubble{
  background:#12688a;
}

.assistant .bubble{
  background:#10182a;
  border:1px solid #1b2945;
}

/* =========================
   INPUT AREA
========================= */

.input-area{
  flex-shrink:0;
  width:100%;
  padding:10px 15px calc(15px + env(safe-area-inset-bottom));
  background:#050914;
  border-top:1px solid #17213b;
}

.input{
  width:100%;
  max-width:850px;
  min-height:58px;
  margin:auto;
  display:flex;
  align-items:flex-end;
  gap:8px;
  background:#0d1527;
  border:1px solid #2a3b5d;
  border-radius:15px;
  padding:7px;
  box-shadow:0 4px 20px #0005;
}

textarea{
  flex:1;
  width:100%;
  min-width:0;
  min-height:42px;
  max-height:140px;
  resize:none;
  background:transparent;
  border:0;
  outline:0;
  color:white;
  padding:11px 10px;
  font-size:15px;
  line-height:20px;
  font-family:Arial,sans-serif;
  display:block;
}

textarea::placeholder{
  color:#68758d;
}

.send{
  flex-shrink:0;
  width:46px;
  height:46px;
  border:0;
  border-radius:11px;
  background:#10bfe8;
  color:#031018;
  cursor:pointer;
  font-size:20px;
  font-weight:bold;
}

.send:disabled{
  opacity:.5;
  cursor:not-allowed;
}

/* =========================
   SETTINGS
========================= */

.settings{
  position:fixed;
  right:20px;
  top:75px;
  width:290px;
  background:#0b1222;
  border:1px solid #1c2b49;
  border-radius:14px;
  padding:18px;
  display:none;
  z-index:50;
  box-shadow:0 10px 40px #0008;
}

.settings h3{
  margin-top:0;
}

.setting-row{
  margin:15px 0;
  color:#aab5ca;
  font-size:14px;
  line-height:1.5;
}

.close{
  float:right;
  border:0;
  background:none;
  color:white;
  font-size:22px;
  cursor:pointer;
}

/* =========================
   MOBILE
========================= */

@media(max-width:700px){

  .sidebar{
    display:none;
  }

  .top{
    padding:0 13px;
  }

  .online{
    font-size:12px;
  }

  .chat{
    padding:18px 10px 15px;
  }

  .welcome{
    margin-top:11vh;
  }

  .welcome h1{
    font-size:36px;
  }

  .welcome p{
    font-size:14px;
  }

  .bubble{
    max-width:90%;
    padding:11px 13px;
  }

  .input-area{
    padding:8px 9px calc(10px + env(safe-area-inset-bottom));
  }

  .input{
    min-height:58px;
    border-radius:14px;
  }

  textarea{
    font-size:16px;
    min-height:43px;
  }

  .send{
    width:44px;
    height:44px;
  }

  .settings{
    top:70px;
    left:10px;
    right:10px;
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

<button
  class="new"
  onclick="newChat()"
>
＋ New Chat
</button>

<div class="history-title">
🕘 History
</div>

<div
  id="historyList"
  class="history-list"
></div>

</aside>


<!-- MAIN -->

<main class="main">

<header class="top">

<div class="top-title">
<b>HPX AI</b>
</div>

<div class="top-right">

<span class="online">
● Online
</span>

<button
  class="settings-btn"
  onclick="openSettings()"
>
⚙️
</button>

</div>

</header>


<section
  id="chat"
  class="chat"
>

<div
  id="welcome"
  class="welcome"
>

<h1>HPX AI</h1>

<p>
Intelligent AI assistant by HPX LABS.
</p>

</div>

</section>


<!-- INPUT -->

<div class="input-area">

<div class="input">

<textarea
  id="input"
  rows="1"
  placeholder="Message HPX AI..."
></textarea>

<button
  id="send"
  class="send"
  onclick="send()"
>
➤
</button>

</div>

</div>

</main>

</div>


<!-- SETTINGS -->

<div
  id="settings"
  class="settings"
>

<button
  class="close"
  onclick="closeSettings()"
>
×
</button>

<h3>
⚙️ Settings
</h3>

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
   STATE
========================= */

let messages = [];

let currentChatId = null;

let isSaving = false;

let history =
JSON.parse(
  localStorage.getItem("hpx_history") || "[]"
);


/* =========================
   DOM
========================= */

const input =
document.getElementById("input");

const sendButton =
document.getElementById("send");

const chat =
document.getElementById("chat");


/* =========================
   INPUT AUTO RESIZE
========================= */

input.addEventListener(
  "input",
  function(){

    this.style.height = "auto";

    this.style.height =
      Math.min(
        this.scrollHeight,
        140
      ) + "px";

  }
);


/* =========================
   ENTER
========================= */

input.addEventListener(
  "keydown",
  function(e){

    if(
      e.key === "Enter" &&
      !e.shiftKey
    ){

      e.preventDefault();

      send();

    }

  }
);


/* =========================
   ADD MESSAGE
========================= */

function add(role,text){

  const row =
  document.createElement("div");

  row.className =
  "msg " + role;

  const bubble =
  document.createElement("div");

  bubble.className =
  "bubble";

  bubble.textContent =
  text;

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

  const text =
  input.value.trim();

  if(!text) return;


  /* Hide welcome */

  const welcome =
  document.getElementById("welcome");

  if(welcome){
    welcome.style.display="none";
  }


  /* Create ID only once */

  if(!currentChatId){

    currentChatId =
      Date.now().toString();

  }


  /* User message */

  messages.push({
    role:"user",
    content:text
  });


  add(
    "user",
    text
  );


  /* Clear input */

  input.value="";

  input.style.height="auto";


  sendButton.disabled=true;


  /* Thinking */

  const replyBox =
  add(
    "assistant",
    "Thinking..."
  );


  try{

    const response =
    await fetch(
      "/api/chat",
      {
        method:"POST",

        headers:{
          "Content-Type":
          "application/json"
        },

        body:
        JSON.stringify({
          messages:messages
        })
      }
    );


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


  }catch(error){

    replyBox.textContent =
      "⚠️ " +
      error.message;

  }


  sendButton.disabled=false;

  input.focus();

}


/* =========================
   GET CHAT TITLE
========================= */

function getTitle(){

  const firstUser =
    messages.find(
      m =>
      m.role === "user"
    );


  if(!firstUser){
    return "New Chat";
  }


  let title =
    firstUser.content
      .replace(/\\s+/g," ")
      .trim();


  /* Remove generic greetings */

  const generic =
    [
      "hello",
      "hi",
      "hey",
      "hii",
      "helo",
      "hello hpx ai"
    ];


  if(
    generic.includes(
      title.toLowerCase()
    )
  ){

    const secondUser =
      messages.find(
        m =>
        m.role === "user" &&
        m !== firstUser
      );


    if(secondUser){

      title =
      secondUser.content
        .replace(/\\s+/g," ")
        .trim();

    }else{

      title =
        "New Conversation";

    }

  }


  if(title.length > 35){

    title =
      title.substring(0,35) + "...";

  }


  return title;

}


/* =========================
   SAVE CURRENT CHAT
========================= */

function saveCurrentChat(){

  if(
    !messages.length ||
    isSaving
  ){
    return;
  }


  /* Only save conversations
     containing a response */

  const hasAssistant =
    messages.some(
      m =>
      m.role === "assistant" &&
      m.content !== "Thinking..."
    );


  if(!hasAssistant){
    return;
  }


  isSaving=true;


  const title =
    getTitle();


  const existingIndex =
    history.findIndex(
      item =>
      item.id === currentChatId
    );


  const chatData = {

    id:
      currentChatId ||
      Date.now().toString(),

    title:title,

    messages:
      messages.map(
        m => ({
          role:m.role,
          content:m.content
        })
      )

  };


  if(existingIndex >= 0){

    /* Update existing chat */

    history[existingIndex] =
      chatData;

  }else{

    /* Create ONE new history */

    history.unshift(
      chatData
    );

  }


  history =
    history.slice(0,30);


  localStorage.setItem(
    "hpx_history",
    JSON.stringify(history)
  );


  renderHistory();


  setTimeout(
    () => {
      isSaving=false;
    },
    100
  );

}


/* =========================
   NEW CHAT
========================= */

function newChat(){

  saveCurrentChat();

  messages=[];

  currentChatId=null;

  chat.innerHTML=`

    <div
      id="welcome"
      class="welcome"
    >

      <h1>HPX AI</h1>

      <p>
      Intelligent AI assistant by HPX LABS.
      </p>

    </div>

  `;

  input.value="";

  input.style.height="auto";

  input.focus();

  renderHistory();

}


/* =========================
   HISTORY
========================= */

function renderHistory(){

  const list =
    document.getElementById(
      "historyList"
    );


  list.innerHTML="";


  if(!history.length){

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "history-empty";

    empty.textContent =
      "No chats yet";

    list.appendChild(empty);

    return;

  }


  history.forEach(
    (item,index)=>{

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "history-item";


      div.textContent =
        "💬 " +
        item.title;


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


  /* Save current before switching */

  saveCurrentChat();


  messages =
    item.messages || [];


  currentChatId =
    item.id;


  chat.innerHTML="";


  messages.forEach(
    message => {

      add(
        message.role,
        message.content
      );

    }
  );


  input.focus();

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
   SAVE WHEN LEAVING
========================= */

window.addEventListener(
  "beforeunload",
  function(){

    saveCurrentChat();

  }
);


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
   JSON
========================= */

function json(data,status=200){

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers:{
        "Content-Type":
          "application/json;charset=UTF-8"
      }
    }
  );

}
