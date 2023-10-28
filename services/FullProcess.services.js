import { upload_dir } from "../config/constant.js";
import {
  gopro_equirectangular,
  video_compress,
} from "./FFmpegCameraProcess.services.js";

export const full_process_gopro = async (fileObject) => {
  try {
    console.log(`start gopro equirectangular for ${fileObject.filename}`);

    const response = await gopro_equirectangular(fileObject);
    const lowFilename = response.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      input: response.output,
      output: `${upload_dir}\\${lowFilename}`,
    };

    console.log(`start compress for ${response.filename}`);
    const compress_response = await video_compress(fileObjetctCompress);

    let high_quality = response.output;
    let low_quality = compress_response.output;

    console.table({ high_quality, low_quality });
  } catch (error) {
    return error;
  }
};
