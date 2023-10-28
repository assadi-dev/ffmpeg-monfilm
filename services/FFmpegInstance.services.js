import Ffmpeg from "fluent-ffmpeg";
import { ffmpegPath } from "../config/ffmpegComand.js";
import { __dirname, platform } from "../config/constant.js";

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
