import { fileInsvObject } from "../config/fileTest.config.js";
import { ws } from "../index.js";
import {
  full_process_gopro,
  full_process_insv,
} from "../services/FullProcess.services.js";
import ObjectFileTest from "../services/ObjectFileTest.services.js";

export const insv_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  const room = req.body?.room;

  const fileObject = req.body?.fileObject;
  fileObject.room = room.toString();
  fileObject.camera = req.body?.camera;

  full_process_insv(fileObject);

  return res.json({ message: "processus en cours", fileObject });
};

export const test_insv_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;

  // ws.to(room).emit("hello");
  const fileObject = new ObjectFileTest("insv").get_random_project();
  fileObject.room = "test";
  fileObject.camera = "insv";
  full_process_insv(fileObject);
  return res.json({ message: "processus en cours", fileObject });
};

export const test_gopro_process = (req, res) => {
  const fileObject = new ObjectFileTest("gopro").get_random_project();
  fileObject.room = "test";
  fileObject.camera = "insv";
  fileObject.room = room.toString();
  fileObject.camera = camera;

  try {
    // ws.to(channel_id).emit("hello");

    full_process_gopro(fileObject);
    return res.json({ message: "processus en cours", fileObject });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const gopro_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  const room = req.body?.room;
  const files = req?.body.files;
  const camera = req.body?.camera;
  const count = files.length;

  try {
    const filesProcess = [];

    for (const fileObject of files) {
      fileObject.room = room.toString();
      fileObject.camera = camera;

      const value = {
        id: fileObject.id,
        filename: fileObject.filename,
        camera: fileObject.camera,
        progress: 0,
      };

      filesProcess.push(value);

      full_process_gopro(fileObject);
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
