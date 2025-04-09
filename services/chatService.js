const waitingUsers = new Set(); // Users waiting for a match
const activeChats = new Map(); // Active chat pairs (userId -> ws)

function logWaitingUsers() {
  const users = Array.from(waitingUsers).map((ws) => ws.userId);
  console.log("Current waiting users:", users);
}

function addUser(ws, userId, userName) {
  ws.userId = userId; // Store userId inside WebSocket object
  ws.userName = userName; // Store userName inside WebSocket object
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

function sendMessage(ws, message) {
  const partner = activeChats.get(ws);

  if (partner) {
    // Send message to partner
    partner.send(
      JSON.stringify({ type: "RECEIVE_MESSAGE", message, sender: ws.userName })
    );
  }

  // Send message back to sender
  ws.send(
    JSON.stringify({ type: "RECEIVE_MESSAGE", message, sender: ws.userName })
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
    addUser(partner, partner.userId, partner.userName);
  }

  activeChats.delete(ws);
  ws.close();
  console.log("🔴 User disconnected.");

  logWaitingUsers();
}

module.exports = { addUser, sendMessage, removeUser };
