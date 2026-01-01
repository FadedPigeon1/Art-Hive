import client from "./client";

export const notificationsAPI = {
  getAll: () => client.get("/api/notifications").then((res) => res.data),
  getUnreadCount: () =>
    client.get("/api/notifications/unread-count").then((res) => res.data),
  markAsRead: (id) =>
    client.put(`/api/notifications/${id}/read`).then((res) => res.data),
  markAllAsRead: () =>
    client.put("/api/notifications/read-all").then((res) => res.data),
  delete: (id) =>
    client.delete(`/api/notifications/${id}`).then((res) => res.data),
};
