import client from "./client";

export const messagesAPI = {
  getConversations: () =>
    client.get("/api/messages/conversations").then((res) => res.data),
  getOrCreateConversation: (userId) =>
    client
      .post("/api/messages/conversations", { userId })
      .then((res) => res.data),
  getMessages: (conversationId, limit = 50, before = null) =>
    client
      .get(`/api/messages/${conversationId}`, { params: { limit, before } })
      .then((res) => res.data),
  sendMessage: (conversationId, text) =>
    client
      .post(`/api/messages/${conversationId}`, { text })
      .then((res) => res.data),
  deleteConversation: (conversationId) =>
    client
      .delete(`/api/messages/conversations/${conversationId}`)
      .then((res) => res.data),
  getUnreadCount: () =>
    client.get("/api/messages/unread-count").then((res) => res.data),
};
