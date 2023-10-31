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

  console.log(fileObject);

  full_process_insv(fileObject);

  return res.json({ message: "processus en cours" });
};

export const test_insv_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  const room = req.body?.room;
  // ws.to(room).emit("hello");
  const fileObject = new ObjectFileTest("insv").get_random_project();
  full_process_insv(fileObject);
  return res.json({ message: "processus en cours", fileObject });
};

export const test_gopro_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  const room = req.body?.room;
  const fileObject = new ObjectFileTest("gopro").get_random_project();

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
  const camera = req.body?.camera;
  const fileObject = req.body?.fileObject;

  fileObject.room = room.toString();
  fileObject.camera = camera;

  try {
    full_process_gopro(fileObject);
    return res.json({ message: "processus en cours" });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};
