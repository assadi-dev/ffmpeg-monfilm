import ffmpegOnProgress from "ffmpeg-on-progress";
import Ffmpeg from "fluent-ffmpeg";
import { ffmpegPath, gopropArgs } from "../config/ffmpegComand.config.js";
import {
  DIRECTORY_SEPARATOR,
  __dirname,
  platform,
  upload_dir,
} from "../config/constant.config.js";
import os from "os";
import { unlink } from "fs/promises";
import FFmpegInstance from "./FFmpegInstance.services.js";
import { ws } from "../index.js";

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
  const room = fileObject?.room;
  let totalDuration = 0;
  const filename = fileObject?.filename;

  const finalFilename = filename.replace(".insv", "_dualfisheye.mp4");

  const status = {
    id: fileObject.id,
    camera: fileObject?.camera,
    step: "fusion",
    message: "wait",
    filename,
    progress: 0,
    url: "",
    error: "",
  };

  const front = fileObject?.front;
  const back = fileObject?.back;
  const output = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}${finalFilename}`;

  const ffmpegCommand = ffmpeg;
  return new Promise((resolve) => {
    ffmpegCommand
      .addInput(front)
      .addInput(back)
      .complexFilter("hstack")
      .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
      .output(output)
      .on("start", (cmdline) => {
        console.log(`start fusion insv process for ${filename}`);
        status.message = "start";
        status.step = "fusion";
        ws.to(room).emit("start", status);
      })

      /*      .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
      .on("codecData", (data) => {
        totalDuration = parseInt(data.duration.replace(/:/g, ""));
      })
      .on(
        "progress",
        ffmpegOnProgress((progress) => {
          status.message = "progress";
          return emitProgress(progress, room, status);
        }),
        totalDuration
      )

      .on("end", () => {
        console.log(`Finished fusion for ${filename}`);

        status.message = "done";
        status.progress = 100;
        ws.to(room).emit("end", status);

        const result = { filename, finalFilename, output };
        resolve(result);
      })
      .on("error", (error) => {
        console.log(error.message);
        status.error = error.message;
        status.message = "error";
        ws.to(room).emit("error", status);
      })
      .run();
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
  const filename = fileObject.filename;
  const input = fileObject.input;
  const output = fileObject.input.replace("_dualfisheye.mp4", ".mp4");
  const room = fileObject.room;
  let totalDuration = 0;
  const id = fileObject.id;

  const status = {
    id,
    camera: fileObject?.camera,
    step: "equirectangular",
    message: "wait",
    filename,
    progress: 0,
    url: "",
    error: "",
  };

  const ffmpegCommand = ffmpeg;
  return new Promise((resolve) => {
    ffmpegCommand
      .addInput(input)
      .videoFilters("v360=dfisheye:equirect:ih_fov=190:iv_fov=190:roll=90")
      .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
      .output(output)
      .on("start", (cmdline) => {
        console.log(`start equirectangular insv process for ${filename}`);
        status.message = "start";
        status.step = "equirectangular";
        ws.to(room).emit("start", status);
      })
      .on("codecData", (data) => {
        // HERE YOU GET THE TOTAL TIME
        totalDuration = parseInt(data.duration.replace(/:/g, ""));
      })
      /*    .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
      .on(
        "progress",
        ffmpegOnProgress((progress) => {
          status.message = "progress";
          return emitProgress(progress, room, status);
        }),
        totalDuration
      )
      .on("end", () => {
        console.log(`Finished equrectangular insv processing for ${filename}`);

        status.message = "done";
        status.progress = 100;
        ws.to(room).emit("end", status);
        const result = {
          filename: fileObject.finalFilename.replace(
            "_dualfisheye.mp4",
            ".mp4"
          ),
          output,
        };
        resolve(result);
      })
      .on("error", (error) => {
        console.log(error.message);
        status.error = error.message;
        status.message = "error";
        ws.to(room).emit("error", status);
      })
      .run();
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
  try {
    const filename = fileObject.filename;
    const id = fileObject.id;
    const input = fileObject.path;
    const output = filename.replace(".360", ".mp4");
    const destination = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}${output}`;
    const room = fileObject?.room;
    let totalDuration = 0;

    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;

    const status = {
      id,
      camera: fileObject?.camera,
      step: "equirectangular",
      message: "wait",
      filename,
      progress: 0,
      url: "",
      error: "",
    };

    return new Promise((resolve) => {
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
        .output(destination)
        /*       .on("stderr", function (stderrLine) {
        console.log("Stderr output: " + stderrLine);
      }) */
        .on("start", () => {
          console.log(`start gopro equirectangular for ${filename}`);
          status.message = "start";
          status.step = "equirectangular";
          ws.to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          // HERE YOU GET THE TOTAL TIME
          totalDuration = parseInt(data.duration.replace(/:/g, ""));
        })
        .on(
          "progress",
          ffmpegOnProgress((progress) => {
            status.message = "progress";
            return emitProgress(progress, room, status);
          }),
          totalDuration
        )

        .on("end", () => {
          console.log(`Finished equirectangular for ${filename}`);

          const result = { filename: output, output: destination };
          status.message = "done";
          status.progress = 100;

          ws.to(room).emit("end", status);
          resolve(result);
        })
        .on("error", (error) => {
          console.log(error.message);

          status.error = error.message;
          status.message = "error";
          ws.to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    console.log(error.message);
  }
};

/**
 * **Compression de la video**
 * ```js
 *
 * fileObjetct = {filename:"", input:"", output: ""}
 *
 * ```
 *
 */
export const video_compress = (fileObjetct) => {
  try {
    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;
    const id = fileObjetct?.id;
    let totalDuration = 0;
    const room = fileObjetct?.room;
    const camera = fileObjetct?.camera;

    const status = {
      id,
      camera: camera,
      step: "compress",
      message: "idle",
      filename: fileObjetct.filename,
      progress: 0,
      url: "",
      error: "",
    };

    return new Promise((resolve) => {
      const { input, output } = fileObjetct;
      ffmpegCommand
        .addInput(input)
        .size("820x410")
        .addOutputOptions(["-preset", "fast", "-crf", "22"])
        .output(output)
        .on("start", (cmdline) => {
          status.message = "start";
          ws.to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          totalDuration = parseInt(data.duration.replace(/:/g, ""));
        })
        .on(
          "progress",
          ffmpegOnProgress((progress) => {
            status.message = "progress";
            return emitProgress(progress, room, status);
          }),
          totalDuration
        )
        .on("end", () => {
          console.log(`Finished compressing for ${input}`);
          status.message = "done";
          status.progress = 100;
          ws.to(room).emit("end", status);
          resolve({ input, output });
        })
        .on("error", (error) => {
          console.log(error.message);
          status.message = "erreur";
          status.error = error.message;
          ws.to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const test_ffmpeg = async (req, res) => {
  const { ffmpeg } = new FFmpegInstance();
  const promise = new Promise((resolve) => {
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
  let percent = (progress * 100).toFixed();
};

const emitProgress = (progress, room, status) => {
  //console.log("start progress", status.filename);
  status.progress = Number((progress * 100).toFixed());
  ws.to(room).emit("progress", status);
};
