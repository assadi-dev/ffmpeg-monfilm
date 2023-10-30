import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import {
  gopro_equirectangular,
  insv_equirectangular,
  merge_insv,
  video_compress,
} from "./FFmpegCameraProcess.services.js";

export const full_process_gopro = async (fileObject) => {
  try {
    console.log(`start gopro equirectangular for ${fileObject.filename}`);
    const equirectangular = await gopro_equirectangular(fileObject);
    const lowFilename = equirectangular.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      camera: fileObject.camera,
      room: fileObject.room,
      filename: fileObject.filename,
      input: equirectangular.output,
      output: `${upload_dir}${DIRECTORY_SEPARATOR}${lowFilename}`,
    };

    console.log(`start compress for ${equirectangular.filename}`);
    const compress_response = await video_compress(fileObjetctCompress);

    let high_quality = equirectangular.output;
    let low_quality = compress_response.output;

    console.table({ high_quality, low_quality });
  } catch (error) {
    return error;
  }
};

export const full_process_insv = async (fileObject) => {
  try {
    console.log(`start Fusion insv for ${fileObject.filename}`);
    const fusion = await merge_insv(fileObject);
    console.log(`start equirectangular insv for ${fusion.filename}`);
    const equirectantangular = await insv_equirectangular(fusion);
    console.log(`start compress insv for ${equirectantangular.filename}`);
    const lowFilename = equirectantangular.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      input: equirectantangular.output,
      output: `${upload_dir}\\${lowFilename}`,
    };
    const compress_response = await video_compress(fileObjetctCompress);
    let high_quality = equirectantangular.output;
    let low_quality = compress_response.output;

    console.table({ high_quality, low_quality });
  } catch (error) {
    return error;
  }
};
