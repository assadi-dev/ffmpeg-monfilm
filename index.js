import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import corsOptions from "./config/cors.config.js";
import os from "os";

dotenv.config();

const port = process.env.PORT || 5500;

export const server = http.createServer(app);
/**
 * Instance du serveur websocket
 */
export const ws = new Server(server, { cors: corsOptions });

ws.on("connection", (socket) => {
  console.log(socket.id);
  socket.join("255");
});

server.listen(port, () => {
  console.log(`server on port ${port}`);
  const system = {
    platform: os.platform(),
    cpu: os.cpus()[0].model,
    threads: os.cpus().length,
    os: os.version(),
    realease: os.release(),
  };

  console.table(system);
});
