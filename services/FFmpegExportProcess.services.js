/*  id,
start,
end,
volume,
rotate,
input,
output,
room */

import { chmodSync, existsSync, mkdirSync } from "fs";
import { DIRECTORY_SEPARATOR, upload_dir } from "../config/constant.config.js";
import FFmpegInstance from "./FFmpegInstance.services.js";
import ffmpegOnProgress from "ffmpeg-on-progress";
import { resolve } from "path";

/**
 * //Découpage des parties des videos
 * @param {*} scene
 * @param {*} output
 */
export const splitPart = async (scene, projectName, output) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;

  if (!existsSync(export_file)) {
    mkdirSync(export_file, { recursive: true });
    chmodSync(export_file, 777);
  }

  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  let totalDuration = 0;
  const timeToStart = Number(scene?.start);
  const timeToEnd = Number(scene?.end);
  const timeDuration = Math.round(timeToEnd - timeToStart);

  const input = scene.src;

  try {
    const volumeDefault = scene.volume ? 0.5 : 0;

    return new Promise((resolve) => {
      ffmpeg.input(input).withAudioFilters([`volume=${volumeDefault}`]);

      scene.rotate
        ? ffmpeg.withVideoFilter(["transpose=1", "transpose=1"])
        : ffmpeg;

      ffmpeg
        .seekInput(timeToStart)
        .withDuration(timeDuration)
        .outputOptions([
          "-avoid_negative_ts",
          "make_zero",
          "-async",
          "1",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
        ])
        .output(destination)
        .on("start", (cmdline) => {
          //console.log(`start split`, cmdline);
          // ws.to(room).emit("start", status);
        })
        .on("codecData", (data) => {
          totalDuration = parseInt(data.duration.replace(/:/g, ""));
        })
        .on(
          "progress",
          ffmpegOnProgress((progress) => {
            console.log(Math.round(progress * 100));
          }),
          totalDuration
        )

        .on("end", () => {
          console.log(`Finished split`);
          console.log(100);

          // ws.to(room).emit("end", status);

          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          // ws.to(room).emit("error", status);
        })

        .run();
    });
  } catch (error) {
    console.log(error.message);
  }
};

/**
 * Concatenation des médias
 * @param {*} listInput
 * @param {*} projetFolder
 * @param {*} output
 */
export const concatenate_inputs = (listInput, projetFolder, output) => {
  try {
    const { ffmpeg } = new FFmpegInstance();
    const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projetFolder}`;
    const tempFolder = `${export_file}${DIRECTORY_SEPARATOR}/tmp`;

    if (!existsSync(export_file)) {
      mkdirSync(export_file, { recursive: true });
      chmodSync(export_file, 777);
    }

    const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
    const count = listInput.length;
    let filterCommandIn = "";
    let filterCommandOut = "";
    let filterConcatComand = `concat=n=${count}:v=1:a=1`;
    const resolution = "720:406";

    for (const index in listInput) {
      const input = listInput[index];
      ffmpeg.addInput(input);

      filterCommandIn += `scale=${resolution},pad=${resolution},setsar=1[v${index}];`;
      filterCommandOut += `[v${index}][${index}:a]`;
    }
    filterConcatComand = `${filterCommandIn}${filterCommandOut}${filterConcatComand}[v][a]`;

    ffmpeg
      .complexFilter(filterConcatComand)
      .outputOptions(["-map [v]", "-map [a]", "-vsync 2"])

      .output(destination)
      .on("start", (cmdline) => {
        //console.log(`start concate`, cmdline);
      })
      .on("progress", () => {
        console.log("progress");
      })
      .on("end", () => {
        console.log(`Finished concate`);
        console.log(100);
      })
      .on("error", (error) => {
        console.log(error.message);
        // ws.to(room).emit("error", status);
      })

      .run();
  } catch (error) {
    console.log(error.message);
  }
};

/**
 * Decoupage des partie audios
 * @param {*} audio
 * @param {*} projectName
 * @param {*} output
 */
export const splitAudioPart = (audio, projectName, output) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;

  if (!existsSync(export_file)) {
    mkdirSync(export_file, { recursive: true });
    chmodSync(export_file, 777);
  }

  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  let totalDuration = 0;
  const timeToStart = Number(audio?.start);
  const timeToEnd = Number(audio?.end);
  const timeDuration = Math.round(timeToEnd - timeToStart);

  const input = audio.src;

  try {
    const volumeDefault = audio.volume ? 0.5 : 0;
    const promise = new Promise((resolve) => {});

    ffmpeg
      .addInput(input)
      .seekInput(timeToStart)
      .withDuration(timeDuration)
      .withAudioFilters([`volume=${volumeDefault}`])
      .outputOptions([
        "-avoid_negative_ts",
        "make_zero",
        "-async",
        "1",
        "-c:a",
        "libmp3lame",
      ])
      .output(destination)
      .on("codecData", (data) => {
        totalDuration = parseInt(data.duration.replace(/:/g, ""));
      })
      .on(
        "progress",
        ffmpegOnProgress((progress) => {
          console.log(Math.round(progress * 100));
        }),
        totalDuration
      )

      .on("end", () => {
        console.log(`Finished split`);
        console.log(100);

        // ws.to(room).emit("end", status);

        resolve(destination);
      })
      .on("error", (error) => {
        console.log(error.message);
        // ws.to(room).emit("error", status);
      })

      .run();

    return promise;
  } catch (error) {
    console.log(error.message);
  }
};

/* 
function getToSecondes($seconds) {
  $hours = $seconds / 3600;
  $mins = ($seconds / 60) % 60;
  $secs = $seconds % 60;
  $timeFormat = sprintf("%02d:%02d:%02d", $hours, $mins, $secs);
  return $timeFormat;
}
 */
