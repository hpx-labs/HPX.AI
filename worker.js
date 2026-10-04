export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      try {
        const body = await request.json();
        const messages = Array.isArray(body.messages)
          ? body.messages.slice(-20)
          : [];

        if (!env.OPENROUTER_API_KEY) {
          return json({
            error: "OPENROUTER_API_KEY is not configured in Cloudflare."
          }, 500);
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
              model: "openai/gpt-oss-120b:free",
              messages,
              temperature: 0.7
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return json({
            error: data?.error?.message || "OpenRouter request failed."
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

    return new Response(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HPX AI</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#050914;
  color:white;
  height:100vh;
}
.app{height:100vh;display:flex}
.sidebar{
  width:250px;
  background:#080d1c;
  border-right:1px solid #17213b;
  padding:18px;
}
.logo{
  font-size:25px;
  font-weight:bold;
  color:#19d9ff;
  margin-bottom:25px;
}
button{
  cursor:pointer;
}
.new{
  width:100%;
  padding:12px;
  border:1px solid #19bde5;
  border-radius:10px;
  background:#0c172b;
  color:white;
}
.history{
  margin-top:25px;
  color:#8995ad;
  font-size:14px;
}
.main{
  flex:1;
  display:flex;
  flex-direction:column;
  min-width:0;
}
.top{
  height:62px;
  padding:0 20px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #17213b;
}
.online{color:#55e6a7;font-size:13px}
.chat{
  flex:1;
  overflow-y:auto;
  padding:25px 15px;
}
.welcome{
  text-align:center;
  margin-top:15vh;
}
.welcome h1{
  font-size:44px;
  background:linear-gradient(90deg,#19d9ff,#7b61ff);
  -webkit-background-clip:text;
  color:transparent;
}
.welcome p{color:#8995ad}
.msg{
  max-width:850px;
  margin:0 auto 15px;
  display:flex;
}
.msg.user{justify-content:flex-end}
.bubble{
  max-width:80%;
  padding:12px 15px;
  border-radius:14px;
  white-space:pre-wrap;
  line-height:1.5;
}
.user .bubble{background:#12688a}
.assistant .bubble{
  background:#10182a;
  border:1px solid #1b2945;
}
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
  font-size:20px;
}
@media(max-width:700px){
  .sidebar{display:none}
  .welcome h1{font-size:35px}
  .bubble{max-width:90%}
}
</style>
</head>

<body>
<div class="app">

<aside class="sidebar">
  <div class="logo">⚡ HPX AI</div>
  <button class="new" onclick="newChat()">＋ New Chat</button>
  <div class="history">🕘 History</div>
</aside>

<main class="main">

<header class="top">
  <b>HPX AI</b>
  <span class="online">● Online</span>
</header>

<section id="chat" class="chat">
  <div id="welcome" class="welcome">
    <h1>HPX AI</h1>
    <p>Intelligent AI assistant by HPX LABS.</p>
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
    <button id="send" class="send" onclick="send()">➤</button>
  </div>
</div>

</main>
</div>

<script>
let messages=[];

function add(role,text){
  const chat=document.getElementById("chat");

  const row=document.createElement("div");
  row.className="msg "+role;

  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=text;

  row.appendChild(bubble);
  chat.appendChild(row);

  chat.scrollTop=chat.scrollHeight;

  return bubble;
}

async function send(){
  const input=document.getElementById("input");
  const button=document.getElementById("send");

  const text=input.value.trim();

  if(!text)return;

  document.getElementById("welcome").style.display="none";

  messages.push({
    role:"user",
    content:text
  });

  add("user",text);

  input.value="";
  button.disabled=true;

  const replyBox=add("assistant","Thinking...");

  try{
    const response=await fetch("/api/chat",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({messages})
    });

    const data=await response.json();

    if(!response.ok){
      throw new Error(data.error||"Request failed");
    }

    replyBox.textContent=data.reply;

    messages.push({
      role:"assistant",
      content:data.reply
    });

  }catch(error){
    replyBox.textContent="⚠️ "+error.message;
  }

  button.disabled=false;
  input.focus();
}

function key(e){
  if(e.key==="Enter"&&!e.shiftKey){
    e.preventDefault();
    send();
  }
}

function newChat(){
  messages=[];
  location.reload();
}
</script>

</body>
</html>`,{
      headers:{
        "Content-Type":"text/html;charset=UTF-8"
      }
    });
  }
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "Content-Type":"application/json;charset=UTF-8"
    }
  });
                        }
