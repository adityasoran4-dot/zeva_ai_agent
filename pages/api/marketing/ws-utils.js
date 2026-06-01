const wsClients = {};       // { phoneNumber: ws }
const pendingMessages = {}; // { phoneNumber: [msg1, msg2] }

// Normalize phone to E.164
function normalizePhone(num) {
  if (!num) return "";
  return num.startsWith("+") ? num : `+${num}`;
}

// Register a WebSocket client
export function registerWsClient(phoneNumber, ws) {
  const normalized = normalizePhone(phoneNumber);
  wsClients[normalized] = ws;

  // Send any pending messages
  if (pendingMessages[normalized]?.length) {
    pendingMessages[normalized].forEach((msg) => ws.send(JSON.stringify(msg)));
    pendingMessages[normalized] = [];
  }
}

// Send message to a specific WebSocket client
export function sendMessageToClient(phoneNumber, messageObj) {
  const normalized = normalizePhone(phoneNumber);
  const ws = wsClients[normalized];

  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(messageObj));
  } else {
    // Store in pending queue
    if (!pendingMessages[normalized]) pendingMessages[normalized] = [];
    pendingMessages[normalized].push(messageObj);
  }
}
