
import mongoose from "mongoose";
import { createClient } from "redis";

let redisClient;

export async function connectDatabases() {
  // Connect to MongoDB
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully.");

  // Connect to Redis
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is missing from .env");
  }

  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  await redisClient.connect();
  console.log("Redis connected successfully.");

  return { redisClient };
}
