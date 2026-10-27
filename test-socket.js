
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("classroom:state", (state) => {
  console.log("\nInitial classroom state:");
  console.log(JSON.stringify(state, null, 2));
});

socket.on("sensor:update", (state) => {
  console.log("\nLive sensor update:");
  console.log(
    "Temperature:", state.temperature, "°C",
    "| Humidity:", state.humidity, "%",
    "| Motion:", state.motionDetected,
    "| Light:", state.lightLevel,
    "| Gas:", state.gasLevel
  );
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});
