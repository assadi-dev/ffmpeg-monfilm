import { __dirname, domain } from "../config/constant.config.js";
import { extrat_duration } from "../services/FFmpegCameraProcess.services.js";

export const upload_gopro = (req, res) => {
  const idProjectvideo = req.body?.idProjectvideo;

  let filesData = [...req?.files].map((item) => ({
    filename: item.filename,
    path: `${domain}/uploads/${item.filename}`,
  }));

  let jsonRes = { idProjectvideo, filesData };
  return res.json(jsonRes);
};
