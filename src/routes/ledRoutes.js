
import express from "express";

const router = express.Router();

const DEFAULT_STATE = {
  temperature: null,
  humidity: null,
  motionDetected: false,
  lightLevel: null,
  gasLevel: null,
  gasAlert: false,
  leds: {
    led1: false,
    led2: false,
    led3: false,
    led4: false,
    led5: false,
    alertLed: false,
  },
};

function getRedis() {
  return globalThis.classroomRedisClient;
}

// GET /api/leds/commands
router.get("/commands", async (req, res) => {
  try {
    const redis = getRedis();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis is unavailable",
      });
    }

    const saved = await redis.get("classroom:state");
    const classroom = saved ? JSON.parse(saved) : DEFAULT_STATE;

    res.json({
      success: true,
      data: {
        led1: Boolean(classroom.leds?.led1),
        led2: Boolean(classroom.leds?.led2),
      },
    });
  } catch (error) {
    console.error("Failed to read LED state:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to read LED state",
    });
  }
});

// POST /api/leds/commands
router.post("/commands", async (req, res) => {
  try {
    const { led, state } = req.body || {};

    if (!["led1", "led2"].includes(led) ||
        typeof state !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Expected led1/led2 and a boolean state",
      });
    }

    const redis = getRedis();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis is unavailable",
      });
    }

    const saved = await redis.get("classroom:state");
    const classroom = saved
      ? JSON.parse(saved)
      : { ...DEFAULT_STATE, leds: { ...DEFAULT_STATE.leds } };

    classroom.leds = {
      ...DEFAULT_STATE.leds,
      ...(classroom.leds || {}),
      [led]: state,
    };

    classroom.updatedAt = new Date().toISOString();

    await redis.set("classroom:state", JSON.stringify(classroom));

    console.log(`${led} set to ${state ? "ON" : "OFF"}`);

    res.json({
      success: true,
      message: `${led} updated`,
      data: {
        led1: Boolean(classroom.leds.led1),
        led2: Boolean(classroom.leds.led2),
      },
    });
  } catch (error) {
    console.error("Failed to update LED state:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update LED state",
    });
  }
});

export default router;
