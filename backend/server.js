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
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import reactionRoutes from "./routes/reactionRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { initializeSocket } from "./socket/socketHandler.js";
import { startCleanupTask } from "./utils/scheduler.js";

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/reactions", reactionRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Make io globally accessible
global.io = io;

// Initialize modules
initializeSocket(io);
startCleanupTask();

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
