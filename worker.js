export default {
  async fetch(request, env) {
    const u = new URL(request.url);

    if (u.pathname === "/api/chat") {
      if (request.method !== "POST")
        return json({ error: "Method Not Allowed" }, 405);

      try {
        if (!env.OPENROUTER_API_KEY)
          return json({ error: "OPENROUTER_API_KEY missing" }, 500);

        const b = await request.json();

        let m = Array.isArray(b.messages) ? b.messages : [];

        m = m
          .filter(
            x =>
              x &&
              (x.role === "user" || x.role === "assistant") &&
              typeof x.content === "string" &&
              x.content.trim()
          )
          .slice(-40);

        const memory =
          typeof b.memory === "string"
            ? b.memory.slice(0, 5000)
            : "";

        const system =
          "You are HPX AI, official AI assistant of HPX LABS. " +
          "Founder: Harshit Patel. Version: HPX AI v1.0. " +
          "If asked who you are, say HPX AI. " +
          "If asked who founded HPX LABS, say Harshit Patel. " +
          "Do not claim to be ChatGPT, Gemini or another AI. " +
          "Do not invent HPX LABS facts. " +
          "Match the user's language and use natural Hinglish when appropriate. " +
          "Be helpful and concise." +
          (memory ? "\nLOCAL MEMORY:\n" + memory : "");

        const controller = new AbortController();

        const timer = setTimeout(
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
                "HTTP-Referer": u.origin,
                "X-Title": "HPX AI"
              },
              body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                  {
                    role: "system",
                    content: system
                  },
                  ...m
                ]
              }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timer);
        }

        const d = await response.json().catch(() => ({}));

        if (!response.ok) {
          return json(
            {
              error:
                d?.error?.message ||
                "OpenRouter request failed"
            },
            response.status
          );
        }

        return json({
          reply: String(
            d?.choices?.[0]?.message?.content ||
              "Sorry, I could not generate a response."
          ),
          model: String(
            d?.model || "openrouter/free"
          )
        });
      } catch (e) {
        return json(
          {
            error:
              e?.name === "AbortError"
                ? "Request timed out. Please try again."
                : e?.message ||
                  "Something went wrong."
          },
          e?.name === "AbortError" ? 504 : 500
        );
      }
    }

    return new Response(html(), {
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
      "Content-Type": "application/json;charset=UTF-8"
    }
  });
}

function html() {
  return String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HPX AI</title>

<style>
:root{
--bg:#07111f;
--p:#0d1b2e;
--b:#213750;
--t:#f5f7fb;
--m:#91a3ba;
--a:#22d3ee
}

*{box-sizing:border-box}

body{
margin:0;
height:100vh;
background:var(--bg);
color:var(--t);
font:15px Arial;
display:flex
}

.side{
width:270px;
background:var(--p);
border-right:1px solid var(--b);
padding:12px;
display:flex;
flex-direction:column
}

.brand{
font-size:20px;
font-weight:bold;
padding:10px
}

.new,
.search,
.item,
.bottom button{
background:#102036;
color:var(--t);
border:1px solid var(--b);
border-radius:9px
}

.new{
padding:11px;
margin:8px 0
}

.search{
padding:10px;
width:100%;
outline:0
}

.history{
overflow:auto;
flex:1;
margin-top:8px
}

.item{
padding:9px;
margin:4px 0;
cursor:pointer
}

.item.active{
border-color:var(--a)
}

.meta{
font-size:10px;
color:var(--m);
margin-top:4px
}

.acts{
float:right
}

.acts button{
background:none;
border:0;
color:var(--m)
}

.bottom{
display:flex;
gap:6px
}

.bottom button{
flex:1;
padding:8px
}

.main{
flex:1;
display:flex;
flex-direction:column;
min-width:0
}

.top{
height:58px;
border-bottom:1px solid var(--b);
padding:0 14px;
display:flex;
align-items:center;
justify-content:space-between
}

.messages{
flex:1;
overflow:auto;
padding:20px;
max-width:900px;
width:100%;
margin:auto
}

.welcome{
text-align:center;
padding-top:20vh
}

.welcome h1{
color:var(--a)
}

.msg{
display:flex;
gap:8px;
margin:12px 0
}

.av{
min-width:32px;
height:32px;
border-radius:8px;
background:#102036;
display:grid;
place-items:center;
font-size:10px;
font-weight:bold
}

.assistant .av{
background:var(--a);
color:#00121d
}

.bubble{
max-width:90%;
padding:10px 12px;
border-radius:10px;
line-height:1.55;
white-space:pre-wrap;
overflow-wrap:anywhere
}

.user .bubble{
background:#153b5b
}

.assistant .bubble{
background:var(--p);
border:1px solid var(--b)
}

.tools button{
background:none;
border:0;
color:var(--m);
font-size:11px;
padding:5px 3px
}

.compose{
padding:10px;
border-top:1px solid var(--b);
display:flex;
gap:6px
}

.input{
flex:1;
resize:none;
background:#0b1728;
color:var(--t);
border:1px solid var(--b);
border-radius:10px;
padding:10px;
outline:0;
min-height:42px
}

.send,
.icon{
border:1px solid var(--b);
background:#102036;
color:var(--t);
border-radius:9px;
padding:9px 12px
}

.send{
background:var(--a);
color:#00121d;
font-weight:bold
}

.modal{
display:none;
position:fixed;
inset:0;
background:#0009;
place-items:center;
padding:15px
}

.modal.open{
display:grid
}

.box{
width:min(500px,100%);
background:var(--p);
border:1px solid var(--b);
border-radius:12px;
padding:15px
}

.box input,
.box textarea,
.box select{
width:100%;
margin:6px 0 12px;
padding:9px;
background:#071321;
color:var(--t);
border:1px solid var(--b);
border-radius:7px
}

.box button{
padding:8px;
margin:3px
}

.close{
float:right;
background:none;
border:0;
color:var(--t);
font-size:20px
}

.toast{
position:fixed;
bottom:70px;
left:50%;
transform:translateX(-50%);
background:#102036;
border:1px solid var(--b);
padding:8px 12px;
border-radius:8px;
display:none
}

@media(max-width:700px){
.side{
position:fixed;
z-index:5;
height:100%;
left:-280px;
transition:.2s
}

.side.open{
left:0
}

.messages{
padding:12px
}

.bubble{
max-width:88%
}
}
</style>
</head>

<body>

<aside class="side" id="side">

<div class="brand">
⚡ HPX AI<br>
<small>HPX LABS</small>
</div>

<button class="new" onclick="newChat()">
＋ New Chat
</button>

<input
class="search"
id="search"
placeholder="Search chats..."
oninput="historyList()"
>

<div class="history" id="history"></div>

<div class="bottom">
<button onclick="settings()">⚙</button>
<button onclick="clearAll()">🗑</button>
</div>

</aside>

<main class="main">

<header class="top">
<b>HPX AI</b>
<span id="status">● Ready</span>
</header>

<section class="messages" id="messages"></section>

<div class="compose">

<button class="icon" onclick="voice()">🎙</button>

<textarea
class="input"
id="input"
placeholder="Message HPX AI..."
onkeydown="key(event)"
></textarea>

<button
class="send"
id="send"
onclick="send()"
>
➤
</button>

<button
class="icon"
id="stop"
onclick="stopRequest()"
style="display:none"
>
■
</button>

</div>

</main>

<div class="modal" id="modal">

<div class="box">

<button
class="close"
onclick="settings()"
>
×
</button>

<h3>HPX AI Settings</h3>

<label>Theme</label>

<select
id="theme"
onchange="setTheme(this.value)"
>
<option value="dark">Dark</option>
<option value="light">Light</option>
</select>

<label>Accent</label>

<input
id="accent"
type="color"
onchange="setAccent(this.value)"
>

<label>Local Memory</label>

<textarea
id="memory"
placeholder="Your preferences..."
></textarea>

<button onclick="saveMemory()">
Save Memory
</button>

<button onclick="backup()">
Backup
</button>

<button onclick="exportTxt()">
Export TXT
</button>

</div>
</div>

<div class="toast" id="toast"></div>

<script>
const KEY="hpx_ai_v3";
const SET="hpx_ai_settings_v3";

let data={
chats:[],
memory:""
};

let config={
theme:"dark",
accent:"#22d3ee"
};

let current=null;
let busy=false;
let controller=null;

function save(){
localStorage.setItem(
KEY,
JSON.stringify(data)
);

localStorage.setItem(
SET,
JSON.stringify(config)
);
}

function esc(x){
return String(x??"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#39;");
}

function load(){

try{
data=Object.assign(
data,
JSON.parse(
localStorage.getItem(KEY)||"{}"
)
);

config=Object.assign(
config,
JSON.parse(
localStorage.getItem(SET)||"{}"
)
);
}catch(e){}

apply();

document.getElementById(
"memory"
).value=data.memory||"";

if(data.chats.length){

current=data.chats[0].id;
render();

}else{

welcome();
}

historyList();
}

function apply(){

document.documentElement
.style
.setProperty(
"--a",
config.accent
);

document.getElementById(
"accent"
).value=config.accent;

document.getElementById(
"theme"
).value=config.theme;
}

function welcome(){

document.getElementById(
"messages"
).innerHTML=
'<div class="welcome">'+
'<h1>⚡ HPX AI</h1>'+
'<p>Welcome to HPX AI by HPX LABS.</p>'+
'<p>Ask me anything.</p>'+
'</div>';
}

function getChat(){
return data.chats.find(
x=>x.id===current
);
}

function newChat(){

const x={
id:Date.now().toString(36),
name:"New Chat",
messages:[],
updated:Date.now()
};

data.chats.unshift(x);

current=x.id;

save();
render();
historyList();
}

function historyList(){

const q=
(
document.getElementById(
"search"
).value||""
).toLowerCase();

const box=
document.getElementById(
"history"
);

box.innerHTML="<small>CHATS</small>";

data.chats
.filter(
x=>
!q||
x.name.toLowerCase()
.includes(q)
)
.forEach(x=>{

const e=
document.createElement("div");

e.className=
"item"+
(x.id===current?" active":"");

e.innerHTML=
"<b>"+
esc(x.name)+
"</b>"+
'<div class="meta">'+
new Date(
x.updated
).toLocaleString()+
"</div>"+
'<div class="acts">'+
'<button onclick="event.stopPropagation();renameChat(\''+
x.id+
'\')">✏️</button>'+
'<button onclick="event.stopPropagation();deleteChat(\''+
x.id+
'\')">🗑</button>'+
"</div>";

e.onclick=()=>{
current=x.id;
render();
historyList();
};

box.appendChild(e);
});
}

function renameChat(id){

const x=
data.chats.find(
a=>a.id===id
);

if(!x)return;

const n=
prompt(
"Rename chat",
x.name
);

if(n){

x.name=n.slice(0,70);
x.updated=Date.now();

save();
historyList();
}
}

function deleteChat(id){

if(!confirm("Delete chat?"))
return;

data.chats=
data.chats.filter(
x=>x.id!==id
);

current=
data.chats[0]?.id||null;

save();

if(current)
render();
else
welcome();

historyList();
}

function render(){

const x=getChat();

if(!x){
welcome();
return;
}

const box=
document.getElementById(
"messages"
);

box.innerHTML="";

x.messages.forEach(
(m,i)=>{

const e=
document.createElement("div");

e.className=
"msg "+
m.role;

e.innerHTML=
'<div class="av">'+
(
m.role==="user"
?"YOU"
:"HPX"
)+
"</div>"+
'<div class="bubble">'+
esc(m.content)+
(
m.role==="assistant"
?
'<div class="tools">'+
'<button onclick="copyMsg('+i+')">Copy</button>'+
'<button onclick="speakMsg('+i+')">Speak</button>'+
"</div>"
:""
)+
"</div>";

box.appendChild(e);
});

box.scrollTop=
box.scrollHeight;
}

async function send(){

if(busy)return;

const input=
document.getElementById(
"input"
);

const text=
input.value.trim();

if(!text)return;

let x=getChat();

if(!x){

newChat();

x=getChat();
}

if(x.name==="New Chat"){
x.name=
text.slice(0,60);
}

x.messages.push({
role:"user",
content:text
});

x.updated=Date.now();

input.value="";

save();
render();
historyList();

busy=true;

controller=
new AbortController();

document.getElementById(
"send"
).style.display="none";

document.getElementById(
"stop"
).style.display="block";

document.getElementById(
"status"
).textContent=
"● Thinking...";

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
x.messages.slice(-40),
memory:data.memory
}),
signal:controller.signal
}
);

const z=
await r.json();

if(!r.ok)
throw new Error(
z.error||
"Request failed"
);

x.messages.push({
role:"assistant",
content:String(
z.reply||
"No response"
)
});

x.updated=Date.now();

save();
render();
historyList();

}catch(e){

if(e.name!=="AbortError"){

x.messages.push({
role:"assistant",
content:
"⚠️ "+
e.message
});

save();
render();
}

}finally{

busy=false;
controller=null;

document.getElementById(
"send"
).style.display="block";

document.getElementById(
"stop"
).style.display="none";

document.getElementById(
"status"
).textContent=
"● Ready";
}
}

function stopRequest(){

if(controller)
controller.abort();

busy=false;

document.getElementById(
"send"
).style.display="block";

document.getElementById(
"stop"
).style.display="none";

document.getElementById(
"status"
).textContent=
"● Ready";
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

function copyMsg(i){

const x=
getChat()?.messages[i];

if(x)
navigator.clipboard
?.writeText(x.content)
.then(
()=>toast("Copied")
);
}

function speakMsg(i){

const x=
getChat()?.messages[i];

if(
x&&
"speechSynthesis"in window
){

speechSynthesis.cancel();

speechSynthesis.speak(
new SpeechSynthesisUtterance(
x.content
)
);
}
}

function voice(){

const R=
window.SpeechRecognition||
window.webkitSpeechRecognition;

if(!R){

toast(
"Voice not supported"
);

return;
}

const r=new R();

r.lang="en-IN";

r.onresult=e=>{

document.getElementById(
"input"
).value=
e.results[0][0]
.transcript;
};

r.start();
}

function settings(){

document.getElementById(
"modal"
).classList.toggle(
"open"
);
}

function setTheme(v){

config.theme=v;

if(v==="light"){

document.body.style.background=
"#f5f7fb";

document.body.style.color=
"#152033";

}else{

document.body.style.background=
"#07111f";

document.body.style.color=
"#f5f7fb";
}

save();
}

function setAccent(v){

config.accent=v;

apply();
save();
}

function saveMemory(){

data.memory=
document.getElementById(
"memory"
).value
.slice(0,5000);

save();

toast("Memory saved");
}

function clearAll(){

if(
!confirm(
"Clear all chats?"
)
)
return;

data.chats=[];

current=null;

save();

welcome();
historyList();
}

function backup(){

const a=
document.createElement("a");

a.href=
URL.createObjectURL(
new Blob(
[
JSON.stringify(
{data,config},
null,
2
)
],
{
type:
"application/json"
}
)
);

a.download=
"hpx-ai-backup.json";

a.click();
}

function exportTxt(){

const x=getChat();

if(!x)return;

const a=
document.createElement("a");

a.href=
URL.createObjectURL(
new Blob(
[
x.messages
.map(
m=>
m.role.toUpperCase()+
":\n"+
m.content
)
.join("\n\n")
],
{
type:"text/plain"
}
)
);

a.download=
"hpx-chat.txt";

a.click();
}

function toast(x){

const t=
document.getElementById(
"toast"
);

t.textContent=x;

t.style.display="block";

setTimeout(
()=>t.style.display="none",
1500
);
}

load();
</script>

</body>
</html>`;
            }
