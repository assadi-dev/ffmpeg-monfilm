import ffmpegOnProgress from "ffmpeg-on-progress";
import Ffmpeg from "fluent-ffmpeg";
import { ffmpegPath, gopropArgs } from "../config/ffmpegComand.js";
import { __dirname, platform, upload_dir } from "../config/constant.js";
import os from "os";
import { unlink } from "fs/promises";
import FFmpegInstance from "./FFmpegInstance.services.js";

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
  const { ffmpeg } = new FFmpegInstance();
  /*  const filename = files.filename;
  const input = `${__dirname}/uploads/${filename}`; */
  const finalFilename = fileObject?.filename.replace(
    ".insv",
    "_dualfisheye.mp4"
  );

  const front = fileObject?.front;
  const back = fileObject?.back;
  const output = `${__dirname}\\uploads\\${finalFilename}`;

  const ffmpegCommand = ffmpeg;
  return new Promise((resolve) => {
    ffmpegCommand
      .addInput(front)
      .addInput(back)
      .complexFilter("hstack")
      .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
      .saveToFile(output)
      /*   .on("start", (cmdline) => console.log(cmdline)) */

      /*      .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
      .on("progress", logProgress)
      .on("end", () => {
        console.log(`Finished fusion for ${fileObject?.filename}`);
        // unlink(`${upload_dir}\\${filename}`);
        const result = { filename: finalFilename, output };
        resolve(result);
      })
      .on("error", (error) => {
        console.log(error.message);
      });
  });
};

/**
 * **Process Insta360**
 *
 * Transformation des videos dualfisheye en equirectangulare
 * @param {*} fileObject contient les données des fichiers à traiter, format attendu .mp4
 * @return Fichier mp4 en vue equirectangulare
 */
export const insv_equirectangular = async (fileObject) => {
  const { ffmpeg } = new FFmpegInstance();

  const input = fileObject.output;
  const output = fileObject.output.replace("_dualfisheye.mp4", ".mp4");
  const ffmpegCommand = ffmpeg;
  return new Promise((resolve) => {
    ffmpegCommand
      .addInput(input)
      .videoFilters("v360=dfisheye:equirect:ih_fov=190:iv_fov=190:roll=90")
      .outputOptions(["-c:v", "libx264"])
      .saveToFile(output)
      /*  .on("start", (cmdline) => console.log(cmdline)) */
      /*    .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
      .on("progress", (progress) => console.log(progress))
      .on("end", () => {
        console.log(`Finished processing for ${fileObject.filename}`);
        const result = {
          filename: fileObject.filename.replace("_dualfisheye.mp4", ".mp4"),
          output,
        };
        unlink(input);
        resolve(result);
      })
      .on("error", (error) => {
        console.log(error.message);
      });
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
      .on("end", () => {
        console.log("Finished processing");
        // unlink(`${upload_dir}\\${filename}`);
        const result = { filename: output, output: destination };
        resolve(result);
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

  return new Promise((resolve) => {
    const { input, output } = fileObjetct;
    ffmpegCommand
      .addInput(input)
      .size("820x410")
      .addOutputOptions(["-preset", "fast", "-crf", "22"])
      .saveToFile(output)
      /*    .on("start", (cmdline) => console.log(cmdline)) */
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
  const { ffmpeg } = new FFmpegInstance();
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
  const { ffmpeg } = new FFmpegInstance();
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
  // console.table(progress);
};
