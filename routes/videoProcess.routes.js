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
 *     tags:
 *       - VideoProcess
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The metadata of the file
 *       500:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
videoProcessRouter.post("/test/metadata", getMetadataFile);

/**
 * @swagger
 * /test/injectMetadata:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Inject metadata into a test
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             inputPath:
 *               type: string
 *               description: The input path of the video
 *             outputPath:
 *               type: string
 *               description: The output path of the video
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             result:
 *               type: string
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
videoProcessRouter.post("/test/injectMetadata", injectMetaDataTest);

/**
 * @swagger
 * /upload/gopro:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Upload a GoPro video
 *     parameters:
 *       - in: body
 *         name: idProjectvideo
 *         description: The ID of the project video
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             idProjectvideo:
 *               type: string
 *             filesData:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   filename:
 *                     type: string
 *                   path:
 *                     type: string
 */
videoProcessRouter.post("/upload/gopro", upload.any("file"), upload_gopro);

/**
 * @swagger
 * /upload/ovh/single:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Upload a single file to OVH
 *     parameters:
 *       - in: body
 *         name: filePath
 *         description: The path of the file to upload
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: remoteFilename
 *         description: The name of the file on the remote server
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: string
 *           description: The URL of the uploaded file
 */
videoProcessRouter.post("/upload/ovh/single", upload_single_ovh);

/**
 * @swagger
 * /process/insv:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Process an insv video
 *     parameters:
 *       - in: body
 *         name: idProjectVideo
 *         description: The ID of the project video
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: room
 *         description: The room
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: files
 *         description: The files to process
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *       - in: body
 *         name: camera
 *         description: The camera
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: model
 *         description: The model
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               type: string
 *             camera:
 *               type: string
 *             filesProcess:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: number
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
videoProcessRouter.post("/process/insv", insv_process);

/**
 * @swagger
 * /process/gopro:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Process a GoPro video
 *     parameters:
 *       - in: body
 *         name: idProjectVideo
 *         description: The ID of the project video
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: room
 *         description: The room
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: files
 *         description: The files to process
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *       - in: body
 *         name: camera
 *         description: The camera
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             room:
 *               type: string
 *             camera:
 *               type: string
 *             filesProcess:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: number
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
videoProcessRouter.post("/process/gopro", gopro_process);

/**
 * @swagger
 * /export/process:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Export a processed video
 *     parameters:
 *       - in: body
 *         name: idProjectVideo
 *         description: The ID of the project video
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: room
 *         description: The room
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: projectName
 *         description: The name of the project
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: scenes
 *         description: The scenes
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *       - in: body
 *         name: audios
 *         description: The audios
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *       - in: body
 *         name: maxDuration
 *         description: The maximum duration
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             room:
 *               type: string
 *             message:
 *               type: string
 *             scenes:
 *               type: array
 *               items:
 *                 type: object
 *             audios:
 *               type: array
 *               items:
 *                 type: object
 *             maxDuration:
 *               type: number
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
videoProcessRouter.post("/export/process", export_project);

/**
 * @swagger
 * /concatenate/process:
 *   post:
 *     tags:
 *       - VideoProcess
 *     description: Concatenate processed videos
 *     parameters:
 *       - in: body
 *         name: scenes
 *         description: The scenes to concatenate
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             scenes:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
videoProcessRouter.post("/concatenate/process", merges_input);

export default videoProcessRouter;
