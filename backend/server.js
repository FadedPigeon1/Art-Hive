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

// Socket.IO game logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-game", ({ code, nickname }) => {
    socket.join(code);
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

  socket.on("leave-game", ({ code, nickname }) => {
    socket.leave(code);
    io.to(code).emit("player-left", { nickname, socketId: socket.id });
    console.log(`${nickname} left game ${code}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
