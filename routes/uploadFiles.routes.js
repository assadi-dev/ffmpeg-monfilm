import { Router } from "express";
import { flow_upload } from "../controller/FlowUploadController.js";
import { flow_multer } from "../middlewares/flow_chunckProcess.middleware.js";
import { upload_ovh } from "../controller/UploadOvhObjectStorage.controller.js";
import { sendFTP } from "../controller/UploadFtp.controller.js";

const uploadFiles = Router();

uploadFiles.post("/upload/ovh/multiparts", upload_ovh);

uploadFiles.post("/upload/ftp", sendFTP);

/**
 * @swagger
 * /upload/flow/upload:
 *   post:
 *     tags:
 *       - UploadFiles
 *     description: Upload a file in chunks
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload
 *         required: true
 *       - in: formData
 *         name: flowChunkNumber
 *         type: integer
 *         description: The chunk number
 *         required: true
 *       - in: formData
 *         name: flowIdentifier
 *         type: string
 *         description: The unique identifier for the upload
 *         required: true
 *       - in: formData
 *         name: flowFilename
 *         type: string
 *         description: The original file name
 *         required: true
 *       - in: formData
 *         name: flowTotalChunks
 *         type: integer
 *         description: The total number of chunks
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             filename:
 *               type: string
 *       500:
 *         description: Error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
uploadFiles.post(
  "/upload/flow/upload",
  flow_multer.single("file"),
  flow_upload
);

export default uploadFiles;
