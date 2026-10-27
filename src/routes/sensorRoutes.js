
import express from "express";
import SensorReading from "../models/SensorReading.js";
import { getCurrentClassroomState } from "../services/classroomService.js";

const router = express.Router();

// GET /api/sensors/current
router.get("/current", async (req, res) => {
  try {
    const state = await getCurrentClassroomState();

    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Failed to fetch current state:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch current classroom state.",
    });
  }
});

// GET /api/sensors/history?limit=50
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      500
    );

    const readings = await SensorReading.find()
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("Failed to fetch sensor history:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch sensor history.",
    });
  }
});

export default router;
