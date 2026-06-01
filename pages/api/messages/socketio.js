import socketService from "../../../services/socket-service";

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    const io = socketService.initialize(res.socket.server);
    res.socket.server.io = io;
  }
  res.end();
}
