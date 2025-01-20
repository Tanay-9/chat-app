import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const roomData = new Map();
wss.on("connection", (socket) => {
  console.log("connect successfully");

  socket.send("connected");

  //   socket.on("message" ,(e) => {
  //     const message = JSON.parse(e.toString());
  //     wss.clients.forEach(function each (client) {
  //         if(client !== socket && client.readyState === WebSocket.OPEN) {
  //             client.send("the data sent was " + JSON.stringify(message));
  //         }
  //     })
  //   })

  socket.on("message", (e) => {
    const message = JSON.parse(e.toString());
    console.log(message);

    if (message.type === "join") {
      if (!roomData.has(message.payload.roomCode)) {
        roomData.set(message.payload.roomCode, new Set());
      }

      roomData.get(message.payload.roomCode).add(socket);

      socket.send(`a new user join the room`);
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
          //@ts-ignore
          clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                // const tobeSent = message.payload.content.s
              client.send(
                message.payload.content
              );
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
