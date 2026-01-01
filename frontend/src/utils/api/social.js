import client from "./client";

export const socialAPI = {
  followUser: (userId) => client.put(`/api/social/follow/${userId}`),
  unfollowUser: (userId) => client.put(`/api/social/unfollow/${userId}`),
  getSuggestedUsers: () => client.get("/api/social/suggested"),
};
