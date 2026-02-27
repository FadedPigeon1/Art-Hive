import client from "./client";

export const collectionsAPI = {
  getMyCollections: () => client.get("/api/collections/my"),

  getUserCollections: (userId, page = 1, limit = 20) =>
    client.get(`/api/collections/user/${userId}?page=${page}&limit=${limit}`),

  getCollectionById: (id, page = 1, limit = 12) =>
    client.get(`/api/collections/${id}?page=${page}&limit=${limit}`),

  create: (data) => client.post("/api/collections", data),

  update: (id, data) => client.put(`/api/collections/${id}`, data),

  delete: (id) => client.delete(`/api/collections/${id}`),

  addPost: (collectionId, postId) =>
    client.put(`/api/collections/${collectionId}/posts/${postId}`),

  removePost: (collectionId, postId) =>
    client.delete(`/api/collections/${collectionId}/posts/${postId}`),
};
