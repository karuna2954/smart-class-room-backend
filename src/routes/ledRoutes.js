import express from "express";

const router = express.Router();
const LED_KEY = "classroom:ledCommands";

const DEFAULT_STATE = {
  led1: false,
  led2: false,
};

function getRedis() {
  return globalThis.classroomRedisClient;
}

// Frontend: GET /api/leds/commands
// ESP32:    GET /api/leds/commands
router.get("/commands", async (req, res) => {
  try {
    const redis = getRedis();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis is unavailable",
      });
    }

    const saved = await redis.get(LED_KEY);
    const state = saved
      ? { ...DEFAULT_STATE, ...JSON.parse(saved) }
      : DEFAULT_STATE;

    res.json({ success: true, data: state });
  } catch (error) {
    console.error("Failed to read LED state:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to read LED state",
    });
  }
});

// Frontend: POST /api/leds/commands
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

    const saved = await redis.get(LED_KEY);
    const current = saved
      ? { ...DEFAULT_STATE, ...JSON.parse(saved) }
      : { ...DEFAULT_STATE };

    current[led] = state;

    await redis.set(LED_KEY, JSON.stringify(current));

    console.log(`${led} set to ${state ? "ON" : "OFF"}`);

    res.json({
      success: true,
      message: `${led} updated`,
      data: current,
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