export function exportTXT(chat) {
  if (!chat) return "";

  let text = "HPX AI CHAT\n";
  text += "====================\n\n";

  for (const message of chat.messages || []) {
    const role = message.role === "user" ? "You" : "HPX AI";

    text += role + ":\n";
    text += (message.content || "") + "\n\n";
  }

  return text;
}

export function exportJSON(chat) {
  return JSON.stringify(chat, null, 2);
}

export function exportHTML(chat) {
  if (!chat) return "";

  let html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<title>HPX AI Chat</title>";
  html += "</head><body>";
  html += "<h1>HPX AI Chat</h1>";

  for (const message of chat.messages || []) {
    const role = message.role === "user" ? "You" : "HPX AI";

    html += "<h3>" + role + "</h3>";
    html += "<p>" + escapeHTML(message.content || "") + "</p>";
  }

  html += "</body></html>";

  return html;
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
    }
