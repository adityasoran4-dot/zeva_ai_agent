import { Server } from "socket.io";
import { redisClient } from "../bullmq/redis";

class SocketService {
  constructor() {
    this.io = null;
    this.redisPrefix = "socket:";
  }

  initialize(server) {
    if (!this.io) {
      this.io = new Server(server, {
        path: "/api/messages/socketio",
        cors: {
          origin:
            process.env.NODE_ENV === "production"
              ? process.env.ALLOWED_ORIGINS?.split(",") || []
              : "*",
        },
      });

      this.setupEventHandlers();
      console.log("Socket.IO server initialized");

      // Make io globally available for backward compatibility
      global.socketIo = this.io;
    }
    return this.io;
  }

  setupEventHandlers() {
    this.io.on("connection", async (socket) => {
      const userId = socket.handshake.query.userId;
      console.log("User connected:", socket.id);
      console.log({
        userId,
        socketId: socket.id,
        key: `socket:user:${userId}`,
      });

      if (userId) {
        await this.storeSocketId(userId, socket.id);
      }

      // Keep backward compatibility with existing events
      socket.on("register", async (userId) => {
        socket.join(userId);
        await this.storeSocketId(userId, socket.id);
        console.log(`User ${userId} joined their room`);
      });

      socket.on("disconnect", async () => {
        const userId = socket.handshake.query.userId;
        if (userId) {
          await this.removeSocketId(userId);
        }
        console.log("User disconnected:", socket.id);
      });
    });
  }

  async storeSocketId(userId, socketId) {
    const key = `${this.redisPrefix}user:${userId}`;
    await redisClient.set(key, socketId, "EX", 3600); // 1 hour
  }

  async getSocketId(userId) {
    const key = `${this.redisPrefix}user:${userId}`;
    return await redisClient.get(key);
  }

  async removeSocketId(userId) {
    const key = `${this.redisPrefix}user:${userId}`;
    await redisClient.del(key);
  }

  // Emit events from anywhere
  async emitToUser(userId, event, data) {
    const socketId = await this.getSocketId(userId);
    if (this.io && socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Emit to socket ID directly
  async emitToSocketId(socketId, event, data) {
    if (this.io && socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Emit to multiple users
  async emitToUsers(userIds, event, data) {
    if (!this.io) return false;

    for (const userId of userIds) {
      const socketId = await this.getSocketId(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    }
    return true;
  }

  // Check if user is online
  async isUserOnline(userId) {
    const socketId = await this.getSocketId(userId);
    if (!socketId || !this.io) return false;

    const sockets = await this.io.fetchSockets();
    return sockets.some((socket) => socket.id === socketId);
  }

  // Get all connected socket IDs
  async getAllSocketIds() {
    if (!this.io) return [];
    const sockets = await this.io.fetchSockets();
    return sockets.map((socket) => socket.id);
  }

  // Get all online users
  async getAllOnlineUsers() {
    const socketIds = await this.getAllSocketIds();
    const onlineUsers = [];

    for (const socketId of socketIds) {
      // You might want to store userId with socketId differently
      // This is a simple implementation
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket?.handshake?.query?.userId) {
        onlineUsers.push(socket.handshake.query.userId);
      }
    }

    return onlineUsers;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
