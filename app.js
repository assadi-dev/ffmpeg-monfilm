import express from "express";
import path from "path";
import corsOptions from "./config/cors.config.js";
import cors from "cors";
import videoProcessRouter from "./routes/videoProcess.routes.js";
import { test_ffmpeg } from "./services/FFmpegCameraProcess.services.js";
import uploadFiles from "./routes/uploadFiles.routes.js";
import audioProcessRouter from "./routes/audioProcess.routes.js";

const app = express();

//Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Static Files
app.use("/uploads", express.static(path.join("uploads")));
app.use("/", express.static(path.join("public")));

app.get("/", test_ffmpeg);
//Endpoint
//traitementVideo
app.use("/api", videoProcessRouter);
//traitementAudio
app.use("/api", audioProcessRouter);
//Upload
app.use("/", uploadFiles);

export default app;
