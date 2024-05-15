import ffmpegOnProgress from "ffmpeg-on-progress";
import Ffmpeg from "fluent-ffmpeg";
import {
  ffmpegPath,
  gopropArgs,
  instaArgsX2,
  instaArgsX3,
} from "../config/ffmpegComand.config.js";
import {
  DIRECTORY_SEPARATOR,
  WEBSOCKET_PATH,
  __dirname,
  platform,
  upload_dir,
} from "../config/constant.config.js";
import os from "os";
import { unlink } from "fs/promises";
import FFmpegInstance from "./FFmpegInstance.services.js";
import { ws } from "../index.js";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { postDelayed } from "./Filestype.services.js";
import {
  DEFAULT_DEBOUNCE_DELAY,
  DEFAULT_DELETE_FILE_DELAY,
} from "../config/event.js";
import {
  logErrorVideoProcess,
  logVideoProcess,
  remove_file_delayed,
} from "./FullProcess.services.js";

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
  const fps = 25;
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
    type: "video",
    duration: 0,
  };
  try {
    const front = fileObject?.front;
    const back = fileObject?.back;
    const output = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}${finalFilename}`;

    const ffmpegCommand = ffmpeg;
    return new Promise((resolve) => {
      ffmpegCommand
        .addInput(front)
        .addInput(back)
        .complexFilter("hstack")
        .outputOptions(["-r", fps, "-c:v", "libx264", "-c:a", "aac"])
        .output(output)
        .on("start", (cmdline) => {
          console.log(`start fusion insv process for ${filename}`);
          logVideoProcess(
            "Traitement video",
            `start fusion insv process for ${filename}`
          );
          logVideoProcess("Traitement video", `command ffmpeg: ${cmdline}`);

          status.message = "start";
          status.step = "fusion";
          ws.of(WEBSOCKET_PATH).to(room).emit("start", status);
        })

        /*      .on("stderr", function (stderrLine) {
          console.log("Stderr output: " + stderrLine);
        }) */
        .on("codecData", (data) => {
          totalDuration = Number(data.duration.replace(/:/g, ""));
          status.duration = totalDuration;
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
          logVideoProcess(
            "Traitement video",
            `Finished fusion insv for ${filename}`
          );

          status.message = "done";
          status.progress = 100;
          ws.of(WEBSOCKET_PATH).to(room).emit("end", status);
          clean_file_process(front);
          clean_file_process(back);
          const result = {
            filename,
            finalFilename,
            output,
            duration: status.duration,
          };
          resolve(result);
        })
        .on("error", (error) => {
          console.log(error.message);
          clean_file_process(front);
          clean_file_process(back);
          status.error = error.message;
          status.message = "error";
          logErrorVideoProcess(
            "Traitement video",
            `Erreur fusion insv for ${filename} - ${error.message}`
          );
          ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    status.error = error.message;
    status.message = "error";
    logErrorVideoProcess(
      "Traitement video",
      `Erreur fusion insv for ${filename} - ${error.message}`
    );
    ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
  }
};

/**
 * **Process Insta360**
 *
 * Transformation des videos dualfisheye en equirectangulare model ONE X2
 * @param {*} fileObject contient les données des fichiers à traiter, format attendu .mp4
 * @return Fichier mp4 en vue equirectangulare
 */
export const insv_equirectangular = async (fileObject) => {
  const id = fileObject.id;
  const filename = fileObject.filename;
  const input = fileObject.input;
  const output = fileObject.input.replace("_dualfisheye.mp4", ".mp4");
  const room = fileObject.room;
  let totalDuration = 0;
  const status = {
    id,
    camera: fileObject?.camera,
    step: "equirectangular",
    message: "wait",
    filename,
    progress: 0,
    url: "",
    error: "",
    type: "video",
    duration: 0,
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;
    return new Promise((resolve) => {
      ffmpegCommand
        .addInput(input)
        .videoFilters(instaArgsX2)
        .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
        .output(output)
        .on("start", (cmdline) => {
          console.log(
            `start equirectangular insv insv One X2 process for ${filename}`
          );
          logVideoProcess(
            "Traitement video",
            `start equirectangular insv insv One X2 process for ${filename}`
          );
          logVideoProcess("Traitement video", `command ffmpeg: ${cmdline}`);
          status.message = "start";
          status.step = "equirectangular";
          ws.of(WEBSOCKET_PATH).to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          // HERE YOU GET THE TOTAL TIME
          totalDuration = Number(data.duration.replace(/:/g, ""));
          status.duration = totalDuration;
        })
        /*.on("stderr", function (stderrLine) {
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
          console.log(
            `Finished quirectangular insv processing for ${filename}`
          );
          logVideoProcess(
            "Traitement video",
            `Finished quirectangular insv processing for ${filename}`
          );

          status.message = "done";
          status.progress = 100;
          ws.of(WEBSOCKET_PATH).to(room).emit("end", status);
          clean_file_process(input);
          const result = {
            filename: fileObject.finalFilename.replace(
              "_dualfisheye.mp4",
              ".mp4"
            ),
            output,
            duration: status.duration,
          };
          resolve(result);
        })
        .on("error", (error) => {
          console.log(error.message);
          clean_file_process(input);
          status.error = error.message;
          status.message = "error";
          logErrorVideoProcess(
            "Traitement video",
            `Erreur insv equirectangular for ${filename} - ${error.message}`
          );
          ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    status.error = error.message;
    status.message = "error";
    ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
    logErrorVideoProcess(
      "Traitement video",
      `Erreur insv equirectangular for ${filename} - ${error.message}`
    );
  }
};
/**
 * **Process Insta360**
 *
 * Transformation des videos dualfisheye en equirectangulare model ONE X3
 * @param {*} fileObject contient les données des fichiers à traiter, format attendu .mp4
 * @return Fichier mp4 en vue equirectangulare
 */
export const insv_equirectangular_x3 = async (fileObject) => {
  const id = fileObject.id;
  const filename = fileObject.filename;
  const input = fileObject.input;
  const output = fileObject.input.replace("_dualfisheye.mp4", ".mp4");
  const room = fileObject.room;
  let totalDuration = 0;
  const fps = 25;
  const status = {
    id,
    camera: fileObject?.camera,
    step: "equirectangular",
    message: "wait",
    filename,
    progress: 0,
    url: "",
    error: "",
    type: "video",
    duration: 0,
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;
    return new Promise((resolve) => {
      ffmpegCommand
        .addInput(input)
        .videoFilters(instaArgsX3)
        .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
        .output(output)
        .on("start", (cmdline) => {
          console.log(
            `start equirectangular insv One X3 process for ${filename}`
          );
          logVideoProcess(
            "Traitement video",
            `start equirectangular insv One X3 process for ${filename}`
          );
          logVideoProcess("Traitement video", `command ffmpeg: ${cmdline}`);
          status.message = "start";
          status.step = "equirectangular";
          ws.of(WEBSOCKET_PATH).to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          // HERE YOU GET THE TOTAL TIME
          totalDuration = Number(data.duration.replace(/:/g, ""));
          status.duration = totalDuration;
        })
        /*.on("stderr", function (stderrLine) {
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
          console.log(
            `Finished equirectangular insv processing for ${filename}`
          );
          logVideoProcess(
            "Traitement video",
            `Finished equirectangular insv processing for ${filename}`
          );

          status.message = "done";
          status.progress = 100;
          ws.of(WEBSOCKET_PATH).to(room).emit("end", status);
          clean_file_process(input);
          const result = {
            filename: fileObject.finalFilename.replace(
              "_dualfisheye.mp4",
              ".mp4"
            ),
            output,
            duration: status.duration,
          };
          resolve(result);
        })
        .on("error", (error) => {
          clean_file_process(input);
          console.log(error.message);
          status.error = error.message;
          status.message = "error";
          logErrorVideoProcess(
            "Traitement video",
            `Erreur insv equirectangular for ${filename} - ${error.message}`
          );
          ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    status.error = error.message;
    status.message = "error";
    ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
    logErrorVideoProcess(
      "Traitement video",
      `Erreur insv equirectangular for ${filename} - ${error.message}`
    );
  }
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
  const id = fileObject.id;
  const input = fileObject.path;
  const output = filename.replace(".360", ".mp4");
  const destination = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}${output}`;
  const room = fileObject?.room;
  let totalDuration = 0;
  const fps = 25;

  const status = {
    id,
    camera: fileObject?.camera,
    step: "equirectangular",
    message: "wait",
    filename,
    progress: 0,
    url: "",
    error: "",
    type: "video",
    duration: 0,
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;

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
          "-r",
          fps,
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
        .on("start", (cmdline) => {
          console.log(`start gopro equirectangular for ${filename}`);
          logVideoProcess(
            "Traitement video",
            `start gopro equirectangular for ${filename}`
          );
          logVideoProcess("Traitement video", `command ffmpeg: ${cmdline}`);
          status.message = "start";
          status.step = "equirectangular";
          ws.of(WEBSOCKET_PATH).to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          // HERE YOU GET THE TOTAL TIME
          totalDuration = Number(data.duration.replace(/:/g, ""));
          status.duration = totalDuration;
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
          logVideoProcess(
            "Traitement video",
            `Finished gopro equirectangular for ${filename}`
          );

          const result = {
            filename: output,
            output: destination,
            duration: status.duration,
          };
          status.message = "done";
          status.progress = 100;

          ws.of(WEBSOCKET_PATH).to(room).emit("end", status);
          clean_file_process(input);
          resolve(result);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess(
            "Traitement video",
            `Erreur gopro equirectangular for ${filename} - ${error.message}`
          );
          clean_file_process(input);
          status.error = error.message;
          status.message = "error";
          ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    logErrorVideoProcess("Traitement video", `Erreur - ${error.message}`);
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
    type: "video",
    duration: 0,
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    const ffmpegCommand = ffmpeg;

    return new Promise((resolve) => {
      const { input, output } = fileObjetct;
      ffmpegCommand
        .addInput(input)
        .size("820x410")
        .addOutputOptions(["-preset", "fast", "-crf", "22"])
        .output(output)
        .on("start", (cmdline) => {
          status.message = "start";
          logVideoProcess(
            "Compression video",
            `Start compressing for ${input}`
          );
          logVideoProcess("Compression video", `command ffmpeg: ${cmdline}`);
          ws.of(WEBSOCKET_PATH).to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          totalDuration = Number(data.duration.replace(/:/g, ""));
          status.duration = totalDuration;
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
          logVideoProcess(
            "Compression video",
            `Finished compressing for ${input}`
          );
          status.message = "done";
          status.progress = 100;
          ws.of(WEBSOCKET_PATH).to(room).emit("end", status);
          resolve({ input, output, duration: status.duration });
        })
        .on("error", (error) => {
          console.log(error.message);
          status.message = "erreur";
          status.error = error.message;
          ws.of(WEBSOCKET_PATH).to(room).emit("error", status);
        })
        .run();
    });
  } catch (error) {
    console.log(error.message);
    logErrorVideoProcess("Compression video", `Erreur - ${error.message}`);
    status.message = "erreur";
    status.error = error.message;
    ws.of(WEBSOCKET_PATH).to(room).emit("error", error.message);
  }
};

/**
 * Génération du thumbnail video
 * @param {string} input emplacement du fichier d'entré
 * @param {string} destination emplacement du dossier de sortie
 * @param {string} filename nom à attribuer au fichier jpeg
 * @returns
 */
export const generate_thumbnail = (input, destination) => {
  const { ffmpeg } = new FFmpegInstance();
  return new Promise(async (resolve, reject) => {
    try {
      //Recupere une frame par secondes

      ffmpeg
        .addInput(input)
        .outputOptions(["-r 1", "-s 820x410"])
        .output(`${destination}${DIRECTORY_SEPARATOR}%0d.jpeg`);
      ffmpeg.on("start", (cmdline) => {
        //console.log(cmdline);
        logVideoProcess("Génération des thumbnail", `start extract frame`);
        logVideoProcess(
          "Génération des thumbnail",
          `command ffmpeg: ${cmdline}`
        );
      });
      ffmpeg.on("end", async () => {
        console.log("finish extract frame");
        logVideoProcess("Génération des thumbnail", `finish extract frame`);
        const files = readdirSync(destination);
        const jpegOutput = `${destination}${DIRECTORY_SEPARATOR}thumbnail.jpeg`;
        const finalPic = await concate_frames(
          `${destination}${DIRECTORY_SEPARATOR}%d.jpeg`,
          files.length,
          jpegOutput
        );
        resolve(finalPic);
      });
      ffmpeg.on("error", (error) => {
        console.log(error);
        logErrorVideoProcess(
          `Génération des thumbnail","Erreur: ${error.message}`
        );
      });
      ffmpeg.run();
    } catch (error) {
      logErrorVideoProcess(
        `Génération des thumbnail","Erreur: ${error.message}`
      );
    }
  });
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
  ws.of(WEBSOCKET_PATH).to(room).emit("progress", status);
};

/**
 * concatenation des frame jpeg
 * @param {*} framesDir
 * @param {*} totalFrames
 * @param {*} output
 * @returns retourne l'image en base64
 */
export const concate_frames = (framesDir, totalFrames, output) => {
  return new Promise((resolve, reject) => {
    const { ffmpeg } = new FFmpegInstance();

    if (totalFrames > 60) totalFrames = 220;

    try {
      ffmpeg
        .input(framesDir)
        .complexFilter(`scale=200:200,tile=${totalFrames}x1`)
        .outputOptions(["-frames:v 1"])
        .output(`${output}`)
        .run();

      ffmpeg.on("end", () => {
        const img = readFileSync(output);
        const imgToBase64 =
          "data:image/png;base64," + Buffer.from(img).toString("base64");
        console.log("finish generate thumbnail");
        logVideoProcess(`Concat frames","finish concat frames`);
        resolve(imgToBase64);
      });

      ffmpeg.on("error", (err) => {
        console.log(err);
        logErrorVideoProcess(`Concat frames","Erreur: ${err.message}`);
      });
    } catch (error) {
      console.log(error);
    }
  });
};

/**
 * Attribution des droit 777 pour
 * @param {*} destination
 * @returns
 */
export const darwinChmod = (destination) => {
  return new Promise((resolve) => {
    const commandeChmod = `chmod -R 777 ${destination}`;
    try {
      execSync(commandeChmod);
      const response = `Permissions 777 appliquées avec succès à ${destination}`;
      console.log(response);
      resolve(response);
    } catch (erreur) {
      console.error(
        `Erreur lors de l'exécution de la commande : ${erreur.stderr}`
      );
    }
  });
};

/**
 *Nettoyage des fichiers traités
 * @param {String} filePath
 */
export const clean_file_process = async (filePath) => {
  const deleteMessage = await remove_file_delayed(
    filePath,
    DEFAULT_DELETE_FILE_DELAY
  );
  const deleteState = {
    action: "Suppression",
    status: deleteMessage,
    path: filePath,
  };
  //console.log(deleteState);
  logProgress("Delete process file", `success delete for: ${filePath}`);
};
