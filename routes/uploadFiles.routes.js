import { Router } from "express";
import { flow_upload } from "../controller/FlowUploadController.js";
import { flow_multer } from "../middlewares/flow_chunckProcess.middleware.js";
import { upload_ovh } from "../controller/UploadOvhObjectStorage.controller.js";
import { sendFTP } from "../controller/UploadFtp.controller.js";

const uploadFiles = Router();

uploadFiles.post("/upload/ovh/multiparts", upload_ovh);
uploadFiles.post("/upload/ftp", sendFTP);
uploadFiles.post("/flow/upload", flow_multer.single("file"), flow_upload);

export default uploadFiles;
