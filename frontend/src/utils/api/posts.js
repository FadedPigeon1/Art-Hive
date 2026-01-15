import client from "./client";

export const postsAPI = {
  getAllPosts: (page = 1, limit = 20, q = "", sort = "") =>
    client.get(
      `/api/posts?page=${page}&limit=${limit}${
        q && q.length ? `&q=${encodeURIComponent(q)}` : ""
      }${sort ? `&sort=${sort}` : ""}`
    ),
  getPostById: (id) => client.get(`/api/posts/${id}`),
  getUserPosts: (userId, page = 1, limit = 9) =>
    client.get(`/api/posts/user/${userId}?page=${page}&limit=${limit}`),
  createPost: (postData) => client.post("/api/posts", postData),
  updatePost: (id, postData) => client.put(`/api/posts/${id}`, postData),
  deletePost: (id) => client.delete(`/api/posts/${id}`),
  likePost: (id) => client.put(`/api/reactions/posts/${id}/like`),
  unlikePost: (id) => client.put(`/api/reactions/posts/${id}/unlike`),
  starPost: (id) => client.put(`/api/reactions/posts/${id}/star`),
  unstarPost: (id) => client.put(`/api/reactions/posts/${id}/unstar`),
  getPostRemixes: (id) => client.get(`/api/posts/${id}/remixes`),
};
