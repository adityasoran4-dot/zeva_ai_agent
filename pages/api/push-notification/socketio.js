import { Server } from "socket.io";

let io;

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("Starting Socket.IO server...");
    io = new Server(res.socket.server, {
      path: "/api/push-notification/socketio",
      cors: {
        origin: "*", // restrict in production
      },
    });

    io.on("connection", (socket) => {
      // console.log("User connected:", socket.id);

      socket.on("register", (userId) => {
        socket.join(userId);
        // console.log(`User ${userId} joined their room`);
      });

      socket.on("disconnect", () => {
        // console.log("User disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}

export function emitNotificationToUser(userId, notification) {
  if (io) {
    io.to(userId.toString()).emit("newNotification", notification);
  }
}
