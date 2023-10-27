import { ws } from "../index.js";
import {
  insv_equirectangular,
  merge_insv,
} from "../services/FFmpegCameraProcess.services.js";
import { full_process_gopro } from "../services/FullProcess.services.js";

export const insv_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  let room = req.body?.room;
  let filename = req.body?.filename;

  //merge_insv({ front: "", back: "" });
  const filpath =
    "C:\\laragon\\www\\Sandbox\\Node-JS\\websocket\\ffmpeg-monfilm\\uploads\\VID_20181108_115140_012_dualfisheye.mp4";
  insv_equirectangular(filpath);

  return res.json({ message: "processus en cours" });
};

export const gopro_process = (req, res) => {
  const idProjectVideo = req.body?.idProjectVideo;
  let room = req.body?.room;
  let filename = req.body?.filename;
  const fileObject = req.body?.fileObject;
  //`${__dirname}/uploads/${filename}`
  try {
    // ws.to(channel_id).emit("hello");
    full_process_gopro(fileObject);
    return res.json({ message: "processus en cours" });
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};
