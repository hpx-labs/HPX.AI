export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-40);

        const memory =
          typeof body.memory === "string"
            ? body.memory.slice(0, 5000)
            : "";

        const system = [
          "You are HPX AI, the official AI assistant of HPX LABS.",
          "AI name: HPX AI.",
          "Organization: HPX LABS.",
          "Founder: Harshit Patel.",
          "Version: HPX AI v1.0.",
          "Purpose: General-purpose AI assistant.",
          "Rules:",
          "- If asked who you are, say HPX AI.",
          "- If asked who founded HPX LABS, say Harshit Patel.",
          "- Do not claim to be ChatGPT, Gemini, Claude or another AI.",
          "- Do not invent facts about HPX LABS or Harshit Patel.",
          "- Do not claim live web access unless it is actually available.",
          "- Match the user's language.",
          "- Use natural Hinglish when the user speaks Hinglish.",
          "- Be clear, helpful and concise.",
          "- Use Markdown when useful."
        ].join("\n");

        const prompt = memory
          ? system +
            "\n\nLOCAL USER MEMORY:\n" +
            memory +
            "\nUse it only when relevant."
          : system;

        const controller = new AbortController();

        const timeout = setTimeout(
          () => controller.abort(),
          60000
        );

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
                  },
                  ...messages
                ]
              }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timeout);
        }

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          return json(
            {
              error:
                data?.error?.message ||
                "OpenRouter request failed."
            },
            response.status
          );
        }

        const reply =
          data?.choices?.[0]?.message?.content
            ? String(data.choices[0].message.content)
            : "Sorry, I could not generate a response.";

        return json({
          reply,
          model: data?.model
            ? String(data.model)
            : "openrouter/free"
        });
      } catch (error) {
        if (error?.name === "AbortError") {
          return json(
            {
              error:
                "Request timed out. Please try again."
            },
            504
          );
        }

        return json(
          {
            error:
              error?.message ||
              "Something went wrong."
          },
          500
        );
      }
    }

    return new Response(createHTML(), {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

function createHTML() {
  return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#07111f">

<title>HPX AI</title>

<style>
:root{
--bg:#07111f;
--panel:#0b1728;
--panel2:#102036;
--border:#213750;
--text:#f5f7fb;
--muted:#93a4ba;
--accent:#22d3ee;
--user:#153b5b;
}

*{
box-sizing:border-box
}

html,body{
margin:0;
height:100%;
overflow:hidden
}

body{
background:var(--bg);
color:var(--text);
font-family:Arial,Helvetica,sans-serif
}

button,input,textarea,select{
font:inherit
}

button{
cursor:pointer
}

.app{
display:flex;
height:100vh
}

.side{
width:285px;
background:var(--panel);
border-right:1px solid var(--border);
display:flex;
flex-direction:column;
z-index:20
}

.brand{
padding:16px;
border-bottom:1px solid var(--border);
display:flex;
gap:10px;
align-items:center
}

.logo,
.welcome .big{
display:grid;
place-items:center;
background:linear-gradient(135deg,var(--accent),#3b82f6);
color:#00121d;
font-weight:900
}

.logo{
width:42px;
height:42px;
border-radius:12px
}

.brand b{
font-size:19px
}

.brand small{
display:block;
color:var(--muted);
margin-top:3px
}

.new{
margin:12px;
padding:11px;
border-radius:10px;
border:1px solid var(--border);
background:var(--panel2);
color:var(--text);
font-weight:700
}

.search{
margin:0 12px 10px;
padding:10px;
border-radius:9px;
border:1px solid var(--border);
background:#071321;
color:var(--text);
outline:0;
width:calc(100% - 24px)
}

.history{
flex:1;
overflow:auto;
padding:0 8px
}

.histTitle{
font-size:11px;
color:var(--muted);
padding:8px
}

.item{
position:relative;
padding:10px;
border-radius:9px;
margin-bottom:4px;
cursor:pointer;
border:1px solid transparent
}

.item:hover,
.item.active{
background:var(--panel2);
border-color:var(--border)
}

.name{
white-space:nowrap;
overflow:hidden;
text-overflow:ellipsis;
padding-right:85px;
font-size:13px
}

.meta{
color:var(--muted);
font-size:10px;
margin-top:4px
}

.acts{
position:absolute;
right:5px;
top:7px;
display:flex;
gap:2px
}

.mini{
border:0;
background:transparent;
color:var(--muted);
padding:3px
}

.mini:hover{
color:var(--text)
}

.sidebottom{
border-top:1px solid var(--border);
padding:9px;
display:grid;
grid-template-columns:1fr 1fr;
gap:6px
}

.sidebottom button{
padding:8px;
border:1px solid var(--border);
background:var(--panel2);
color:var(--text);
border-radius:8px;
font-size:12px
}

.main{
flex:1;
min-width:0;
display:flex;
flex-direction:column
}

.top{
height:60px;
border-bottom:1px solid var(--border);
display:flex;
align-items:center;
justify-content:space-between;
padding:0 15px;
background:rgba(7,17,31,.95)
}

.left{
display:flex;
align-items:center;
gap:9px
}

.menu{
display:none;
padding:8px;
border:1px solid var(--border);
background:var(--panel2);
color:var(--text);
border-radius:8px
}

.status{
font-size:11px;
color:#4ade80
}

.dot{
display:inline-block;
width:7px;
height:7px;
border-radius:50%;
background:#4ade80;
margin-right:5px
}

.messages{
flex:1;
overflow:auto;
padding:22px max(12px,calc((100vw - 900px)/2))
}

.welcome{
min-height:70%;
display:grid;
place-items:center;
text-align:center;
align-content:center;
gap:10px
}

.welcome .big{
width:68px;
height:68px;
border-radius:20px;
font-size:24px
}

.welcome h2{
margin:0;
font-size:29px
}

.welcome p{
margin:0;
color:var(--muted);
max-width:600px
}

.suggest{
display:grid;
grid-template-columns:1fr 1fr;
gap:8px;
max-width:620px;
width:100%;
margin-top:8px
}

.suggest button{
padding:10px;
text-align:left;
background:var(--panel);
color:var(--text);
border:1px solid var(--border);
border-radius:9px
}

.msg{
display:flex;
gap:9px;
margin-bottom:18px
}

.avatar{
width:33px;
height:33px;
min-width:33px;
border-radius:9px;
display:grid;
place-items:center;
font-size:10px;
font-weight:800;
background:var(--panel2)
}

.assistant .avatar{
background:linear-gradient(135deg,var(--accent),#3b82f6);
color:#00121d
}

.bubble{
max-width:calc(100% - 43px);
line-height:1.55;
font-size:15px;
overflow-wrap:anywhere
}

.user .bubble{
background:var(--user);
padding:10px 12px;
border-radius:11px
}

.assistant .bubble{
background:#0d1c2e;
border:1px solid var(--border);
padding:11px 13px;
border-radius:11px
}

.bubble p{
margin:0 0 8px
}

.bubble p:last-child{
margin:0
}

.bubble code{
background:#06101c;
border:1px solid var(--border);
padding:2px 4px;
border-radius:4px;
font-family:monospace
}

.bubble ul{
padding-left:20px
}

.code{
background:#050c15;
border:1px solid var(--border);
border-radius:8px;
overflow:hidden;
margin:8px 0
}

.codehead{
padding:6px 9px;
background:#0b1725;
color:var(--muted);
font-size:10px;
display:flex;
justify-content:space-between
}

.codehead button{
border:1px solid var(--border);
background:var(--panel2);
color:var(--text);
border-radius:5px;
font-size:10px;
padding:3px 7px
}

.code pre{
margin:0;
padding:11px;
overflow:auto;
font:13px/1.5 monospace
}

.tools{
display:flex;
gap:3px;
margin-top:5px
}

.tools button{
border:1px solid transparent;
background:transparent;
color:var(--muted);
font-size:10px;
padding:4px 6px;
border-radius:5px
}

.tools button:hover{
background:var(--panel2);
color:var(--text);
border-color:var(--border)
}

.composeWrap{
padding:9px max(12px,calc((100vw - 900px)/2)) 13px;
border-top:1px solid var(--border)
}

.compose{
display:flex;
gap:6px;
align-items:end;
padding:7px;
border:1px solid var(--border);
background:var(--panel);
border-radius:13px
}

.compose:focus-within{
border-color:var(--accent)
}

#input{
flex:1;
min-height:40px;
max-height:170px;
resize:none;
background:transparent;
border:0;
outline:0;
color:var(--text);
padding:9px
}

.icon{
width:39px;
height:39px;
border:0;
border-radius:9px;
background:transparent;
color:var(--muted)
}

.icon:hover{
background:var(--panel2);
color:var(--text)
}

.send{
background:linear-gradient(135deg,var(--accent),#3b82f6);
color:#00121d;
font-weight:900
}

.stop{
background:#67232b;
color:white
}

.modalbg{
position:fixed;
inset:0;
background:#0009;
display:none;
place-items:center;
z-index:100;
padding:15px
}

.modalbg.open{
display:grid
}

.modal{
width:min(530px,100%);
max-height:90vh;
overflow:auto;
background:var(--panel);
border:1px solid var(--border);
border-radius:14px;
padding:16px
}

.modalhead{
display:flex;
justify-content:space-between;
align-items:center
}

.modal h3{
margin:0
}

.close{
background:transparent;
border:0;
color:var(--muted);
font-size:22px
}

.set{
padding:12px 0;
border-bottom:1px solid var(--border)
}

.set label{
display:block;
font-size:12px;
margin-bottom:6px
}

.set input,
.set textarea,
.set select{
width:100%;
background:#071321;
color:var(--text);
border:1px solid var(--border);
border-radius:8px;
padding:9px;
outline:0
}

.set textarea{
min-height:85px;
resize:vertical
}

.row{
display:flex;
gap:7px;
flex-wrap:wrap
}

.action{
padding:8px 10px;
background:var(--panel2);
color:var(--text);
border:1px solid var(--border);
border-radius:7px
}

.toast{
position:fixed;
bottom:78px;
left:50%;
transform:translateX(-50%);
display:none;
background:#102036;
border:1px solid var(--border);
padding:9px 13px;
border-radius:8px;
z-index:200;
font-size:12px
}

.toast.show{
display:block
}

.typing{
display:flex;
gap:4px;
padding:3px
}

.typing i{
width:6px;
height:6px;
border-radius:50%;
background:var(--muted);
animation:b 1s infinite
}

.typing i:nth-child(2){
animation-delay:.15s
}

.typing i:nth-child(3){
animation-delay:.3s
}

@keyframes b{
50%{opacity:.25;transform:translateY(-3px)}
}

body.compact .messages{
padding-top:10px;
padding-bottom:10px
}

body.compact .msg{
margin-bottom:9px
}

body.light{
--bg:#f5f7fb;
--panel:#ffffff;
--panel2:#eef2f7;
--border:#d6deea;
--text:#152033;
--muted:#66758a;
--user:#dbeafe
}

@media(max-width:760px){
.side{
position:fixed;
left:-300px;
top:0;
bottom:0;
transition:.2s
}

.side.open{
left:0
}

.menu{
display:block
}

.messages{
padding-left:10px;
padding-right:10px
}

.composeWrap{
padding-left:8px;
padding-right:8px
}

.suggest{
grid-template-columns:1fr
}

.welcome h2{
font-size:24px
}
}
</style>
</head>

<body>

<div class="app">

<aside class="side" id="side">

<div class="brand">
<div class="logo">HP</div>
<div>
<b>HPX AI</b>
<small>by HPX LABS</small>
</div>
</div>

<button class="new" onclick="newChat()">＋ New Chat</button>

<input
id="search"
class="search"
placeholder="Search chats..."
oninput="renderHistory()"
>

<div class="history" id="history"></div>

<div class="sidebottom">
<button onclick="openSettings()">⚙ Settings</button>
<button onclick="about()">ⓘ About</button>
</div>

</aside>

<main class="main">

<header class="top">

<div class="left">
<button class="menu" onclick="toggleSide()">☰</button>

<div>
<b>HPX AI</b>
<div>
<span class="dot"></span>
<span class="status" id="status">Ready</span>
</div>
</div>
</div>

<div>
<span id="model" class="status">• Free Model</span>
</div>

</header>

<section class="messages" id="messages"></section>

<div class="composeWrap">

<div class="compose">

<button class="icon" onclick="voice()" title="Voice">
🎙
</button>

<button class="icon" onclick="calc()" title="Calculator">
🧮
</button>

<textarea
id="input"
placeholder="Message HPX AI..."
onkeydown="key(event)"
oninput="resizeInput()"
></textarea>

<button
class="icon send"
id="send"
onclick="send()"
title="Send"
>
➤
</button>

<button
class="icon stop"
id="stop"
onclick="stopRequest()"
style="display:none"
title="Stop"
>
■
</button>

</div>

</div>

</main>
</div>

<div class="modalbg" id="modal">

<div class="modal">

<div class="modalhead">
<h3>HPX AI Settings</h3>
<button class="close" onclick="closeSettings()">×</button>
</div>

<div class="set">

<label>Theme</label>

<select
onchange="setTheme(this.value)"
id="theme"
>
<option value="dark">Dark</option>
<option value="light">Light</option>
</select>

</div>

<div class="set">

<label>Accent</label>

<input
type="color"
id="accent"
oninput="accent(this.value)"
>

</div>

<div class="set">

<label>Font Size</label>

<select
id="font"
onchange="setFont(this.value)"
>
<option value="14px">Small</option>
<option value="15px">Normal</option>
<option value="16px">Large</option>
<option value="17px">Extra Large</option>
</select>

</div>

<div class="set">

<label>Compact Mode</label>

<select
id="compact"
onchange="setCompact(this.value)"
>
<option value="0">Off</option>
<option value="1">On</option>
</select>

</div>

<div class="set">

<label>Local Memory</label>

<textarea
id="memory"
placeholder="Example: I prefer Hinglish..."
></textarea>

<div class="row">
<button class="action" onclick="saveMemory()">Save Memory</button>
<button class="action" onclick="forgetMemory()">Clear Memory</button>
</div>

</div>

<div class="set">

<label>Saved Prompt</label>

<textarea
id="prompt"
placeholder="Save a useful prompt here..."
></textarea>

<div class="row">
<button class="action" onclick="savePrompt()">Save Prompt</button>
<button class="action" onclick="usePrompt()">Use Saved Prompt</button>
</div>

</div>

<div class="set">

<label>Backup & Export</label>

<div class="row">

<button class="action" onclick="backup()">
Export Backup
</button>

<label class="action">
Import Backup
<input
type="file"
accept=".json"
onchange="restore(event)"
style="display:none"
>
</label>

<button class="action" onclick="exportTXT()">
Export TXT
</button>

<button class="action" onclick="exportHTML()">
Export HTML
</button>

</div>

</div>

<div class="set">

<label>Danger Zone</label>

<button
class="action"
onclick="clearAll()"
>
Clear All Chat History
</button>

</div>

</div>
</div>

<div class="toast" id="toast"></div>

<script>
const KEY="hpx_ai_v2";
const CFG="hpx_ai_settings_v2";

let data={
chats:[],
memory:"",
prompts:[]
};

let cfg={
theme:"dark",
accent:"#22d3ee",
font:"15px",
compact:"0"
};

let current=null;
let busy=false;
let controller=null;

function esc(s){
return String(s??"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#39;");
}

function save(){
localStorage.setItem(KEY,JSON.stringify(data));
}

function saveCfg(){
localStorage.setItem(CFG,JSON.stringify(cfg));
}

function load(){

try{
const x=JSON.parse(localStorage.getItem(KEY)||"null");

if(x){
data=Object.assign(data,x);
}
}catch(e){}

try{
const x=JSON.parse(localStorage.getItem(CFG)||"null");

if(x){
cfg=Object.assign(cfg,x);
}
}catch(e){}

apply();

if(!data.chats.length){
welcome();
}else{
current=data.chats[0].id;
renderChat();
}

renderHistory();

document.getElementById("memory").value=data.memory||"";
}

function apply(){

document.documentElement.style.setProperty(
"--accent",
cfg.accent||"#22d3ee"
);

document.body.classList.toggle(
"light",
cfg.theme==="light"
);

document.body.classList.toggle(
"compact",
cfg.compact==="1"
);

document.body.style.fontSize=cfg.font||"15px";

const theme=document.getElementById("theme");
const accentInput=document.getElementById("accent");
const font=document.getElementById("font");
const compact=document.getElementById("compact");

if(theme)theme.value=cfg.theme;
if(accentInput)accentInput.value=cfg.accent;
if(font)font.value=cfg.font;
if(compact)compact.value=cfg.compact;
}

function createChat(first){

const id=
Date.now().toString(36)+
Math.random().toString(36).slice(2,8);

const c={
id,
name:(first||"New Chat").slice(0,60),
messages:[],
updated:Date.now(),
pinned:false,
favorite:false
};

data.chats.unshift(c);
current=id;

save();
renderHistory();

return c;
}

function getChat(){
return data.chats.find(c=>c.id===current);
}

function newChat(){

const c=createChat("New Chat");

current=c.id;

welcome();
renderHistory();

closeSide();
}

function welcome(){

document.getElementById("messages").innerHTML=
'<div class="welcome">'+
'<div class="big">HP</div>'+
'<h2>Welcome to HPX AI</h2>'+
'<p>Ask HPX AI anything, write code, calculate, study or brainstorm.</p>'+
'<div class="suggest">'+
'<button onclick="suggest(this.innerText)">📚 Explain a difficult topic simply</button>'+
'<button onclick="suggest(this.innerText)">💻 Help me write Python code</button>'+
'<button onclick="suggest(this.innerText)">🧮 Solve a calculation step by step</button>'+
'<button onclick="suggest(this.innerText)">💡 Give me project ideas</button>'+
'</div>'+
'</div>';
}

function suggest(t){

document.getElementById("input").value=t;

resizeInput();

send();
}

function renderHistory(){

const box=document.getElementById("history");

const q=
(document.getElementById("search").value||"")
.toLowerCase();

let list=data.chats.filter(
c=>
!q||
c.name.toLowerCase().includes(q)
);

list.sort(
(a,b)=>
Number(b.pinned)-
Number(a.pinned)||
Number(b.updated)-
Number(a.updated)
);

box.innerHTML=
'<div class="histTitle">CHATS</div>';

list.forEach(c=>{

const el=document.createElement("div");

el.className=
"item"+(c.id===current?" active":"");

el.onclick=()=>{
openChat(c.id);
};

el.innerHTML=
'<div class="name">'+
(c.pinned?"📌 ":"")+
(c.favorite?"⭐ ":"")+
esc(c.name)+
'</div>'+
'<div class="meta">'+
new Date(c.updated).toLocaleString()+
'</div>'+
'<div class="acts">'+
'<button class="mini" title="Pin" onclick="event.stopPropagation();togglePin(\''+
c.id+
'\')">📌</button>'+
'<button class="mini" title="Rename" onclick="event.stopPropagation();renameChat(\''+
c.id+
'\')">✏️</button>'+
'<button class="mini" title="Delete" onclick="event.stopPropagation();deleteChat(\''+
c.id+
'\')">🗑</button>'+
'</div>';

box.appendChild(el);
});
}

function openChat(id){

current=id;

renderChat();

renderHistory();

closeSide();
}

function renameChat(id){

const c=data.chats.find(x=>x.id===id);

if(!c)return;

const n=prompt(
"Rename chat",
c.name
);

if(n&&n.trim()){

c.name=n.trim().slice(0,80);
c.updated=Date.now();

save();
renderHistory();
}
}

function togglePin(id){

const c=data.chats.find(x=>x.id===id);

if(c){

c.pinned=!c.pinned;
c.updated=Date.now();

save();
renderHistory();
}
}

function deleteChat(id){

if(!confirm("Delete this chat?"))return;

data.chats=
data.chats.filter(c=>c.id!==id);

if(current===id){

current=
data.chats[0]?.id||null;

if(current){
renderChat();
}else{
welcome();
}
}

save();

renderHistory();
}

function renderChat(){

const c=getChat();

if(!c){
welcome();
return;
}

const box=
document.getElementById("messages");

box.innerHTML="";

c.messages.forEach(
(m,i)=>
appendMessage(
m.role,
m.content,
i
)
);

scrollBottom();
}

function appendMessage(
role,
content,
index
){

const box=
document.getElementById("messages");

const el=
document.createElement("div");

el.className=
"msg "+
(role==="user"?"user":"assistant");

const body=
role==="assistant"
?formatMarkdown(content)
:esc(content).replace(/\n/g,"<br>");

el.innerHTML=
'<div class="avatar">'+
(role==="user"?"YOU":"HPX")+
'</div>'+
'<div class="bubble">'+
body+
(
role==="assistant"
?
'<div class="tools">'+
'<button onclick="copyText('+index+')">Copy</button>'+
'<button onclick="speakText('+index+')">Speak</button>'+
'</div>'
:""
)+
'</div>';

box.appendChild(el);
}

function formatMarkdown(s){

let t=esc(s);

const blocks=[];

t=t.replace(
/```([\w+-]*)\n?([\s\S]*?)```/g,
(m,lang,code)=>{

const id=
"code_"+blocks.length;

blocks.push({
id,
code:code.trim()
});

return "@@CODE"+blocks.length+"@@";
}
);

t=t.replace(
/`([^`]+)`/g,
"<code>$1</code>"
);

t=t.replace(
/\*\*([^*]+)\*\*/g,
"<strong>$1</strong>"
);

t=t.replace(
/^### (.*)$/gm,
"<h4>$1</h4>"
);

t=t.replace(
/^## (.*)$/gm,
"<h3>$1</h3>"
);

t=t.replace(
/^# (.*)$/gm,
"<h2>$1</h2>"
);

t=t.replace(
/^- (.*)$/gm,
"<li>$1</li>"
);

t=t.replace(
/(<li>[\s\S]*?<\/li>)/g,
"<ul>$1</ul>"
);

t=
t.split(/\n\n+/)
.map(
x=>
/^<(h[234]|ul|li)>/.test(x)||
x.startsWith("@@CODE")
?x
:"<p>"+
x.replace(/\n/g,"<br>")+
"</p>"
)
.join("");

blocks.forEach(
(b,i)=>{

t=t.replace(
"@@CODE"+(i+1)+"@@",
'<div class="code">'+
'<div class="codehead">'+
'<span>Code</span>'+
'<button onclick="copyCode(this)">Copy</button>'+
'</div>'+
'<pre>'+
b.code+
'</pre>'+
'</div>'
);
}
);

return t;
}

function copyCode(btn){

const code=
btn.parentElement
.nextElementSibling
.innerText;

if(navigator.clipboard){
navigator.clipboard.writeText(code);
}

toast("Code copied");
}

function copyText(i){

const c=getChat();

if(
c?.messages[i] &&
navigator.clipboard
){

navigator.clipboard
.writeText(c.messages[i].content)
.then(
()=>toast("Copied")
);
}
}

function speakText(i){

const c=getChat();

if(
c?.messages[i] &&
"speechSynthesis"in window
){

speechSynthesis.cancel();

speechSynthesis.speak(
new SpeechSynthesisUtterance(
c.messages[i].content
)
);
}
}

function scrollBottom(){

const b=
document.getElementById("messages");

b.scrollTop=b.scrollHeight;
}

async function send(){

if(busy)return;

const input=
document.getElementById("input");

const text=
input.value.trim();

if(!text)return;

let c=getChat();

if(!c){
c=createChat(text);
}

if(c.name==="New Chat"){
c.name=text.slice(0,60);
}

c.messages.push({
role:"user",
content:text
});

c.updated=Date.now();

input.value="";

resizeInput();

save();

renderChat();

renderHistory();

busy=true;

controller=
new AbortController();

setUI(true);

const box=
document.getElementById("messages");

const typing=
document.createElement("div");

typing.id="typing";

typing.className=
"msg assistant";

typing.innerHTML=
'<div class="avatar">HPX</div>'+
'<div class="bubble">'+
'<div class="typing">'+
'<i></i><i></i><i></i>'+
'</div>'+
'</div>';

box.appendChild(typing);

scrollBottom();

try{

const r=
await fetch(
"/api/chat",
{
method:"POST",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify({
messages:
c.messages.slice(-40),
memory:data.memory
}),
signal:controller.signal
}
);

const d=
await r.json()
.catch(()=>({}));

if(!r.ok){

throw new Error(
d.error||
"Request failed"
);
}

const reply=
String(
d.reply||
"No response received."
);

c.messages.push({
role:"assistant",
content:reply
});

c.updated=Date.now();

save();

renderChat();

document.getElementById(
"model"
).textContent=
"• "+
(d.model||"Free Model");

setStatus("Ready");

}catch(e){

if(e.name!=="AbortError"){

c.messages.push({
role:"assistant",
content:
"⚠️ "+
(e.message||
"Something went wrong.")
});

save();

renderChat();
}

setStatus("Ready");

}finally{

busy=false;
controller=null;

setUI(false);
}
}

function stopRequest(){

if(controller){
controller.abort();
}

busy=false;

setUI(false);

setStatus("Stopped");
}

function setUI(on){

document.getElementById("send")
.style.display=
on?"none":"block";

document.getElementById("stop")
.style.display=
on?"block":"none";

setStatus(
on?
"Thinking...":
"Ready"
);
}

function setStatus(s){

document.getElementById(
"status"
).textContent=s;
}

function key(e){

if(
e.key==="Enter"&&
!e.shiftKey
){

e.preventDefault();

send();
}
}

function resizeInput(){

const x=
document.getElementById("input");

x.style.height="auto";

x.style.height=
Math.min(
x.scrollHeight,
170
)+"px";
}

function toggleSide(){

document.getElementById(
"side"
).classList.toggle("open");
}

function closeSide(){

document.getElementById(
"side"
).classList.remove("open");
}

function openSettings(){

document.getElementById(
"modal"
).classList.add("open");
}

function closeSettings(){

document.getElementById(
"modal"
).classList.remove("open");
}

function setTheme(v){

cfg.theme=v;

saveCfg();

apply();
}

function accent(v){

cfg.accent=v;

saveCfg();

apply();
}

function setFont(v){

cfg.font=v;

saveCfg();

apply();
}

function setCompact(v){

cfg.compact=v;

saveCfg();

apply();
}

function saveMemory(){

data.memory=
document.getElementById(
"memory"
).value.slice(0,5000);

save();

toast("Memory saved");
}

function forgetMemory(){

data.memory="";

document.getElementById(
"memory"
).value="";

save();

toast("Memory cleared");
}

function savePrompt(){

const p=
document.getElementById(
"prompt"
).value.trim();

if(!p)return;

data.prompts.unshift(p);

data.prompts=
data.prompts.slice(0,20);

save();

toast("Prompt saved");
}

function usePrompt(){

if(!data.prompts.length){

toast("No saved prompt");

return;
}

document.getElementById(
"input"
).value=
data.prompts[0];

resizeInput();

closeSettings();
}

function clearAll(){

if(
!confirm(
"Clear all chat history?"
)
)return;

data.chats=[];

current=null;

save();

welcome();

renderHistory();

toast("History cleared");
}

function download(
name,
type,
text
){

const a=
document.createElement("a");

a.href=
URL.createObjectURL(
new Blob(
[text],
{type}
)
);

a.download=name;

a.click();

setTimeout(
()=>URL.revokeObjectURL(a.href),
1000
);
}

function backup(){

download(
"hpx-ai-backup.json",
"application/json",
JSON.stringify(
{data,cfg},
null,
2
)
);

toast("Backup exported");
}

function restore(e){

const f=
e.target.files?.[0];

if(!f)return;

const r=
new FileReader();

r.onload=()=>{

try{

const x=
JSON.parse(r.result);

if(x.data){
data=x.data;
}

if(x.cfg){
cfg=
Object.assign(
cfg,
x.cfg
);
}

save();

saveCfg();

load();

toast("Backup imported");

}catch(err){

toast("Invalid backup");
}
};

r.readAsText(f);

e.target.value="";
}

function exportTXT(){

const c=getChat();

if(!c){

toast("No chat selected");

return;
}

download(
(c.name||"hpx-chat")+".txt",
"text/plain",
c.messages
.map(
m=>
m.role.toUpperCase()+
":\n"+
m.content
)
.join("\n\n")
);
}

function exportHTML(){

const c=getChat();

if(!c){

toast("No chat selected");

return;
}

const html=
'<!doctype html>'+
'<html><head>'+
'<meta charset="utf-8">'+
'<title>'+
esc(c.name)+
'</title></head><body>'+
'<h1>'+
esc(c.name)+
'</h1>'+
c.messages
.map(
m=>
'<h3>'+
esc(m.role)+
'</h3><p>'+
esc(m.content)
.replace(/\n/g,"<br>")+
'</p>'
)
.join("")+
"</body></html>";

download(
(c.name||"hpx-chat")+".html",
"text/html",
html
);
}

function calc(){

const x=
prompt(
"Enter a calculation, e.g. 25*18+40"
);

if(!x)return;

try{

if(
!/^[0-9+\-*/().%\s]+$/.test(x)
){
throw new Error();
}

const result=
Function(
"return ("+
x+
")"
)();

document.getElementById(
"input"
).value=
x+
" = "+
result;

resizeInput();

}catch(e){

toast("Invalid calculation");
}
}

function voice(){

const SR=
window.SpeechRecognition||
window.webkitSpeechRecognition;

if(!SR){

toast(
"Voice input is not supported here"
);

return;
}

const r=new SR();

r.lang=
navigator.language||
"en-IN";

r.interimResults=false;

r.onresult=e=>{

document.getElementById(
"input"
).value=
e.results[0][0].transcript;

resizeInput();
};

r.onerror=()=>
toast("Voice input failed");

r.start();
}

function about(){

alert(
"HPX AI v1.0\n"+
"HPX LABS\n"+
"Founder: Harshit Patel\n"+
"General-purpose AI assistant."
);
}

function toast(s){

const t=
document.getElementById("toast");

t.textContent=s;

t.classList.add("show");

clearTimeout(
window.__toast
);

window.__toast=
setTimeout(
()=>
t.classList.remove("show"),
1800
);
}

document.addEventListener(
"keydown",
e=>{

if(
(e.ctrlKey||e.metaKey)&&
e.key.toLowerCase()==="k"
){

e.preventDefault();

document.getElementById(
"search"
).focus();
}

if(
(e.ctrlKey||e.metaKey)&&
e.key.toLowerCase()==="n"
){

e.preventDefault();

newChat();
}

if(e.key==="Escape"){
closeSettings();
}
}
);

load();
</script>

</body>
</html>`;
}
