import {
  DIRECTORY_SEPARATOR,
  FTP_CREDENTIALS,
  FTP_DESTINATION_DIR,
  FTP_ENDPOINT,
  upload_dir,
} from "../config/constant.config.js";
import { feedbackStatus } from "../config/ffmpegComand.config.js";
import { ws } from "../index.js";
import {
  gopro_equirectangular,
  insv_equirectangular,
  merge_insv,
  video_compress,
} from "./FFmpegCameraProcess.services.js";
import { unlinkSync } from "fs";
import FTPServices from "./FTPServices.services.js";

export const full_process_gopro = async (fileObject) => {
  const room = fileObject?.room;
  const id = fileObject.id;
  let statusStep = feedbackStatus;
  statusStep.id = id;
  statusStep.camera = "gopro";
  statusStep.step = "equirectangular";
  statusStep.filename = fileObject.filename;

  try {
    console.log(`wait gopro equirectangular for ${fileObject.filename}`);

    ws.to(room).emit("start", statusStep);
    const equirectangular = await gopro_equirectangular(fileObject);
    const lowFilename = equirectangular.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      id,
      camera: fileObject.camera,
      room: fileObject.room,
      filename: fileObject.filename,
      input: equirectangular.output,
      output: `${upload_dir}${DIRECTORY_SEPARATOR}${lowFilename}`,
    };

    console.log(`start compress for ${equirectangular.filename}`);
    const compress_response = await video_compress(fileObjetctCompress);

    const high_quality = equirectangular.output;
    const low_quality = compress_response.output;

    //Envoie FTP
    console.log("start sen FTP");
    const ftp_destination = `${FTP_DESTINATION_DIR}/${lowFilename}`;
    const URL_LOW = await sendProcess(
      low_quality,
      ftp_destination,
      lowFilename
    );
    //FIN FTP
    console.table({ high_quality, low_quality: URL_LOW });
  } catch (error) {
    console.log(error.message);
    statusStep.error = error.message;
    statusStep.message = "error";
    ws.to(room).emit("error", statusStep);
    return error;
  }
};

export const full_process_insv = async (fileObject) => {
  const room = fileObject?.room;
  let status = feedbackStatus;
  const filename = fileObject.filename;
  const id = fileObject.id;

  status.id = id;
  status.camera = "insv";
  status.step = "fusion";
  status.filename = filename;

  try {
    console.log(`wait fusion insv for ${filename}`);
    ws.to(room).emit("start", status);
    const fusion = await merge_insv(fileObject);
    let toEquirectangular = {
      id,
      room,
      filename: fusion.filename,
      finalFilename: fusion.finalFilename,
      input: fusion.output,
    };
    console.log(`wait equirectangular insv for ${filename}`);

    const equirectantangular = await insv_equirectangular(toEquirectangular);
    //unlinkSync(toEquirectangular.input);

    console.log(`wait compress insv for ${filename}`);
    const lowFilename = equirectantangular.filename.replace(".mp4", "_low.mp4");

    const fileObjetctCompress = {
      id,
      camera: fileObject.camera,
      room,
      filename: filename,
      input: equirectantangular.output,
      output: `${upload_dir}${DIRECTORY_SEPARATOR}${lowFilename}`,
    };
    const compress_response = await video_compress(fileObjetctCompress);
    const high_quality = equirectantangular.output;
    const low_quality = compress_response.output;
    console.table({ high_quality, low_quality });
    //Envoie FTP
    console.log("Envoie FTP");
    const ftp_destination = `${FTP_DESTINATION_DIR}/${lowFilename}`;
    const URL_LOW = sendProcess(low_quality, ftp_destination, lowFilename);
    console.log(URL_LOW);
  } catch (error) {
    console.log(error.message);
    status.error = error.message;
    status.message = "error";
    ws.to(room).emit("error", status);
    return error;
  }
};

/**
 *
 * @param {*} source emplacement du fichier source
 * @param {*} destination emplacement du fichier de destination
 * @param {*} filename nom du fichier distant
 * @returns le liens ftp du fichiers uploadé
 */
const sendProcess = async (source, destination, filename) => {
  try {
    const ftpservices = new FTPServices(FTP_CREDENTIALS);

    await ftpservices.connect();
    await ftpservices.send(source, destination);
    const link = `${FTP_ENDPOINT}/${filename}`;
    return link;
  } catch (error) {
    throw new Error(error);
  }
};
