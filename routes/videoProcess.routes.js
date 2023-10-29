import { Router } from "express";
import {
  gopro_process,
  insv_process,
  test_gopro_process,
  test_insv_process,
} from "../controller/VideoProcess.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { upload_gopro } from "../controller/UploadFile.controller.js";
import { test_ffmpeg } from "../services/FFmpegCameraProcess.services.js";

const videoProcessRouter = Router();

//Test Process
videoProcessRouter.get("/process/test", test_ffmpeg);
videoProcessRouter.get("/test/process/insv", test_insv_process);
videoProcessRouter.get("/test/process/gopro", test_gopro_process);

//Upload
videoProcessRouter.post("/upload/gopro", upload.any("file"), upload_gopro);

//Process
videoProcessRouter.post("/process/insv", insv_process);
videoProcessRouter.post("/process/gopro", gopro_process);

export default videoProcessRouter;
