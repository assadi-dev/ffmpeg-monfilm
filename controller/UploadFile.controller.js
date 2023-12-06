import {
  DIRECTORY_SEPARATOR,
  __dirname,
  domain,
  upload_dir,
} from "../config/constant.config.js";
import TinyStorage from "tiny-storage-client";
import fs, { createWriteStream, writeFileSync } from "fs";

import fetch from "node-fetch";
import request from "request";
import { writeFile } from "fs/promises";
import path from "path";

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

    const uploadLargeFile = async () => {
      FormData.prototype.get;
      const container = "media";
      const endpoint =
        "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7/media";
      const localFilePath = `${upload_dir}${DIRECTORY_SEPARATOR}1698769006802_VID_20230414_164335_00_011.mp4`;
      const remoteFileName = "remote_large_file.mp4";

      const fileStats = fs.statSync(localFilePath);
      const totalFileSize = fileStats.size;
      // Set the chunk size for uploading
      const segmentSize = 1024 * 1024 * 10;

      const outputDir = `${upload_dir}${DIRECTORY_SEPARATOR}tmp${DIRECTORY_SEPARATOR}`;
      // splitLargeFile(localFilePath, outputDir, chunkSize);

      const headers = {
        "X-Auth-Token": authToken,
      };

      const readStream = fs.createReadStream(localFilePath, {
        highWaterMark: segmentSize,
      });

      const manifest = {
        segments: [],
      };
      //Segment
      let currentSegment = 0;

      readStream.on("data", async (chunk) => {
        currentSegment++;
        const segmentName = `${remoteFileName}/${currentSegment}`;
        manifest.segments.push(segmentName);
        const uploadUrl = `${endpoint}/${segmentName}`;
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            ...headers,
            "X-Object-Manifest": `${container}/${remoteFileName}`,
          },
          body: chunk,
        });

        if (!response.ok) {
          console.error(`Failed to upload segment ${segmentName}`);
          return;
        }
      });

      readStream.on("end", async () => {
        console.log(manifest);
        // All data has been read
        const manifestUrl = `${endpoint}/${remoteFileName}`;
        const manifestHeaders = {
          ...headers,
          "X-Object-Manifest": `${container}/${remoteFileName}`,
        };

        const manifestResponse = await fetch(manifestUrl, {
          method: "PUT",
          headers: manifestHeaders,
          body: JSON.stringify(manifest),
        });

        if (manifestResponse.ok) {
          console.log("Large object uploaded successfully.");
        } else {
          console.error("Failed to upload the manifest file.");
        }
      });
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
