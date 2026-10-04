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
          return json(
            {
              error: "OPENROUTER_API_KEY is not configured."
            },
            500
          );
        }

        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages.slice(-30)
          : [];

        if (!messages.length) {
          return json(
            {
              error: "No message provided."
            },
            400
          );
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
          return json(
            {
              error:
                data?.error?.message ||
                "OpenRouter request failed."
            },
            response.status
          );
        }

        return json({
          reply:
            data?.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response."
        });
      } catch (error) {
        return json(
          {
            error:
              error?.message ||
              "Server error."
          },
          500
        );
      }
    }

    // =========================
    // HPX AI FRONTEND
    // =========================

    const html = `<!DOCTYPE html>
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

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: Arial, sans-serif;
  background: #050914;
  color: white;
}

/* =========================
   APP
========================= */

.app {
  width: 100%;
  height: 100dvh;
  min-height: 100vh;
  display: flex;
}

/* =========================
   SIDEBAR
========================= */

.sidebar {
  width: 260px;
  height: 100%;
  flex-shrink: 0;
  background: #080d1c;
  border-right: 1px solid #17213b;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 25px;
  font-weight: bold;
  color: #19d9ff;
  margin-bottom: 22px;
}

.new {
  width: 100%;
  min-height: 46px;
  padding: 12px;
  border: 1px solid #19bde5;
  border-radius: 10px;
  background: #0c172b;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.new:active {
  transform: scale(0.98);
}

.history-title {
  margin-top: 25px;
  color: #8995ad;
  font-size: 13px;
}

.history-list {
  margin-top: 10px;
  overflow-y: auto;
  flex: 1;
}

.history-item {
  padding: 11px;
  margin-bottom: 5px;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item:hover {
  background: #111c31;
}

.history-empty {
  color: #59657b;
  font-size: 12px;
  padding: 10px 4px;
}

/* =========================
   MAIN
========================= */

.main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* =========================
   TOP BAR
========================= */

.top {
  height: 62px;
  min-height: 62px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #17213b;
}

.top-title {
  font-size: 16px;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.online {
  color: #55e6a7;
  font-size: 13px;
}

.settings-btn {
  border: 1px solid #20304e;
  background: #0d1527;
  color: white;
  border-radius: 8px;
  padding: 8px 11px;
  cursor: pointer;
  font-size: 16px;
}

/* =========================
   CHAT
========================= */

.chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 25px 15px 20px;
  -webkit-overflow-scrolling: touch;
}

.welcome {
  text-align: center;
  margin-top: 14vh;
  padding: 0 15px;
}

.welcome h1 {
  font-size: 45px;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #19d9ff, #7b61ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome p {
  color: #8995ad;
}

/* =========================
   MESSAGES
========================= */

.msg {
  max-width: 850px;
  margin: 0 auto 15px;
  display: flex;
}

.msg.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 80%;
  padding: 12px 15px;
  border-radius: 14px;
  white-space: pre-wrap;
  line-height: 1.5;
  word-break: break-word;
}

.user .bubble {
  background: #12688a;
}

.assistant .bubble {
  background: #10182a;
  border: 1px solid #1b2945;
}

/* =========================
   INPUT AREA
========================= */

.input-area {
  flex-shrink: 0;
  width: 100%;
  padding: 10px 15px calc(15px + env(safe-area-inset-bottom));
  background: #050914;
  border-top: 1px solid #17213b;
}

.input {
  width: 100%;
  max-width: 850px;
  min-height: 58px;
  margin: auto;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #0d1527;
  border: 1px solid #2a3b5d;
  border-radius: 15px;
  padding: 7px;
  box-shadow: 0 4px 20px #0005;
}

textarea {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  max
