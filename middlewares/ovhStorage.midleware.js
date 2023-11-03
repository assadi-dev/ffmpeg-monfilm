import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";
import { S3Client } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.config.js";
import { Upload } from "@aws-sdk/lib-storage";

export const s3uploadMultipart = async (req, res, next) => {
  const file = req.file;

  const params = {
    Bucket: "media-s3-storage",
    Key: file.originalname,
    Body: file.buffer,
  };
  const uploadParallel = new Upload({
    client: s3,
    partSize: 1024 * 1024 * 10, // optional size of each part
    leavePartsOnError: false, // optional manually handle dropped parts
    queueSize: 4,
    params,
  });

  uploadParallel.on("httpUploadProgress", (data) => {
    let totalprogress = (data.loaded / data.total) * 100;
    console.log(`${totalprogress.toFixed(2)}%`);
  });

  uploadParallel.done().then((data) => {
    let result = {
      message: "fichier reçus",
      url: data.Location,
    };
    console.log("upload done", result);
  });
  next();
};

export const s3_upload = multer();
