const chatService = require("../services/chatService");

const waitingUsers = new Set(); // Users waiting for a match
const activeChats = new Map(); // Active chat pairs (userId -> ws)
const userConnections = new Map(); // Map of userId to WebSocket connection

function logWaitingUsers() {
  const users = Array.from(waitingUsers).map((ws) => ws.userId);
  console.log("Current waiting users:", users);
}
function isValidMessage(data) {
  if (!data.type) return false;

  switch (data.type) {
    case "JOIN_CHAT":
      return (
        data.userId &&
        typeof data.userId === "string" &&
        data.userName &&
        typeof data.userName === "string"
      );
    case "SEND_MESSAGE":
      return data.message && typeof data.message === "string";
    case "DISCONNECT":
      return true;
    case "TYPING":
      return true;
    default:
      return false;
  }
}

function handleConnection(ws, wss) {
  console.log("🔵 New user connected");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid JSON format." })
      );
      return;
    }

    if (!isValidMessage(data)) {
      console.log("invalid message");
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid message format." })
      );
      return;
    }

    switch (data.type) {
      case "JOIN_CHAT":
        addUser(ws, data.userId, data.userName);
        break;
      case "DISCONNECT":
        removeUser(ws);
        break;
      case "SEND_MESSAGE":
        sendMessage(ws, data.message);
        break;
      case "TYPING":
        sendTypingEvent(ws);
        break;
      default:
        console.log("⚠️ Unknown event:", data.type);
    }
  });

  ws.on("close", () => {
    console.log("close: " + ws.userId);
    removeUser(ws);
  });
}

function addUser(ws, userId, userName) {
  if (userConnections.has(userId)) {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        message: "User already connected.",
      })
    );
    ws.close();
    return;
  }

  ws.userId = userId; // Store userId inside WebSocket object
  ws.userName = userName; // Store userName inside WebSocket object
  userConnections.set(userId, ws); // Add to userConnections map

  if (waitingUsers.size > 0) {
    // Match with the first waiting user
    const matchedUser = waitingUsers.values().next().value;
    waitingUsers.delete(matchedUser);

    activeChats.set(ws, matchedUser);
    activeChats.set(matchedUser, ws);

    ws.send(
      JSON.stringify({
        type: "MATCHED",
        message: "Connected!",
        userName: matchedUser.userName,
      })
    );
    matchedUser.send(
      JSON.stringify({
        type: "MATCHED",
        message: "Connected! with: " + userName,
        userName,
      })
    );

    console.log(
      `✅ User ${userName} (${userId}) matched with another user ${matchedUser.userName} (${matchedUser.userId}).`
    );
  } else {
    waitingUsers.add(ws);
    console.log(`🟡 User ${userName} (${userId}) added to waiting list.`);
  }

  logWaitingUsers();
}
function sendTypingEvent(ws) {
  const partner = activeChats.get(ws);
  if (partner) {
    partner.send(
      JSON.stringify({
        type: "TYPING",
      })
    );
  }
}
function sendMessage(ws, message) {
  const partner = activeChats.get(ws);

  if (partner) {
    // Send message to partner
    partner.send(
      JSON.stringify({
        type: "RECEIVE_MESSAGE",
        message,
        senderName: ws.userName,
        senderId: ws.userId,
      })
    );
  }

  // Send message back to sender
  ws.send(
    JSON.stringify({
      type: "RECEIVE_MESSAGE",
      message,
      senderName: ws.userName,
      senderId: ws.userId,
    })
  );
}

function removeUser(ws) {
  console.log("removeUser: " + ws.userId);
  if (waitingUsers.has(ws)) {
    waitingUsers.delete(ws);
  }

  const partner = activeChats.get(ws);
  if (partner) {
    partner.send(
      JSON.stringify({
        type: "DISCONNECTED",
        message: "Your chat partner left.",
        userName: ws.userName,
      })
    );
    activeChats.delete(partner);
    userConnections.delete(partner.userId); // Remove from userConnections map
    addUser(partner, partner.userId, partner.userName);
  }

  activeChats.delete(ws);
  userConnections.delete(ws.userId); // Remove from userConnections map
  ws.close();
  console.log("🔴 User disconnected.");

  logWaitingUsers();
}

module.exports = { handleConnection, addUser, sendMessage, removeUser };
