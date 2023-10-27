import { Router } from "express";
import {
  gopro_process,
  insv_process,
} from "../controller/VideoProcess.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { upload_gopro } from "../controller/UploadFile.controller.js";

const videoProcessRouter = Router();

videoProcessRouter.post("/upload/gopro", upload.any("file"), upload_gopro);
videoProcessRouter.post("/process/insv", insv_process);
videoProcessRouter.post("/process/gopro", gopro_process);

export default videoProcessRouter;
