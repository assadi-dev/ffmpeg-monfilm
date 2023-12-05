import {
  DIRECTORY_SEPARATOR,
  __dirname,
  domain,
  upload_dir,
} from "../config/constant.config.js";
import TinyStorage from "tiny-storage-client";
import fs, { createWriteStream, writeFileSync } from "fs";

import fetch, { FormData } from "node-fetch";
import request from "request";
import { writeFile } from "fs/promises";
import path from "path";
import streamToArray from "stream-to-array";

export const upload_gopro = (req, res) => {
  const idProjectvideo = req.body?.idProjectvideo;

  let filesData = [...req?.files].map((item) => ({
    filename: item.filename,
    path: `${domain}/uploads/${item.filename}`,
  }));

  let jsonRes = { idProjectvideo, filesData };
  return res.json(jsonRes);
};

export const upload_ovh = async (req, res) => {
  try {
    const credentials = {
      authUrl: "https://auth.cloud.ovh.net/v3",
      username: "user-zcyQM3AANCkh",
      password: "rjsX3DerQDsG6czQ8nqXNtaPJQPnkTzh",
      region: "GRA",
      tenantName: "9853822694419932",
    };

    let authToken;
    const tinyStorage = TinyStorage(credentials);

    tinyStorage.connection(async (err) => {
      if (err) {
        console.log(err);
      }
      console.log("connected");
      authToken = tinyStorage.getConfig().token;

      uploadLargeFile();
    });

    const container = "media";
    const endpoint =
      "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7/media";
    const localFilePath = `${upload_dir}${DIRECTORY_SEPARATOR}1701167231509_GS010093.mp4`;
    const remoteFileName = "remote_large_file.mp4";

    const fileStats = fs.statSync(localFilePath);
    const totalFileSize = fileStats.size;
    // Set the chunk size for uploading
    const chunkSize = 1024 * 1024 * 10;
    const outputDir = `${upload_dir}${DIRECTORY_SEPARATOR}tmp${DIRECTORY_SEPARATOR}`;

    const uploadLargeFile = async () => {
      const headers = {
        "X-Auth-Token": authToken,
        "X-Object-Manifest": `${container}/${remoteFileName}`,
      };

      let offset = 0;
      let segmentNumber = 1;

      const readAndUploadChunk = async () => {
        const start = offset;
        const end = Math.min(offset + chunkSize, totalFileSize) - 1;
        const contentLength = end - start + 1;

        const fileStream = fs.createReadStream(localFilePath, { start, end });

        streamToArray(fileStream)
          .then((array) => {
            const chunkBuffer = Buffer.concat(array);
            const formData = new FormData();
            formData.append(remoteFileName, chunkBuffer, {
              filename: remoteFileName,
              knownLength: contentLength,
            });
            const uploadUrl = `${endpoint}/${remoteFileName}`;
            fetch(uploadUrl, {
              method: "PUT",
              headers,
              body: formData,
            })
              .then((response) => {
                if (response.ok) {
                  console.log(
                    `Uploaded chunk starting at offset ${start} - ${end}`
                  );
                  offset = end + 1;

                  if (offset < totalFileSize) {
                    readAndUploadChunk(); // Continue with the next chunk
                  } else {
                    console.log("Large video uploaded successfully.");
                  }
                } else {
                  console.error(
                    `Failed to upload chunk starting at offset ${start} - ${end}`
                  );
                }
              })
              .catch((error) => {
                console.error("Error uploading chunk:", error);
              });
          })
          .catch((err) => {
            console.error("Error reading the chunk:", err);
          });
      };
      readAndUploadChunk();
    };

    res.json("ok");
  } catch (error) {
    const message = error.message;
    console.error("Upload error:", message);
  }
};

export const read_file = async (req, res) => {
  const remoteVideoUrl =
    "https://media-s3-storage.s3.sbg.io.cloud.ovh.net/audio2.mp3";

  try {
    const remoteRes = await fetch(remoteVideoUrl);

    if (!remoteRes.ok) {
      res.statusCode = remoteRes.status;
      res.end("Failed to fetch video from the remote URL.");
      return;
    }

    res.setHeader("Content-Type", "video/mp3");

    remoteRes.body.pipe(res);
  } catch (error) {
    console.error("Error:", err);
    res.statusCode = 500;
    res.send("Internal Server Error");
  }
};
