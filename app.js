import express from "express";
import path from "path";
import corsOptions from "./config/cors.config.js";
import cors from "cors";
import videoProcessRouter from "./routes/videoProcess.routes.js";
import { test_ffmpeg } from "./services/FFmpegCameraProcess.services.js";

const app = express();

//Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Static Files
app.use("/uploads", express.static(path.join("uploads")));
app.use("/", express.static(path.join("public")));

//Endpoint
app.get("/", test_ffmpeg);
//traitementVideo
app.use("/api", videoProcessRouter);

export default app;
