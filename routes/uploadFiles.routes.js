import { Router } from "express";
import {
  read_file,
  upload_ovh,
} from "../controller/UploadFile.controller copy 3.js";
import {
  s3_upload,
  s3uploadMultipart,
} from "../middlewares/ovhStorage.midleware.js";
import { flow_upload } from "../controller/FlowUploadController.js";
import { flow_multer } from "../middlewares/flow_chunckProcess.middleware.js";
import { upload_ovh_pkg } from "../controller/UploadFile.controller copy 5.js";

const uploadFiles = Router();

uploadFiles.post("/upload/ovh", upload_ovh);
uploadFiles.post("/upload/ovh/multiparts", upload_ovh_pkg);
uploadFiles.get("/read/ovh", read_file);
uploadFiles.post("/flow/upload", flow_multer.single("file"), flow_upload);

export default uploadFiles;
