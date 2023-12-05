import {
  DIRECTORY_SEPARATOR,
  __dirname,
  domain,
  upload_dir,
} from "../config/constant.config.js";
import fs, { createWriteStream, writeFileSync } from "fs";
import fetch, { FormData } from "node-fetch";
import { writeFile } from "fs/promises";
import path, { resolve } from "path";
import streamToArray from "stream-to-array";
import TinyStorage from "tiny-storage-client";
import OvhObjectStorageServices from "../services/OvhObjectStorage.services.js";

const credentials = {
  authUrl: "https://auth.cloud.ovh.net/v3",
  username: "user-zcyQM3AANCkh",
  password: "rjsX3DerQDsG6czQ8nqXNtaPJQPnkTzh",
  region: "GRA",
  tenantName: "9853822694419932",
  endpoint:
    "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7",
};

const CONTAINER = "media";
const endpoint =
  "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7";

const localFilePath = `${upload_dir}${DIRECTORY_SEPARATOR}1701167231509_GS010093.mp4`;
const remoteFileName = "test-pkg-file.mp4";

export const upload_ovh = async (req, res) => {
  try {
    const data = {
      authToken: "",
      objectName: remoteFileName,
      containerName: CONTAINER,
      filePath: localFilePath,
      endpoint:
        "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7",
    };

    const ovhStorageServices = new OvhObjectStorageServices(credentials);

    await ovhStorageServices.connect();

    console.log(ovhStorageServices.authToken);

    // createLargeFile(data, tinyStorage);

    res.json("ok");
  } catch (error) {
    const message = error.message;
    console.error("Upload error:", message);
    res.json({ message });
  }
};

const createLargeFile = async (data, storage) => {
  //Start
  const { authToken, objectName, containerName, filePath } = data;
  const fileStats = fs.statSync(filePath);
  const totalFileSize = fileStats.size;
  const segmentSize = 1024 * 1024 * 100;
  const PREFIX = `${getTimestamp()}/${totalFileSize}`;

  console.log(`Check if container segment exist`);
  const CONTAINER_SEGMENTS = containerName + "_segments";

  storage.listBuckets("media", (err, resp) => {
    if (err) {
      console.log(err.message);
    }
    const containers = resp.body;
    const segmentsContainer = containers?.find(
      (container) => container.name == CONTAINER_SEGMENTS
    );
    if (!segmentsContainer) {
      createContainer(authToken, CONTAINER_SEGMENTS);
      console.log("Container segment create");
    }
  });

  let offset = 0;
  let segmentNumber = 1;
  let totalBytes = 0;

  const readAndUploadSegment = async () => {
    const headers = {
      "X-Auth-Token": authToken,
    };

    const segmentName = `${objectName}/${PREFIX}/${segmentNumber
      .toString()
      .padStart(8, "0")}`;

    const fileStream = fs.createReadStream(filePath, {
      start: offset,
      end: offset + segmentSize - 1,
    });

    //Start upload segment

    const CONTAINER_NAME = `${CONTAINER_SEGMENTS}`;
    await storage.uploadFile(
      CONTAINER_NAME,
      `${segmentName}`,
      () => fileStream,

      {
        headers: {
          "X-Object-Manifest": `${CONTAINER}/${objectName}`,
        },
      },
      (err, res) => {
        if (err) {
          console.error(`Failed to upload segment ${segmentName}`);
          console.log(err);
          return;
        }

        console.log(`Uploaded segment ${segmentName}`);
        offset += segmentSize;
        segmentNumber++;

        if (offset < totalFileSize) {
          readAndUploadSegment(); // Continue with the next segment
        } else {
          console.log("All segments uploaded successfully.");
          const headerManifest = {
            ...headers,
            "X-Object-Manifest": `${CONTAINER_SEGMENTS}/${objectName}/${PREFIX}`,
          };

          const manifestUploadUrl = `${endpoint}/${containerName}/${objectName}`;
          sendManifest(
            manifestUploadUrl,
            headerManifest,
            containerName,
            objectName
          ).then((result) => {
            console.log(result);
          });
        }
      }
    );

    fileStream.on("data", (chunk) => {
      totalBytes += chunk.length;
      const progress = (totalBytes / totalFileSize) * 100;
      console.log(`Upload progress: ${progress.toFixed(2)}%`);
    });
  };

  readAndUploadSegment();

  //End
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

const getTimestamp = () => {
  const dt = new Date();
  return dt.getTime();
};

/**
 * Creation d'un container
 * @param {*} authToken
 * @param {*} containerName
 * @returns
 */
const createContainer = (authToken, containerName) => {
  const headers = {
    "X-Auth-Token": authToken,
  };

  try {
    if (!containerName) throw new Error("Container segment non defini");
    const url = `${endpoint}/${containerName}`;
    return fetch(url, {
      method: "PUT",
      headers,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const sendManifest = (
  manifestUploadUrl,
  headerManifest,
  container,
  objectName
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const manifestResponse = await fetch(manifestUploadUrl, {
        method: "PUT",
        headers: headerManifest,
      });

      if (manifestResponse.ok) {
        console.log("Large video uploaded successfully.");
        const response = {
          message: "Large video uploaded successfully.",
          url: `${endpoint}/${container}/${objectName}`,
        };
        resolve(response);
      } else {
        throw new Error("Failed to upload the manifest file.");
      }
    } catch (error) {
      reject(error);
      console.log(error);
    }
  });
};
