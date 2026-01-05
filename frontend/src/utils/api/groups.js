import client from "./client";

export const groupsAPI = {
  getAll: (params) =>
    client.get("/api/groups", { params }).then((res) => res.data),
  create: (data) => client.post("/api/groups", data).then((res) => res.data),
  update: (id, data) =>
    client.put(`/api/groups/${id}`, data).then((res) => res.data),
  getById: (id) => client.get(`/api/groups/${id}`).then((res) => res.data),
  join: (id) => client.put(`/api/groups/${id}/join`).then((res) => res.data),
  leave: (id) => client.put(`/api/groups/${id}/leave`).then((res) => res.data),
  getPosts: (id) =>
    client.get(`/api/groups/${id}/posts`).then((res) => res.data),
};
