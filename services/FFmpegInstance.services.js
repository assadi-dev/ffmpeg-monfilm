import Ffmpeg from "fluent-ffmpeg";
import { ffmpegPath } from "../config/ffmpegComand.config.js";
import { __dirname, platform } from "../config/constant.config.js";

/**
 * Instance FFMPEG
 */
export default class FFmpegInstance {
  ffmpeg;

  constructor() {
    this.ffmpeg = Ffmpeg()
      .setFfmpegPath(ffmpegPath[platform].ffmpegPath)
      .setFfprobePath(ffmpegPath[platform].ffprobePath);
  }
}
