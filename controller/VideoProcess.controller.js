import { chmodSync, existsSync, mkdirSync } from "fs";
import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import { fileInsvObject } from "../config/fileTest.config.js";
import { ws } from "../index.js";
import { generate_thumbnail } from "../services/FFmpegCameraProcess.services.js";
import {
  generateGoprofilesObject,
  generateInsvfilesObject,
} from "../services/Filestype.services.js";
import {
  full_process_gopro,
  full_process_insv,
} from "../services/FullProcess.services.js";
import ObjectFileTest from "../services/ObjectFileTest.services.js";

export const insv_process = (req, res) => {
  try {
    const { idProjectVideo, room, files, camera } = req.body;
    const count = files.length;

    const filesProcess = [];

    for (const fileObject of files) {
      fileObject.room = room.toString();
      fileObject.camera = camera;

      const value = generateInsvfilesObject(fileObject);

      filesProcess.push(value);

      // console.log(files);

      full_process_insv(fileObject);
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

export const gopro_process = (req, res) => {
  try {
    const { idProjectVideo, room, files, camera } = req.body;
    const count = files.length;

    const filesProcess = [];

    for (const fileObject of files) {
      fileObject.room = room.toString();
      fileObject.camera = camera;

      const value = generateGoprofilesObject(fileObject);

      filesProcess.push(value);

      full_process_gopro(idProjectVideo, fileObject);
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

  // ws.to(room).emit("hello");
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
    // ws.to(channel_id).emit("hello");

    /*  full_process_gopro(fileObject); */
    return res.json({ message: "processus en cours", fileObject });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const compress_test = (req, res) => {
  try {
    const { idProjectVideo, filePath, filename } = req.body;
    const destination = `${upload_dir}${DIRECTORY_SEPARATOR}project_${idProjectVideo}`;
    if (!existsSync(destination)) {
      mkdirSync(destination);
      chmodSync(destination, 777);
    }
    generate_thumbnail(filePath, destination, filename);
    return res.json({ message: "processus en cours" });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};
