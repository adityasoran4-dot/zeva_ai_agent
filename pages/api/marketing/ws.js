import { WebSocketServer } from "ws";
import { registerWsClient } from "./ws-utils";

export default function handler(req, res) {
  if (!res.socket.server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    res.socket.server.wss = wss;

    res.socket.server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.on("message", (msg) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.phoneNumber) {
              registerWsClient(data.phoneNumber, ws); // phone normalized inside ws-utils
            }
          } catch (e) {
            // console.error("⚠️ WS parse error:", e);
          }
        });

        // ws.on("close", () => console.log("❌ WS client disconnected"));
      });
    });

    // console.log("✅ WebSocket server initialized");
  }

  res.status(200).json({ success: true });
}
