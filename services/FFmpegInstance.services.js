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

  /**
   * Obtenir les metadata du fichier
   */

  extract_metadata = (input) => {
    const { ffmpeg } = new FFmpegInstance();
    return new Promise((resolve, reject) => {
      ffmpeg.input(input);
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) reject(err);
        resolve(metadata);
      });
    });
  };
}
