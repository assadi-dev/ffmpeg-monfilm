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
    const ovhStorageServices = new OvhObjectStorageServices(credentials);

    const options = {
      filePath: `${upload_dir}${DIRECTORY_SEPARATOR}1701167231509_GS010093.mp4`,
      remoteFilename: "test-objet-file.mp4",
      containerName: "media",
      segmentSize: 1024 * 1024 * 50,
    };

    ovhStorageServices.uploadLargeFile(options);

    const listen = (progress) => {
      const percent = Math.ceil(progress * 100);
      console.log("progress upload", percent + "%");
    };
    ovhStorageServices.onProgress(listen);
    const finish = (response) => {
      console.log("finish", response);
    };
    ovhStorageServices.onSuccess(finish);

    res.json("ok");
  } catch (error) {
    const message = error.message;
    console.error("Upload error:", message);
    res.json({ message });
  }
};
