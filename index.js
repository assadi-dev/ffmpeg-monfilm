import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import corsOptions from "./config/cors.config.js";
import os from "os";
import { chmodSync, existsSync, mkdirSync } from "fs";
import { upload_dir } from "./config/constant.config.js";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import process from "process";

dotenv.config();

const port = process.env.PORT || 5500;

const swaggerOptions = {
	swaggerDefinition: {
		info: {
			title: "Video Converter API",
			description: "API for video converter",
			contact: {
				name: "FFMPEG Traitement Video",
			},
			servers: ["http://localhost:5500"],
		},
	},
	apis: ["./routes/*.js"],
};

export const server = http.createServer(app);
/**
 * Instance du serveur websocket
 */
export const ws = new Server(server, { cors: corsOptions });

ws.of(process.env.WEBSOCKET_PATH).on("connection", (socket) => {
	socket.on("join_server", (data) => {
		const room = data;
		socket.join(room);
		let message = `client with id ${socket.id} has join the room ${room}`;
		console.log(message);
	});
});

//Init folder
if (!existsSync(upload_dir)) {
	mkdirSync(upload_dir);
	chmodSync(upload_dir, "777");
}

/* const proxy = httpProxy.createProxyServer({
  target: "http://ffmpeg.tkorp.com:5500",
  ws: true,
});

proxy.listen(5500); */

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
