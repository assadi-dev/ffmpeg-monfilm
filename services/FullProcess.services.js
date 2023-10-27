import {
  gopro_equirectangular,
  video_compress,
} from "./FFmpegCameraProcess.services.js";

export const process_gopro = async (fileObject) => {
  try {
    const response = await gopro_equirectangular(fileObject);
    const lowFilename = response.output.replace(".mp4", "_low.mp4");
    const fileObjetctCompress = {
      input: response.output,
      output: lowFilename,
    };
    const compress_response = await video_compress(fileObjetctCompress);

    let high_quality = response.output;
    let low_quality = compress_response.output;
  } catch (error) {
    return error;
  }
};
