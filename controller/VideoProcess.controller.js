import { chmodSync, existsSync, mkdirSync } from "fs";
import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import { fileInsvObject } from "../config/fileTest.config.js";
import { ws } from "../index.js";
import {
  darwinChmod,
  extrat_duration,
  generate_thumbnail,
} from "../services/FFmpegCameraProcess.services.js";
import {
  generateGoprofilesObject,
  generateInsvfilesObject,
} from "../services/Filestype.services.js";
import {
  full_process_gopro,
  full_process_insv,
  full_process_insv_x3,
  logErrorVideoProcess,
  logVideoProcess,
} from "../services/FullProcess.services.js";
import ObjectFileTest from "../services/ObjectFileTest.services.js";
import { LogSystem } from "../services/LogSystem.services.js";

export const insv_process = (req, res) => {
  try {
    const { idProjectVideo, room, files, camera, model } = req.body;
    const count = files.length;

    const filesProcess = [];

    for (const fileObject of files) {
      fileObject.room = room.toString();
      fileObject.camera = camera;

      const value = generateInsvfilesObject(fileObject);

      filesProcess.push(fileObject);

      // console.log(files);
      switch (model) {
        case "one-x2":
          full_process_insv(idProjectVideo, { ...fileObject, model, ...value });
          break;
        case "one-x3":
          full_process_insv_x3(idProjectVideo, {
            ...fileObject,
            model,
            ...value,
          });
          break;
        default:
          full_process_insv(idProjectVideo, { ...fileObject, model, ...value });
          break;
      }
    }

    logVideoProcess(
      "Traitement video",
      `Début traitement pour camera ${camera} - mode: ${model}`
    );
    return res.json({
      message: "processus en cours",
      room,
      camera,
      filesProcess,
      count,
    });
  } catch (error) {
    logErrorVideoProcess("Traitement video", `Erreur: ${error.message}`);
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const gopro_process = (req, res) => {
  try {
    const { idProjectVideo, room, files, camera } = req.body;
    const count = files.length;

    const filesProcess = [];

    for (const fileObject of files) {
      fileObject.room = room.toString();
      fileObject.camera = camera;

      const value = generateGoprofilesObject(fileObject);

      filesProcess.push(fileObject);

      full_process_gopro(idProjectVideo, { ...fileObject, ...value });
    }

    return res.json({
      message: "processus en cours",
      room,
      camera,
      filesProcess,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

/**Parti Test */
export const test_insv_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;

  //ws.of(WEBSOCKET_PATH).to(room).emit("hello");
  /*   const fileObject = new ObjectFileTest("insv").get_random_project();
  fileObject.room = "test";
  fileObject.camera = "insv";
  full_process_insv(fileObject); */
  return res.json({ message: "processus en cours", fileObject });
};

export const test_gopro_process = (req, res) => {
  /*   const fileObject = new ObjectFileTest("gopro").get_random_project();
  fileObject.room = "test";
  fileObject.camera = "insv";
  fileObject.room = room.toString();
  fileObject.camera = camera; */

  try {
    //ws.of(WEBSOCKET_PATH).to(channel_id).emit("hello");

    /*  full_process_gopro(fileObject); */
    return res.json({ message: "processus en cours", fileObject });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const compress_test = async (req, res) => {
  try {
    const { idProjectVideo, filePath, filename } = req.body;
    const destination = `${upload_dir}${DIRECTORY_SEPARATOR}project_${idProjectVideo}${DIRECTORY_SEPARATOR}1701999597089_GS010040`;
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true });
      chmodSync(destination, "777");
      // if (platform == "darwin") await darwinChmod(destination);
    }
    generate_thumbnail(filePath, destination, filename);
    return res.json({ message: "processus en cours" });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const getMetadataFile = async (req, res) => {
  try {
    const inputPath = req.body.inputPath;

    const result = await extrat_duration(inputPath);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};
