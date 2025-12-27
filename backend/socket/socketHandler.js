import GameSession from "../models/GameSession.js";

// Track disconnect timeouts globally
const disconnectTimeouts = new Map(); // key: `${code}:${nickname}`, value: timeoutId

// Store user socket connections for notifications
const userSockets = new Map(); // key: userId, value: socketId

// Make userSockets globally accessible (for backward compatibility)
global.userSockets = userSockets;

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register user for notifications (prevent duplicates)
    socket.on("register-user", (userId) => {
      // Remove old socket connection for this user if exists
      const oldSocketId = userSockets.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket && oldSocket.userId === userId) {
          oldSocket.userId = null; // Clear old socket's userId
        }
      }

      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered for notifications`);
    });

    // Unregister user on disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Only delete if this socket is still the active one for the user
        if (userSockets.get(socket.userId) === socket.id) {
          userSockets.delete(socket.userId);
          console.log(`User ${socket.userId} unregistered from notifications`);
        }
      }
      console.log("User disconnected:", socket.id);
    });

    socket.on("join-game", ({ code, nickname }) => {
      socket.join(code);

      // Cancel any pending disconnect timeout for this user
      const key = `${code}:${nickname}`;
      if (disconnectTimeouts.has(key)) {
        console.log(
          `[SOCKET] Cancelled disconnect timeout for ${nickname} in ${code}`
        );
        clearTimeout(disconnectTimeouts.get(key));
        disconnectTimeouts.delete(key);
      }

      // Store session info for disconnect handling
      socket.data.session = { code, nickname };

      io.to(code).emit("player-joined", { nickname, socketId: socket.id });
      console.log(`${nickname} joined game ${code}`);
    });

    socket.on("start-game", ({ code }) => {
      io.to(code).emit("game-started", { code });
      console.log(`Game ${code} started`);
    });

    socket.on("entry-submitted", ({ code, nickname, round }) => {
      io.to(code).emit("player-submitted", { nickname, round });
      console.log(
        `${nickname} submitted entry for round ${round} in game ${code}`
      );
    });

    socket.on("submit-drawing", ({ code, drawing, round }) => {
      socket
        .to(code)
        .emit("drawing-submitted", { drawing, round, socketId: socket.id });
    });

    socket.on("submit-prompt", ({ code, prompt, round, nickname }) => {
      io.to(code).emit("prompt-submitted", {
        prompt,
        round,
        nickname,
        socketId: socket.id,
      });
    });

    socket.on("next-round", ({ code, round }) => {
      io.to(code).emit("next-round", { code, round });
    });

    socket.on("end-game", ({ code }) => {
      io.to(code).emit("game-ended", { code });
    });

    socket.on("reveal-step", ({ code, chainIndex, stepIndex }) => {
      socket.to(code).emit("reveal-next", { chainIndex, stepIndex });
      console.log(
        `Reveal step for game ${code}: chain ${chainIndex}, step ${stepIndex}`
      );
    });

    socket.on("reveal-reset", ({ code }) => {
      socket.to(code).emit("reveal-reset");
      console.log(`Reveal reset for game ${code}`);
    });

    socket.on("leave-game", ({ code, nickname }) => {
      socket.leave(code);

      // Clear session data so disconnect handler doesn't trigger
      socket.data.session = null;

      io.to(code).emit("player-left", { nickname, socketId: socket.id });
      console.log(`${nickname} left game ${code}`);
    });

    // --- Jam Session Handlers ---
    socket.on("jam-draw-stroke", ({ code, stroke }) => {
      // Broadcast to everyone else in the room
      socket.to(code).emit("jam-draw-stroke", { stroke, socketId: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      if (socket.data.session) {
        const { code, nickname } = socket.data.session;
        const key = `${code}:${nickname}`;

        console.log(
          `[SOCKET] Scheduling disconnect timeout for ${nickname} in ${code}`
        );

        // Set a timeout to remove the player (e.g., 60 seconds for testing/quick reconnects)
        const timeoutId = setTimeout(async () => {
          try {
            console.log(
              `[SOCKET] Executing disconnect timeout for ${nickname} in ${code}`
            );
            const gameSession = await GameSession.findOne({ code });

            if (!gameSession) return;

            if (gameSession.status === "waiting") {
              // Only remove if in lobby
              const initialCount = gameSession.players.length;
              gameSession.players = gameSession.players.filter(
                (p) => p.nickname !== nickname
              );

              if (gameSession.players.length !== initialCount) {
                // If no players left, delete game
                if (gameSession.players.length === 0) {
                  await GameSession.deleteOne({ _id: gameSession._id });
                  console.log(`[SOCKET] Game ${code} deleted (empty)`);
                } else {
                  // If host left, reassign
                  if (gameSession.hostId === nickname) {
                    gameSession.hostId = gameSession.players[0].nickname;
                  }
                  await gameSession.save();
                  io.to(code).emit("player-left", { nickname });
                  console.log(
                    `[SOCKET] Removed ${nickname} from lobby ${code}`
                  );
                }
              }
            } else if (gameSession.status === "in-progress") {
              // Mark as left if in game
              const player = gameSession.players.find(
                (p) => p.nickname === nickname
              );
              if (player && !player.isLeft) {
                player.isLeft = true;
                await gameSession.save();
                io.to(code).emit("player-left", { nickname });
                console.log(
                  `[SOCKET] Marked ${nickname} as left in game ${code}`
                );
              }
            }

            disconnectTimeouts.delete(key);
          } catch (err) {
            console.error("Error handling disconnect timeout:", err);
          }
        }, 60000); // 60 seconds timeout

        disconnectTimeouts.set(key, timeoutId);
      }
    });
  });
};
