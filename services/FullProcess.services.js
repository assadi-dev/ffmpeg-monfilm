import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import { feedbackStatus } from "../config/ffmpegComand.config.js";
import { ws } from "../index.js";
import {
  gopro_equirectangular,
  insv_equirectangular,
  merge_insv,
  video_compress,
} from "./FFmpegCameraProcess.services.js";
import { unlinkSync } from "fs";

export const full_process_gopro = async (fileObject) => {
  const room = fileObject?.room;

  try {
    console.log(`wait gopro equirectangular for ${fileObject.filename}`);
    let status = feedbackStatus;
    status.camera = "gopro";
    status.step = "equirectangular";
    status.filename = fileObject.filename;

    ws.to(room).emit("start", status);
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
  const room = fileObject?.room;
  let status = feedbackStatus;
  const filename = fileObject.filename;
  status.camera = "insv";
  status.step = "fusion";
  status.filename = filename;

  try {
    // console.log(`wait fusion insv for ${filename}`);
    ws.to(room).emit("start", status);
    //const fusion = await merge_insv(fileObject);
    let test = {
      room,
      filename,
      finalFilename: "VID_20181108_115140_00_012_dualfisheye.mp4",
      input: `${upload_dir}${DIRECTORY_SEPARATOR}VID_20181108_115140_00_012_dualfisheye.mp4`,
    };
    console.log(`wait equirectangular insv for ${filename}`);

    const equirectantangular = await insv_equirectangular(test);
    unlinkSync(test.input);

    console.log(`wait compress insv for ${filename}`);
    const lowFilename = equirectantangular.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      camera: fileObject.camera,
      room,
      filename: filename,
      input: equirectantangular.output,
      output: `${upload_dir}\\${lowFilename}`,
    };
    const compress_response = await video_compress(fileObjetctCompress);
    let high_quality = equirectantangular.output;
    let low_quality = compress_response.output;

    console.table({ high_quality, low_quality });
  } catch (error) {
    console.log(error.message);
    status.error = error.message;
    status.message = "error";
    ws.to(room).emit("error");
    return error;
  }
};
