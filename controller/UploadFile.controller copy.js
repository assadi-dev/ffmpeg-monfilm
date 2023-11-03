import {
  DIRECTORY_SEPARATOR,
  __dirname,
  domain,
  upload_dir,
} from "../config/constant.config.js";
import TinyStorage from "tiny-storage-client";
import fs from "fs";
import request from "request-promise-native";
import { Stream } from "stream";
import fetch from "node-fetch";

export const upload_gopro = (req, res) => {
  const idProjectvideo = req.body?.idProjectvideo;

  let filesData = [...req?.files].map((item) => ({
    filename: item.filename,
    path: `${domain}/uploads/${item.filename}`,
  }));

  let jsonRes = { idProjectvideo, filesData };
  return res.json(jsonRes);
};

export const upload_ovh = (req, res) => {
  try {
    const credentials = {
      authUrl: "https://auth.cloud.ovh.net/v3",
      username: "user-zcyQM3AANCkh",
      password: "rjsX3DerQDsG6czQ8nqXNtaPJQPnkTzh",
      region: "gra",
    };

    const client = TinyStorage({ ...credentials });
    let authToken;

    client.connection(async (err, res) => {
      if (err) {
        // Invalid credentials
      }
      // Success, connected!
      // Start the upload process
      authToken = client.getConfig().token;
      uploadChunks();
    });

    const container = "media";
    const endpoint =
      "https://storage.gra.cloud.ovh.net/v1/AUTH_701ba673d44d4547a615c23a12bbe4e7/media";
    const localFilePath = `${upload_dir}${DIRECTORY_SEPARATOR}1698769006802_VID_20230414_164335_00_011.mp4`;
    const remoteFileName = "remote_large_file.mp4";

    const fileStats = fs.statSync(localFilePath);
    const totalFileSize = fileStats.size;
    // Set the chunk size for uploading
    const chunkSize = 1024 * 1024 * 100;

    const uploadChunks = async () => {
      const options = {
        method: "PUT",
        uri: `${endpoint}/${remoteFileName}`,
        headers: {
          "X-Auth-Token": authToken,
        },
      };

      try {
        if (totalFileSize <= chunkSize) {
          // If the file is small, upload it in one request
          const body = fs.createReadStream(localFilePath);

          await request({ ...options, body });

          console.log("File small uploaded successfully.");
        } else {
          // If the file is large, use streaming to upload it in chunks
          const fileStream = fs.createReadStream(localFilePath);
          const req = request(options);

          const pass = new Stream.PassThrough();

          fileStream.pipe(pass).pipe(req);

          req.on("response", (response) => {
            if (response.statusCode === 201) {
              console.log("File uploaded successfully.");
            } else {
              console.error("Upload error:", response.statusCode);
            }
          });

          let bytesUploaded = 0;

          req.on("data", (chunk) => {
            console.log(`Upload progress`);
          });

          req.on("end", () => {
            // File upload is complete
            console.log("upload complete");
          });

          req.on("error", (error) => {
            console.error("Upload error:", error);
          });

          // await req.promise();
        }
      } catch (error) {
        console.error("Upload error:", error.message);
      }
    };

    res.json("ok");
  } catch (error) {
    const message = error.message;
    console.error("Upload error:", message);
  }
};
