import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import GameSession from "./models/GameSession.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time game features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Make io accessible to routes
app.set("io", io);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ArtHive API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/game", gameRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Track disconnect timeouts globally
const disconnectTimeouts = new Map(); // key: `${code}:${nickname}`, value: timeoutId

// Socket.IO game logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.data.session) {
      const { code, nickname } = socket.data.session;
      const key = `${code}:${nickname}`;

      console.log(
        `[SOCKET] Scheduling disconnect timeout for ${nickname} in ${code}`
      );

      // Set a timeout to remove the player (e.g., 10 seconds for testing/quick reconnects)
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
                console.log(`[SOCKET] Removed ${nickname} from lobby ${code}`);
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
      }, 10000); // 10 seconds timeout

      disconnectTimeouts.set(key, timeoutId);
    }
  });
});

// Cleanup stale games periodically (every hour)
setInterval(async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await GameSession.deleteMany({
      updatedAt: { $lt: oneDayAgo },
    });
    if (result.deletedCount > 0) {
      console.log(
        `[CLEANUP] Deleted ${result.deletedCount} stale game sessions.`
      );
    }
  } catch (err) {
    console.error("[CLEANUP] Error cleaning up stale games:", err);
  }
}, 60 * 60 * 1000); // Run every hour

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
