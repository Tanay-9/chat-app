import WebSocket, { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8081 });
const roomData = new Map();

wss.on("connection", (socket) => {
  console.log("connect successfully");
  socket.on("error", console.error);
  socket.on("message", (e) => {
    const message = JSON.parse(e.toString());
    console.log(message);
    if (message.type === "join") {
      if (!roomData.has(message.payload.roomCode)) {
        roomData.set(message.payload.roomCode, new Set());
      }
      roomData.get(message.payload.roomCode).add(socket);
      const clients = roomData.get(message.payload.roomCode);
      clients.forEach((client: WebSocket) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          const tobeSent = {
            content: "a new user joined",
            userName: message.payload.userName,
            type: message.type,
          };
          client.send(JSON.stringify(tobeSent));
        }
      });
    }
    if (message.type === "chat") {
      if (!roomData.has(message.payload.roomCode)) {
        socket.send("room is invalid");
      } else {
        const clients = roomData.get(message.payload.roomCode);
        if (!clients.has(socket)) {
          socket.send(
            "you're not a member of this room, join room first inorder to chat here"
          );
        } else {
          clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
              const tobeSent = {
                content: message.payload.content,
                userName: message.payload.userName,
                type: message.type,
              };
              client.send(JSON.stringify(tobeSent));
            }
          });
        }
      }
    }
  });
  socket.on("close", () => {
    console.log("Client disconnected");
    roomData.forEach((clients, roomCode) => {
      clients.delete(socket);
      if (clients.size === 0) {
        roomData.delete(roomCode);
      }
    });
  });
});
