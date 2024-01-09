import multer from "multer";
import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import path from "path";
import fs, { existsSync } from "fs";

export const flow_upload = (req, res) => {
  const {
    flowChunkNumber,
    flowChunkSize,
    flowTotalSize,
    flowIdentifier,
    flowFilename,
    flowTotalChunks,
  } = req.body;

  console.log(req.body);

  const chunkDirectory = `${upload_dir}${DIRECTORY_SEPARATOR}chunk`;
  const completeDirectory = `${upload_dir}`;

  const dt = new Date();
  const filename_timestamp = `${dt.getTime()}_${flowFilename}`;

  const chunkFilename = `${flowIdentifier}.${flowChunkNumber}`;
  const chunkPath = path.join(chunkDirectory, chunkFilename);

  // Move the uploaded chunk to the appropriate directory
  fs.rename(req.file.path, chunkPath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error saving chunk");
    }

    // Check if all chunks have been received

    // const expectedChunks = Math.ceil(flowTotalSize / flowChunkSize);
    const chunkNumbers = Array.from(
      { length: flowTotalChunks },
      (_, i) => i + 1
    );

    const allChunksReceived = chunkNumbers.every((num) => {
      return fs.existsSync(
        path.join(chunkDirectory, `${flowIdentifier}.${num}`)
      );
    });

    if (allChunksReceived) {
      // All chunks have been received; assemble the complete file
      const completeFilePath = path.join(completeDirectory, filename_timestamp);
      const writeStream = fs.createWriteStream(completeFilePath);
      writeStream.setMaxListeners(chunkNumbers.length + 1);

      chunkNumbers.forEach((num) => {
        const chunkPath = path.join(chunkDirectory, `${flowIdentifier}.${num}`);
        const chunkData = fs.readFileSync(chunkPath);

        // Append the chunk data to the complete file
        writeStream.write(chunkData);
        if (existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath); // Clean up the chunk after assembling it
        }
      });

      writeStream.end();

      console.log(`File ${filename_timestamp} has been successfully assembled`);

      // Respond with success
      return res.status(200).json({
        message: "File successfully uploaded",
        filename: filename_timestamp,
      });
    } else {
      return res.status(200).json({ message: "Chunk uploaded successfully" });
    }
  });
};
