import { Router } from "express";
import {
  compress_test,
  getMetadataFile,
  gopro_process,
  injectMetaDataTest,
  insv_process,
  test_gopro_process,
  test_insv_process,
} from "../controller/VideoProcess.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { upload_gopro } from "../controller/UploadFile.controller.js";
import { test_ffmpeg } from "../services/FFmpegCameraProcess.services.js";
import {
  export_project,
  merges_input,
} from "../controller/VideoExport.controller.js";
import { upload_single_ovh } from "../controller/UploadOvhObjectStorage.controller.js";

const videoProcessRouter = Router();

//Test Process
videoProcessRouter.get("/process/test", test_ffmpeg);
videoProcessRouter.get("/test/process/insv", test_insv_process);
videoProcessRouter.get("/test/process/gopro", test_gopro_process);
videoProcessRouter.post("/test/compress", compress_test);
videoProcessRouter.post("/test/metadata", getMetadataFile);
videoProcessRouter.post("/test/injectMetadata", injectMetaDataTest);

//Upload
videoProcessRouter.post("/upload/gopro", upload.any("file"), upload_gopro);
videoProcessRouter.post("/upload/ovh/single", upload_single_ovh);

//Process
videoProcessRouter.post("/process/insv", insv_process);
videoProcessRouter.post("/process/gopro", gopro_process);
videoProcessRouter.post("/export/process", export_project);
videoProcessRouter.post("/concatenate/process", merges_input);

export default videoProcessRouter;
