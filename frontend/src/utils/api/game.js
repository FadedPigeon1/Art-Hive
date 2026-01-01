import client from "./client";

export const gameAPI = {
  createGame: (nickname, totalRounds, maxPlayers, gameMode) =>
    client.post("/api/game/create", {
      nickname,
      totalRounds,
      maxPlayers,
      gameMode,
    }),
  joinGame: (code, nickname, userId) =>
    client.post("/api/game/join", { code, nickname, userId }),
  getGame: (code) => client.get(`/api/game/${code}`),
  startGame: (code) => client.post(`/api/game/${code}/start`),
  getPlayerTask: (code, nickname) =>
    client.get(`/api/game/${code}/task/${nickname}`),
  submitEntry: (code, data) =>
    client.post(`/api/game/${code}/submit-entry`, data),
  submitDrawing: (code, data) => client.post(`/api/game/${code}/submit`, data),
  endGame: (code) => client.post(`/api/game/${code}/end`),
  leaveGame: (code, nickname) =>
    client.post(`/api/game/${code}/leave`, { nickname }),
  getResults: (code) => client.get(`/api/game/${code}/results`),
};
