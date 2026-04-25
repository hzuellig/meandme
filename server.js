const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Optional: eigene Routen für die beiden Clients
app.get("/mobile", (req, res) => {
  res.sendFile(process.cwd() + "/public/mobile.html");
});

app.get("/desktop", (req, res) => {
  res.sendFile(process.cwd() + "/public/desktop.html");
});

io.on("connection", (socket) => {
  console.log("Client connected");

 /* socket.on("sensorData", (data) => {
    // Broadcast to all other clients
    //console.log(data);
    socket.broadcast.emit("sensorData", data);
  });*/

  socket.on("cameraFrame", (payload) => {
    if (!payload || typeof payload.imageData !== "string") {
      return;
    }

    // Relay camera frame to all other connected clients.
    socket.broadcast.emit("cameraFrame", {
      role: typeof payload.role === "string" ? payload.role : "unknown",
      imageData: payload.imageData,
      timestamp: payload.timestamp || Date.now(),
      w: Number.isFinite(payload.w) ? payload.w : null,
      h: Number.isFinite(payload.h) ? payload.h : null,
      sc: Number.isFinite(payload.sc) ? payload.sc : null
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});