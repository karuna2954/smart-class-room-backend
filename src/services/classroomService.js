
import SensorReading from "../models/SensorReading.js";

const classroomState = {
  temperature: 28,
  humidity: 60,
  motionDetected: false,
  lightLevel: 650,
  gasLevel: 120,
  gasAlert: false,

  leds: {
    led1: false,
    led2: false,
    led3: false,
    led4: false,
    led5: false,
    alertLed: false,
  },

  updatedAt: new Date().toISOString(),
};

const controllableLeds = [
  "led1", "led2", "led3", "led4", "led5",
];

function snapshot() {
  return {
    ...classroomState,
    leds: { ...classroomState.leds },
  };
}

async function saveState(redisClient, io, saveHistory = false) {
  classroomState.updatedAt = new Date().toISOString();

  const state = snapshot();

  // Redis: store the latest classroom state.
  await redisClient.set("classroom:state", JSON.stringify(state));

  // Socket.IO: broadcast the state to connected clients.
  io.emit("classroom:state", state);
  io.emit("sensor:update", state);

  // MongoDB: save historical readings when requested.
  if (saveHistory) {
    const {
      temperature,
      humidity,
      motionDetected,
      lightLevel,
      gasLevel,
      gasAlert,
      leds,
    } = state;

    await SensorReading.create({
      temperature,
      humidity,
      motionDetected,
      lightLevel,
      gasLevel,
      gasAlert,
      leds,
    });
  }
}

export function startClassroomService(io, redisClient) {
  io.on("connection", async (socket) => {
    try {
      // Read the latest state from Redis.
      const cached = await redisClient.get("classroom:state");

      socket.emit(
        "classroom:state",
        cached ? JSON.parse(cached) : snapshot()
      );
    } catch (error) {
      console.error("Could not load classroom state:", error.message);
      socket.emit("classroom:state", snapshot());
    }

    socket.on("led:control", async (command, acknowledge) => {
      const reply =
        typeof acknowledge === "function" ? acknowledge : () => {};

      if (!command || typeof command.state !== "boolean") {
        return reply({
          success: false,
          message: "state must be true or false.",
        });
      }

      if (command.all === true) {
        for (const led of controllableLeds) {
          classroomState.leds[led] = command.state;
        }
      } else if (controllableLeds.includes(command.led)) {
        classroomState.leds[command.led] = command.state;
      } else {
        return reply({
          success: false,
          message: "Use led1, led2, led3, led4, or led5.",
        });
      }

      try {
        await saveState(redisClient, io);

        reply({
          success: true,
          message: "LED state updated.",
          leds: snapshot().leds,
        });
      } catch (error) {
        console.error("Could not save LED state:", error.message);

        reply({
          success: false,
          message: "Could not save the updated state.",
        });
      }
    });
  });

  // Simulated sensor readings every three seconds.
  setInterval(async () => {
    classroomState.temperature = Number(
      (26 + Math.random() * 6).toFixed(1)
    );

    classroomState.humidity = Math.round(
      45 + Math.random() * 30
    );

    classroomState.motionDetected = Math.random() > 0.7;
    classroomState.lightLevel = Math.round(Math.random() * 1000);
    classroomState.gasLevel = Math.round(80 + Math.random() * 120);

    // Example simulation threshold, not a safety-certified alarm.
    classroomState.gasAlert = classroomState.gasLevel > 170;
    classroomState.leds.alertLed = classroomState.gasAlert;

    try {
      await saveState(redisClient, io, true);
    } catch (error) {
      console.error("Could not save classroom data:", error.message);
    }
  }, 3000);

  console.log("Classroom service connected to Redis and MongoDB.");
}

export async function getCurrentClassroomState() {
  // The Redis client will be supplied by the backend.
  if (!globalThis.classroomRedisClient) {
    throw new Error("Redis client is not initialized.");
  }

  const cached = await globalThis.classroomRedisClient.get(
    "classroom:state"
  );

  if (!cached) {
    return null;
  }

  return JSON.parse(cached);
}
