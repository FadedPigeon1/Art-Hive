import client from "./client";

export const authAPI = {
  login: (email, password) =>
    client.post("/api/auth/login", { email, password }),
  register: (username, email, password) =>
    client.post("/api/auth/register", { username, email, password }),
  getMe: () => client.get("/api/auth/me"),
  updateProfile: (data) => client.put("/api/auth/profile", data),
  updatePassword: (data) => client.put("/api/auth/password", data),
};
