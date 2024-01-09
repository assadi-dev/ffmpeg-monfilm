import { Router } from "express";
import { import_audio } from "../controller/AudioImport.controller.js";

const audioProcessRouter = Router();
audioProcessRouter.post("/audio/process", import_audio);

export default audioProcessRouter;
