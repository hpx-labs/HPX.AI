export function createChat(title = "New Chat") {
  return {
    id: Date.now().toString(),
    title,
    messages: [],
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function addMessage(chat, role, content) {
  chat.messages.push({
    role,
    content,
    timestamp: Date.now()
  });

  chat.updatedAt = Date.now();

  return chat;
}

export function renameChat(chat, title) {
  chat.title = title || "New Chat";
  chat.updatedAt = Date.now();

  return chat;
}

export function deleteChat(chats, id) {
  return chats.filter(chat => chat.id !== id);
}

export function togglePin(chat) {
  chat.pinned = !chat.pinned;
  chat.updatedAt = Date.now();

  return chat;
    }
