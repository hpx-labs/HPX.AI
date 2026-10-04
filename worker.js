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
          "You are HPX AI, the official AI assistant of HPX LABS.\n" +
          "AI name: HPX AI.\n" +
          "Organization: HPX LABS.\n" +
          "Founder: Harshit Patel.\n" +
          "Version: HPX AI v1.0.\n" +
          "Purpose: General purpose AI assistant.\n\n" +
          "Rules:\n" +
          "- If asked who you are, say HPX AI.\n" +
          "- If asked who founded HPX LABS, say Harshit Patel.\n" +
          "- Do not claim to be ChatGPT, Gemini, Claude or another AI.\n" +
          "- Do not invent facts about HPX LABS or Harshit Patel.\n" +
          "- Do not claim live web access unless it is actually available.\n" +
          "- Match the user's language.\n" +
          "- For Hindi or Hinglish, use natural Hinglish.\n" +
          "- Be clear, useful and concise.\n" +
          "- For coding, provide clean code.\n" +
          "- For calculations, calculate carefully.";

        const finalSystemPrompt = memory
          ? systemPrompt +
            "\n\nLOCAL USER MEMORY:\n" +
            memory +
            "\nUse this memory only when relevant."
          : systemPrompt;

        const response = await fetch(
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

    return new Response(createHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    }
  });
}

function createHTML() {
  const lines = [
    "<!DOCTYPE html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"UTF-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "<meta name=\"theme-color\" content=\"#07111f\">",
    "<title>HPX AI</title>",
    "<style>",
    "*{box-sizing:border-box}",
    "html,body{margin:0;width:100%;height:100%;}",
    "body{font-family:Arial,sans-serif;background:#07111f;color:#edf6ff;overflow:hidden}",
    "button,input,textarea{font:inherit}",
    "button{cursor:pointer}",
    ".app{display:flex;height:100vh}",
    ".side{width:270px;flex-shrink:0;background:#081522;border-right:1px solid #193047;display:flex;flex-direction:column}",
    ".brand{padding:20px;border-bottom:1px solid #193047}",
    ".brand b{font-size:25px}",
    ".brand small{display:block;margin-top:5px;color:#8da6bc}",
    ".new{margin:15px;padding:12px;border:1px solid #168ed5;border-radius:11px;background:#0b2237;color:white;font-weight:bold}",
    ".search{margin:0 15px 10px;padding:10px;border:1px solid #20384f;border-radius:9px;background:#0b1c2c;color:white;outline:none}",
    ".history{flex:1;overflow:auto;padding:0 10px}",
    ".item{display:flex;gap:5px;padding:10px;border-radius:9px;color:#cbd9e6}",
    ".item:hover{background:#102a40}",
    ".name{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
    ".del{border:0;background:transparent;color:#718ba0}",
    ".info{padding:15px;border-top:1px solid #193047;color:#849caf;font-size:11px;line-height:1.6}",
    ".main{flex:1;min-width:0;display:flex;flex-direction:column}",
    ".top{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 15px;border-bottom:1px solid #193047}",
    ".title{font-weight:bold}.online{font-size:10px;color:#52d88b}",
    ".actions{display:flex;gap:6px}",
    ".icon,.tool{border:1px solid #20384f;border-radius:9px;background:#0b1c2c;color:white;padding:8px 10px}",
    ".chat{flex:1;overflow:auto;padding:20px 14px 170px}",
    ".inner{max-width:900px;margin:auto}",
    ".welcome{text-align:center;padding-top:15vh}",
    ".logo{width:70px;height:70px;margin:auto;border-radius:20px;background:linear-gradient(135deg,#0d77c7,#0bd6d6);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:21px}",
    ".welcome p{color:#8da5ba;line-height:1.6}",
    ".row{display:flex;margin:15px 0}",
    ".user{justify-content:flex-end}",
    ".msg{max-width:90%;padding:13px 15px;border-radius:16px;line-height:1.6;overflow-wrap:anywhere}",
    ".user .msg{background:#104a70;border:1px solid #1c6b9d}",
    ".ai .msg{background:#0c1d2d;border:1px solid #193047}",
    ".code{margin:10px 0;border:1px solid #20384f;border-radius:9px;overflow:auto;background:#050b12}",
    ".codebar{padding:6px 9px;border-bottom:1px solid #20384f;font-size:10px;color:#8da6bc}",
    ".code pre{margin:0;padding:12px;overflow:auto}",
    ".copy{float:right;border:1px solid #28435b;border-radius:6px;background:#10263a;color:white;font-size:10px;padding:4px 7px}",
    ".composer{position:fixed;left:270px;right:0;bottom:0;padding:10px 15px 13px;background:#07111f}",
    ".box{max-width:900px;margin:auto}",
    ".tools{display:flex;gap:5px;margin-bottom:6px;flex-wrap:wrap}",
    ".tool{font-size:11px;padding:6px 8px;color:#a9bed0}",
    ".input{display:flex;gap:7px;padding:8px;border:1px solid #25435c;border-radius:14px;background:#0a1a29}",
    "textarea{flex:1;min-height:42px;max-height:140px;resize:none;border:0;outline:0;background:transparent;color:white;padding:9px}",
    ".send{width:44px;border:0;border-radius:10px;background:#1179bd;color:white}",
    ".note{text-align:center;color:#61798e;font-size:9px;margin-top:5px}",
    ".panel{display:none;position:fixed;right:15px;top:75px;width:330px;max-width:calc(100% - 30px);z-index:20;padding:17px;border:1px solid #28435b;border-radius:14px;background:#0b1c2c}",
    ".panel.show{display:block}",
    ".setting{padding:12px 0;border-bottom:1px solid #193047}",
    ".setting button{margin-top:7px}",
    ".mobile{display:none}",
    "@media(max-width:800px){.side{position:fixed;left:-280px;top:0;bottom:0;z-index:30;transition:.2s}.side.open{left:0}.mobile{display:inline-block}.composer{left:0}.chat{padding-bottom:180px}}",
    "</style>",
    "</head>",
    "<body>",
    "<div class=\"app\">",
    "<aside class=\"side\" id=\"side\">",
    "<div class=\"brand\"><b>⚡ HPX AI</b><small>Powered by HPX LABS</small></div>",
    "<button class=\"new\" id=\"new\">＋ New Chat</button>",
    "<input class=\"search\" id=\"search\" placeholder=\"Search chats...\">",
    "<div class=\"history\" id=\"history\"></div>",
    "<div class=\"info\">HPX AI v1.0<br>Founder: Harshit Patel<br>HPX LABS</div>",
    "</aside>",
    "<main class=\"main\">",
    "<header class=\"top\">",
    "<div><button class=\"icon mobile\" id=\"menu\">☰</button> <span class=\"title\">HPX AI</span><div class=\"online\">● Online</div></div>",
    "<div class=\"actions\"><button class=\"icon\" id=\"topNew\">＋</button><button class=\"icon\" id=\"settings\">⚙</button></div>",
    "</header>",
    "<section class=\"chat\" id=\"chat\"><div class=\"inner\" id=\"inner\">",
    "<div class=\"welcome\" id=\"welcome\"><div class=\"logo\">HPX</div><h1>How can I help you?</h1><p>I am HPX AI, the official AI assistant of HPX LABS.</p></div>",
    "</div></section>",
    "<div class=\"composer\"><div class=\"box\">",
    "<div class=\"tools\"><button class=\"tool\" id=\"voice\">🎤 Voice</button><button class=\"tool\" id=\"calc\">🧮 Calculator</button><button class=\"tool\" id=\"export\">📥 Export</button></div>",
    "<div class=\"input\"><textarea id=\"input\" placeholder=\"Message HPX AI...\"></textarea><button class=\"send\" id=\"send\">➤</button></div>",
    "<div class=\"note\">HPX AI can make mistakes. Check important information.</div>",
    "</div></div>",
    "</main></div>",
    "<div class=\"panel\" id=\"panel\">",
    "<h3>⚙ HPX AI Settings</h3>",
    "<div class=\"setting\"><b>Appearance</b><br><button class=\"tool\" id=\"theme\">🌙 / ☀️ Toggle Theme</button></div>",
    "<div class=\"setting\"><b>🧠 Local Memory</b><br><button class=\"tool\" id=\"memory\">＋ Add Memory</button> <button class=\"tool\" id=\"clearMemory\">Clear</button></div>",
    "<div class=\"setting\"><b>💬 Chat Data</b><br><button class=\"tool\" id=\"clearHistory\">Delete All Chats</button></div>",
    "<div class=\"setting\"><b>ℹ About</b><br>HPX AI v1.0<br>Founder: Harshit Patel<br>HPX LABS</div>",
    "</div>",
    "<script>",
    "(function(){",
    "\"use strict\";",
    "var KEY=\"hpx_history_final\",MEM=\"hpx_memory_final\",THEME=\"hpx_theme_final\";",
    "var id=null,msgs=[];",
    "var side=document.getElementById(\"side\"),inner=document.getElementById(\"inner\"),input=document.getElementById(\"input\"),history=document.getElementById(\"history\"),search=document.getElementById(\"search\"),panel=document.getElementById(\"panel\"),send=document.getElementById(\"send\");",
    "function getHistory(){try{return JSON.parse(localStorage.getItem(KEY)||\"[]\")}catch(e){return[]}}",
    "function saveHistory(x){localStorage.setItem(KEY,JSON.stringify(x))}",
    "function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}",
    "function esc(x){return String(x).replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\").replace(/\\\"/g,\"&quot;\")}",
    "function format(x){",
    "var s=esc(x);",
    "var marker=String.fromCharCode(96)+String.fromCharCode(96)+String.fromCharCode(96);",
    "var p=s.split(marker),out=\"\";",
    "for(var i=0;i<p.length;i++){if(i%2===0){out+=p[i]}else{out+=\"<div class=\\\"code\\\"><div class=\\\"codebar\\\">Code <button class=\\\"copy\\\" data-code=\\\"\"+encodeURIComponent(p[i])+\"\\\">Copy</button></div><pre>\"+p[i]+\"</pre></div>\"}}",
    "s=out;",
    "s=s.replace(/\\n/g,\"<br>\");",
    "return s;",
    "}",
    "function render(){",
    "inner.innerHTML=\"\";",
    "if(!msgs.length){inner.innerHTML=\"<div class=\\\"welcome\\\"><div class=\\\"logo\\\">HPX</div><h1>How can I help you?</h1><p>I am HPX AI, the official AI assistant of HPX LABS.</p></div>\";return}",
    "msgs.forEach(function(m){var r=document.createElement(\"div\");r.className=\"row \"+(m.role===\"user\"?\"user\":\"ai\");var b=document.createElement(\"div\");b.className=\"msg\";b.innerHTML=format(m.content);r.appendChild(b);inner.appendChild(r)});",
    "document.getElementById(\"chat\").scrollTop=document.getElementById(\"chat\").scrollHeight;",
    "}",
    "function renderHistory(){",
    "var q=(search.value||\"\").toLowerCase();history.innerHTML=\"\";",
    "getHistory().sort(function(a,b){return b.updated-a.updated}).filter(function(x){return !q||x.title.toLowerCase().indexOf(q)>=0}).forEach(function(x){",
    "var r=document.createElement(\"div\");r.className=\"item\";var n=document.createElement(\"div\");n.className=\"name\";n.textContent=x.title;n.onclick=function(){openChat(x.id)};var d=document.createElement(\"button\");d.className=\"del\";d.textContent=\"×\";d.onclick=function(){deleteChat(x.id)};r.appendChild(n);r.appendChild(d);history.appendChild(r)});",
    "}",
    "function saveCurrent(){if(!id||!msgs.length)return;var all=getHistory();var first=msgs.find(function(x){return x.role===\"user\"});var title=first?first.content:\"New Chat\";title=title.replace(/\\s+/g,\" \").slice(0,60);var f=all.find(function(x){return x.id===id});if(f){f.messages=msgs;f.title=title;f.updated=Date.now()}else{all.push({id:id,title:title,messages:msgs,updated:Date.now()})}saveHistory(all);renderHistory()}",
    "function start(){id=newId();msgs=[];render();renderHistory()}",
    "function openChat(x){var f=getHistory().find(function(a){return a.id===x});if(!f)return;id=f.id;msgs=f.messages||[];render();renderHistory();side.classList.remove(\"open\")}",
    "function deleteChat(x){saveHistory(getHistory().filter(function(a){return a.id!==x}));if(id===x)start();else renderHistory()}",
    "async function sendMessage(){",
    "var text=input.value.trim();if(!text||send.disabled)return;",
    "if(!id)id=newId();msgs.push({role:\"user\",content:text});input.value=\"\";render();saveCurrent();send.disabled=true;",
    "try{",
    "var r=await fetch(\"/api/chat\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({messages:msgs,memory:localStorage.getItem(MEM)||\"\"})});",
    "var d=await r.json();if(!r.ok)throw new Error(d.error||\"Request failed\");",
    "msgs.push({role:\"assistant\",content:String(d.reply||\"No response\")});saveCurrent();render();",
    "}catch(e){msgs.push({role:\"assistant\",content:\"Sorry, something went wrong: \"+e.message});saveCurrent();render()}finally{send.disabled=false;input.focus()}",
    "}",
    "document.getElementById(\"new\").onclick=start;",
    "document.getElementById(\"topNew\").onclick=start;",
    "send.onclick=sendMessage;",
    "input.addEventListener(\"keydown\",function(e){if(e.key===\"Enter\"&&!e.shiftKey){e.preventDefault();sendMessage()}});",
    "search.oninput=renderHistory;",
    "document.getElementById(\"menu\").onclick=function(){side.classList.toggle(\"open\")};",
    "document.getElementById(\"settings\").onclick=function(){panel.classList.toggle(\"show\")};",
    "document.getElementById(\"theme\").onclick=function(){document.body.classList.toggle(\"light\");localStorage.setItem(THEME,document.body.classList.contains(\"light\")?\"light\":\"dark\")};",
    "document.getElementById(\"memory\").onclick=function(){var x=prompt(\"What should HPX AI remember?\",localStorage.getItem(MEM)||\"\");if(x!==null)localStorage.setItem(MEM,x.slice(0,4000))};",
    "document.getElementById(\"clearMemory\").onclick=function(){localStorage.removeItem(MEM);alert(\"Memory cleared\")};",
    "document.getElementById(\"clearHistory\").onclick=function(){if(confirm(\"Delete all chat history?\")){localStorage.removeItem(KEY);start()}};",
    "document.getElementById(\"calc\").onclick=function(){var x=prompt(\"Enter calculation, example: 25*4+10\");if(!x)return;if(!/^[0-9+\\-*/%().\\s]+$/.test(x)){alert(\"Only basic arithmetic is allowed\");return}try{alert(\"Result: \"+Function(\"return (\"+x+\")\")())}catch(e){alert(\"Invalid calculation\")}};",
    "document.getElementById(\"export\").onclick=function(){if(!msgs.length){alert(\"No chat to export\");return}var x=msgs.map(function(m){return(m.role===\"user\"?\"You\":\"HPX AI\")+\":\\n\"+m.content}).join(\"\\n\\n\");var b=new Blob([x],{type:\"text/plain\"});var a=document.createElement(\"a\");a.href=URL.createObjectURL(b);a.download=\"hpx-ai-chat.txt\";a.click()};",
    "document.getElementById(\"voice\").onclick=function(){var R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){alert(\"Voice input is not supported\");return}var r=new R();r.lang=\"hi-IN\";r.onresult=function(e){input.value+=(input.value?\" \":\"\")+e.results[0][0].transcript};r.start()};",
    "document.addEventListener(\"click\",function(e){if(e.target.classList.contains(\"copy\")){navigator.clipboard.writeText(decodeURIComponent(e.target.getAttribute(\"data-code\")||\"\"));e.target.textContent=\"Copied\"}});",
    "if(localStorage.getItem(THEME)===\"light\")document.body.classList.add(\"light\");",
    "start();",
    "})();",
    "</script>",
    "</body>",
    "</html>"
  ];

  return lines.join("\n");
          }
