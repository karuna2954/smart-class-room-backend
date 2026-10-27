
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to classroom backend.");

  // Turn LED 1 ON.
  socket.emit(
    "led:control",
    { led: "led1", state: true },
    (response) => {
      console.log("LED 1 response:", response);

      // Turn all five ordinary LEDs ON.
      socket.emit(
        "led:control",
        { all: true, state: true },
        (allResponse) => {
          console.log("All LEDs response:", allResponse);

          // Turn LED 3 OFF.
          socket.emit(
            "led:control",
            { led: "led3", state: false },
            (led3Response) => {
              console.log("LED 3 response:", led3Response);
              socket.disconnect();
            }
          );
        }
      );
    }
  );
});

socket.on("classroom:state", (state) => {
  console.log("Classroom state:", state.leds);
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});
