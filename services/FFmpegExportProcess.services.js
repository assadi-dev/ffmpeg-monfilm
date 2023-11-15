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

/**
 * //Découpage des parties des videos
 * @param {*} start
 * @param {*} end
 * @param {*} input
 * @param {*} output
 */
export const splitPart = async (start, end, input, output) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}project`;

  if (!existsSync(export_file)) {
    mkdirSync(export_file, { recursive: true });
    chmodSync(export_file, 777);
  }

  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  let totalDuration = 0;
  const timeToStart = Number(start);
  const timeToEnd = Number(end);
  const timeDuration = Math.round(timeToEnd - timeToStart);
  const volume = 0.5;
  console.log("duration:", timeDuration);

  try {
    ffmpeg
      .input(input)
      .setStartTime(start)
      .withDuration(timeDuration)
      .withAudioFilters([`volume=${volume}`])
      .outputOptions([
        "-avoid_negative_ts",
        "make_zero",
        "-async",
        "1",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
      ])
      .output(destination)
      .on("start", (cmdline) => {
        console.log(`start split`, cmdline);

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
        timeDuration
      )

      .on("end", () => {
        console.log(`Finished split`);
        console.log(100);

        // ws.to(room).emit("end", status);

        // resolve(result);
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
 * @param {*} id
 * @param {*} volume
 * @param {*} input
 * @param {*} start
 * @param {*} end
 * @param {*} output
 */
const splitAudioPart = (id, volume, input, start, end, output) => {};

/**
 * Concatenation des médias
 * @param {*} listInput
 * @param {*} output
 */
export const concatenate_inputs = (listInput, output) => {
  // console.log(listInput);
  try {
    const { ffmpeg } = new FFmpegInstance();
    const inputs = [...listInput].map((item) => item.path);
    const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}project`;
    const tempFolder = `${export_file}${DIRECTORY_SEPARATOR}/tmp`;

    if (!existsSync(export_file)) {
      mkdirSync(export_file, { recursive: true });
      chmodSync(export_file, 777);
    }
    if (!existsSync(tempFolder)) {
      mkdirSync(tempFolder, { recursive: true });
      chmodSync(tempFolder, 777);
    }

    const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
    const count = inputs.length;
    let filterCommandIn = "";
    let filterCommandOut = "";
    let filterConcatComand = `concat=n=${count}:v=1:a=1`;
    const resolution = "720:406";

    for (const index in inputs) {
      const input = inputs[index];
      ffmpeg.addInput(input).seekInput(0).inputOptions("-t", "5");
      const rotate = `transpose=1,transpose=1,`;

      filterCommandIn += `[${index}:v]${rotate}scale=${resolution},pad=${resolution},setsar=1[v${index}];`;
      filterCommandOut += `[v${index}][${index}:a]`;
    }
    filterConcatComand = `${filterCommandIn}${filterCommandOut}${filterConcatComand}[v][a]`;
    console.log(filterConcatComand);

    ffmpeg
      .complexFilter(filterConcatComand)
      .outputOptions(["-map [v]", "-map [a]", "-vsync 2"])

      .output(destination)
      .on("start", (cmdline) => {
        console.log(`start concate`, cmdline);
      })
      .on("progress", () => {
        console.log("progress");
      })
      .on("end", () => {
        console.log(`Finished concate`);
        console.log(100);
      })

      .run();
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
