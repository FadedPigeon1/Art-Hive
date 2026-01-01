import client from "./client";

export const reactionsAPI = {
  likePost: (id) => client.put(`/api/reactions/posts/${id}/like`),
  unlikePost: (id) => client.put(`/api/reactions/posts/${id}/unlike`),
  starPost: (id) => client.put(`/api/reactions/posts/${id}/star`),
  unstarPost: (id) => client.put(`/api/reactions/posts/${id}/unstar`),
  getStarredPosts: (page = 1, limit = 20) =>
    client.get(`/api/reactions/posts/starred?page=${page}&limit=${limit}`),
  getLikedPosts: (page = 1, limit = 20) =>
    client.get(`/api/reactions/posts/liked?page=${page}&limit=${limit}`),
};
