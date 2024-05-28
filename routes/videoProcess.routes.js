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

/**
 * @swagger
 * /test/metadata:
 *   post:
 *     description: Get metadata of a file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inputPath
 *             properties:
 *               inputPath:
 *                 type: string
 *                 description: The path to the input file
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/test/metadata", getMetadataFile);

/**
 * @swagger
 * /test/injectMetadata:
 *   post:
 *     description: Inject metadata into a test
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/test/injectMetadata", injectMetaDataTest);

//Upload
/**
 * @swagger
 * /upload/gopro:
 *   post:
 *     description: Upload a GoPro video
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/upload/gopro", upload.any("file"), upload_gopro);

/**
 * @swagger
 * /upload/ovh/single:
 *   post:
 *     description: Upload a single file to OVH
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/upload/ovh/single", upload_single_ovh);

//Process
/**
 * @swagger
 * /process/insv:
 *   post:
 *     description: Process an insv video
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/process/insv", insv_process);

/**
 * @swagger
 * /process/gopro:
 *   post:
 *     description: Process a GoPro video
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/process/gopro", gopro_process);

/**
 * @swagger
 * /export/process:
 *   post:
 *     description: Export a processed video
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/export/process", export_project);

/**
 * @swagger
 * /concatenate/process:
 *   post:
 *     description: Concatenate processed videos
 *     responses:
 *       200:
 *         description: Success
 */
videoProcessRouter.post("/concatenate/process", merges_input);

export default videoProcessRouter;
