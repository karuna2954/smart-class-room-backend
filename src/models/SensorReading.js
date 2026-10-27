
import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  motionDetected: Boolean,
  lightLevel: Number,
  gasLevel: Number,
  gasAlert: Boolean,

  leds: {
    led1: Boolean,
    led2: Boolean,
    led3: Boolean,
    led4: Boolean,
    led5: Boolean,
    alertLed: Boolean,
  },

  recordedAt: {
    type: Date,
    default: Date.now,
  },
});

sensorReadingSchema.index({ recordedAt: -1 });

const SensorReading = mongoose.model(
  "SensorReading",
  sensorReadingSchema
);

export default SensorReading;
