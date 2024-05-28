import { Router } from "express";
import { import_audio } from "../controller/AudioImport.controller.js";

const audioProcessRouter = Router();

/**
 * @swagger
 * /audio/process:
 *   post:
 *     tags:
 *       - AudioProcess
 *     description: Import an audio file
 *     parameters:
 *       - in: body
 *         name: room
 *         description: The room
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: idProjectVideo
 *         description: The ID of the project video
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: files
 *         description: The audio files to process
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
 *             idProjectVideo:
 *               type: string
 *             room:
 *               type: string
 *             files:
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
audioProcessRouter.post("/audio/process", import_audio);

export default audioProcessRouter;
