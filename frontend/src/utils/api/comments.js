import client from "./client";

export const commentsAPI = {
  getCommentsByPost: (postId) => client.get(`/api/comments/${postId}`),
  createComment: (postId, text) =>
    client.post("/api/comments", { postId, text }),
  deleteComment: (id) => client.delete(`/api/comments/${id}`),
};
