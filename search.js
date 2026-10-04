export function searchChats(chats, query) {
  if (!query) return chats;

  const q = query.toLowerCase().trim();

  return chats.filter(chat => {
    const titleMatch = (chat.title || "").toLowerCase().includes(q);

    const messageMatch = (chat.messages || []).some(message =>
      (message.content || "").toLowerCase().includes(q)
    );

    return titleMatch || messageMatch;
  });
}

export function searchMessages(messages, query) {
  if (!query) return messages;

  const q = query.toLowerCase().trim();

  return messages.filter(message =>
    (message.content || "").toLowerCase().includes(q)
  );
}
