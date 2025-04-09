require("dotenv").config();
const express = require("express");
const http = require("http");
const setupWebSocket = require("./config/websocketConfig");

const app = express();
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
