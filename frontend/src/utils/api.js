import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Configure axios
axios.defaults.baseURL = API_URL;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    axios.post("/api/auth/login", { email, password }),
  register: (username, email, password) =>
    axios.post("/api/auth/register", { username, email, password }),
  getMe: () => axios.get("/api/auth/me"),
  updateProfile: (data) => axios.put("/api/auth/profile", data),
  followUser: (userId) => axios.put(`/api/auth/follow/${userId}`),
  unfollowUser: (userId) => axios.put(`/api/auth/unfollow/${userId}`),
  getSuggestedUsers: () => axios.get("/api/auth/suggested"),
};

// Posts API
export const postsAPI = {
  getAllPosts: (page = 1, limit = 20, q = "") =>
    axios.get(
      `/api/posts?page=${page}&limit=${limit}${
        q && q.length ? `&q=${encodeURIComponent(q)}` : ""
      }`
    ),
  getStarredPosts: (page = 1, limit = 20) =>
    axios.get(`/api/posts/starred?page=${page}&limit=${limit}`),
  getPostById: (id) => axios.get(`/api/posts/${id}`),
  getUserPosts: (userId, page = 1, limit = 9) =>
    axios.get(`/api/posts/user/${userId}?page=${page}&limit=${limit}`),
  createPost: (postData) => axios.post("/api/posts", postData),
  updatePost: (id, postData) => axios.put(`/api/posts/${id}`, postData),
  deletePost: (id) => axios.delete(`/api/posts/${id}`),
  likePost: (id) => axios.put(`/api/posts/${id}/like`),
  unlikePost: (id) => axios.put(`/api/posts/${id}/unlike`),
  starPost: (id) => axios.put(`/api/posts/${id}/star`),
  unstarPost: (id) => axios.put(`/api/posts/${id}/unstar`),
  getPostRemixes: (id) => axios.get(`/api/posts/${id}/remixes`),
};

// Comments API
export const commentsAPI = {
  getCommentsByPost: (postId) => axios.get(`/api/comments/${postId}`),
  createComment: (postId, text) =>
    axios.post("/api/comments", { postId, text }),
  deleteComment: (id) => axios.delete(`/api/comments/${id}`),
};

// Game API
export const gameAPI = {
  createGame: (nickname, totalRounds) =>
    axios.post("/api/game/create", { nickname, totalRounds }),
  joinGame: (code, nickname, userId) =>
    axios.post("/api/game/join", { code, nickname, userId }),
  getGame: (code) => axios.get(`/api/game/${code}`),
  startGame: (code) => axios.post(`/api/game/${code}/start`),
  getPlayerTask: (code, nickname) =>
    axios.get(`/api/game/${code}/task/${nickname}`),
  submitEntry: (code, data) =>
    axios.post(`/api/game/${code}/submit-entry`, data),
  submitDrawing: (code, data) => axios.post(`/api/game/${code}/submit`, data),
  endGame: (code) => axios.post(`/api/game/${code}/end`),
  leaveGame: (code, nickname) =>
    axios.post(`/api/game/${code}/leave`, { nickname }),
  getResults: (code) => axios.get(`/api/game/${code}/results`),
};

export default {
  authAPI,
  postsAPI,
  commentsAPI,
  gameAPI,
};
