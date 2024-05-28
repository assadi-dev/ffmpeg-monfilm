import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import path from "path";
import fs, { existsSync } from "fs";
import { toSlugify } from "../services/Filestype.services.js";

export const flow_upload = (req, res) => {
	const {
		flowChunkNumber,
		// flowChunkSize,
		// flowTotalSize,
		flowIdentifier,
		flowFilename,
		flowTotalChunks,
	} = req.body;

	const chunkDirectory = `${upload_dir}${DIRECTORY_SEPARATOR}chunk`;
	const completeDirectory = `${upload_dir}`;

	const dt = new Date();
	const filename_timestamp = `${dt.getTime()}_${toSlugify(flowFilename)}`;
	const chunkFilename = `${flowIdentifier}.${flowChunkNumber}`;
	const chunkPath = path.join(chunkDirectory, chunkFilename);

	// Move the uploaded chunk to the appropriate directory
	fs.rename(req.file.path, chunkPath, (err) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Error saving chunk");
		}

		const chunkNumbers = Array.from({ length: flowTotalChunks }, (_, i) => i + 1);

		const allChunksReceived = chunkNumbers.every((num) => {
			return existsSync(path.join(chunkDirectory, `${flowIdentifier}.${num}`));
		});

		if (allChunksReceived) {
			// All chunks have been received; assemble the complete file
			const completeFilePath = path.join(completeDirectory, filename_timestamp);
			const writeStream = fs.createWriteStream(completeFilePath);

			// Use an async function to handle stream operations
			(async () => {
				for (const num of chunkNumbers) {
					const chunkPath = path.join(chunkDirectory, `${flowIdentifier}.${num}`);
					await new Promise((resolve, reject) => {
						const readStream = fs.createReadStream(chunkPath);
						readStream.pipe(writeStream, { end: false });
						readStream.on("error", reject);
						readStream.on("end", () => {
							fs.unlink(chunkPath, (err) => {
								if (err) {
									console.error(`Error removing chunk ${chunkPath}:`, err);
									reject(err);
								} else {
									console.log(`Chunk ${chunkPath} has been removed.`);
									resolve();
								}
							});
						});
					});
				}
				writeStream.end();
				console.log(`File ${filename_timestamp} has been successfully assembled`);
				res.status(200).json({
					message: "File successfully uploaded",
					filename: filename_timestamp,
				});
			})().catch((err) => {
				console.error("Failed to assemble file:", err);
				res.status(500).send("Error assembling file");
			});
		} else {
			res.status(200).json({ message: "Chunk uploaded successfully" });
		}
	});
};
