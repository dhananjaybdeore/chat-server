const WebSocket = require("ws");
const chatController = require("../controllers/chatController");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    chatController.handleConnection(ws, wss);
  });

  console.log("✅ WebSocket server is running...");
}

module.exports = setupWebSocket;
