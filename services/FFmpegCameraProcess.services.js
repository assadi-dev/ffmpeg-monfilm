import ffmpegOnProgress from "ffmpeg-on-progress";
import Ffmpeg from "fluent-ffmpeg";
import { ffmpegPath, gopropArgs } from "../config/ffmpegComand.js";
import { __dirname, platform, upload_dir } from "../config/constant.js";
import os from "os";
import { unlink } from "fs/promises";
import FFmpegInstance from "./FFmpegInstance.services.js";

/**
 * Instance FFMPEG
 */
const ffmpeg = Ffmpeg()
  .setFfmpegPath(ffmpegPath[platform].ffmpegPath)
  .setFfprobePath(ffmpegPath[platform].ffprobePath);

/**
 * **Process Insta360**
 *
 * Fusion des videos
 * @param {*} fileObject contient les données des fichiers à traiter, format attendu .insv
 *
 * ```js
 * const fileObject ={
 *  front:{
 *    url:"",
 *    path:""
 *  },
 * back:{
 *    url:"",
 *    path:""
 *  }
 * }
 * ```
 * @return Fichier mp4 en vue dualfisheye
 */
export const merge_insv = async (fileObject) => {
  /*  const filename = files.filename;
  const input = `${__dirname}/uploads/${filename}`; */
  const front = `${__dirname}/uploads/insv/VID_20181108_115140_00_012.insv`;
  const back = `${__dirname}/uploads/insv/VID_20181108_115140_10_012.insv`;
  const output = "VID_20181108_115140_00_012.insv"
    .replace(".insv", "_dualfisheye.mp4")
    .replace("_00_", "_");
  const destination = `${__dirname}/uploads/${output}`;
  const fileProcessEnded = [];

  const ffmpegCommand = ffmpeg;
  ffmpegCommand
    .addInput(front)
    .addInput(back)

    .complexFilter("hstack")
    .outputOptions(["-c:v libx264"])
    .on("start", (cmdline) => console.log(cmdline))
    .saveToFile(destination)
    /*.on("stderr", function (stderrLine) {
      console.log("Stderr output: " + stderrLine);
    })*/
    .on("progress", logProgress)
    .on("end", () => {
      console.log("Finished processing");
      // insv_equirectangular(destination);
    })
    .on("error", (error) => {
      console.log(error.message);
      //throw new Error(error.message);
    });
};

/**
 * **Process Insta360**
 *
 * Transformation des videos dualfisheye en equirectangulare
 * @param {*} files contient les données des fichiers à traiter, format attendu .mp4
 * @return Fichier mp4 en vue equirectangulare
 */
export const insv_equirectangular = async (filepath) => {
  const input = filepath;

  const output = filepath.replace("_dualfisheye.mp4", ".mp4");
  const ffmpegCommand = ffmpeg;

  ffmpegCommand
    .addInput(input)
    .videoFilters("v360=dfisheye:equirect:ih_fov=190:iv_fov=190:roll=90")
    .outputOptions(["-c:v", "libx264"])
    .saveToFile(output)
    .on("start", (cmdline) => console.log(cmdline))
    .on("progress", logProgress)
    .on("end", () => {
      console.log("Finished processing");
    })
    .on("error", (error) => {
      console.log(error.message);
    });
};

/**
 * **Process gopro**
 *
 * @param {*} fileObject contient les données des fichiers à traiter, format attendu .360
 *
 * ```js
 * const fileObject = {filename:"",path:""}
 *
 * ```
 *
 * @return Fichier mp4 en vue equirectangulaire
 */
export const gopro_equirectangular = async (fileObject) => {
  const filename = fileObject.filename;
  const input = fileObject.path;
  const output = filename.replace(".360", ".mp4");
  const destination = `${__dirname}\\uploads\\${output}`;

  const { ffmpeg } = new FFmpegInstance();
  const ffmpegCommand = ffmpeg;

  return new Promise((resolve, reject) => {
    ffmpegCommand
      .addInput(input)
      .complexFilter([
        {
          filter: "crop",
          inputs: "0:0",
          options: gopropArgs,
          outputs: `tkorp`,
        },
      ])
      .outputOptions([
        "-map",
        "[tkorp]",
        "-map",
        "0:a:0",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
      ])
      .saveToFile(destination)
      /*       .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
      /*     .on("start", (cmdline) => console.log(cmdline)) */
      .on("progress", logProgress)
      .on("end", async () => {
        console.log("Finished processing");
        await unlink(`${upload_dir}\\${filename}`);
        resolve({ filename: output, output: destination });
      })
      .on("error", (error) => {
        console.log(error.message);
      });
  });
};

/**
 * **Compression de la video**
 * ```js
 *
 * fileObjetct = { input:"", output: ""}
 *
 * ```
 *
 */
export const video_compress = (fileObjetct) => {
  const { ffmpeg } = new FFmpegInstance();
  const ffmpegCommand = ffmpeg;
  const { input, output } = fileObjetct;
  return new Promise((resolve, reject) => {
    ffmpegCommand
      .addInput(input)
      .size("820x410")
      .addOutputOptions(["-preset", "fast", "-crf", "22"])
      .saveToFile(output)
      .on("start", (cmdline) => console.log(cmdline))
      .on("progress", logProgress)
      .on("end", () => {
        console.log(`Finished compressing for ${input}`);
        resolve({ input, output });
      })
      .on("error", (error) => {
        console.log(error.message);
      });
  });
};

export const test_ffmpeg = async (req, res) => {
  const promise = new Promise((resolve, reject) => {
    ffmpeg
      .save("output.test")
      /*.on("start", (cmdLine) => (cmdLine = cmd))*/
      .on("stderr", function (stderrLine) {
        resolve(stderrLine);
      })
      .on("error", (error) => {
        // console.log(error.message);
      });
  });

  try {
    return res.json({
      platform,
      ffmpeg: await promise,
    });
  } catch (error) {
    return res.code(500).json({ message: error.message });
  }
};

/**
 * Obtenir la durée de la video
 */

export const extrat_duration = (input) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata.format.duration);
    });
  });
};

/**
 * Obtention de la progression du process
 */
const logProgress = (progress) => {
  // let percent = (progress * 100).toFixed();
  console.table(progress);
};
