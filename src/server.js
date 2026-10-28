
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import sensorRoutes from "./routes/sensorRoutes.js";
import { connectDatabases } from "./config/db.js";
import { startClassroomService } from "./services/classroomService.js";
import ledRoutes from "./routes/ledRoutes.js";
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
// app.use("/api/sensors", sensorRoutes);
// Socket.IO server
app.use("/api/sensors", sensorRoutes);
app.use("/api/leds", ledRoutes);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Basic API route
app.get("/", (req, res) => {
  res.json({
    message: "Smart Classroom Backend is running!",
  });
});

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smart-classroom-backend",
    socketIO: "enabled",
  });
});

// General Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("server:welcome", {
    message: "Connected to Smart Classroom backend!",
    socketId: socket.id,
    time: new Date().toISOString(),
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id}`, reason);
  });
});

// Start databases first, then the classroom service and server.
async function startServer() {
  globalThis.classroomIO = io;
  try {
    const { redisClient } = await connectDatabases();
    globalThis.classroomRedisClient = redisClient;
    startClassroomService(io, redisClient);

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
