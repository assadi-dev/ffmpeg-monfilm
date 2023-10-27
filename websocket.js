import { ws } from "./index.js";

ws.on("connection", (socket) => {
  console.log(socket.id);
});
