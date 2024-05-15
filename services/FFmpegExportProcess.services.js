/*  id,
start,
end,
volume,
rotate,
input,
output,
room */

import { chmodSync, existsSync, mkdirSync, rm, stat } from "fs";
import {
  DIRECTORY_SEPARATOR,
  upload_dir,
  WEBSOCKET_PATH,
} from "../config/constant.config.js";
import FFmpegInstance from "./FFmpegInstance.services.js";
import ffmpegOnProgress from "ffmpeg-on-progress";
import { ws } from "../index.js";
import { eventFeedbackPublish } from "../config/ffmpegComand.config.js";
import slugify from "slugify";
import { clean_file_process } from "./FFmpegCameraProcess.services.js";
import { toSlugify } from "./Filestype.services.js";
import {
  logErrorVideoProcess,
  logVideoProcess,
} from "./FullProcess.services.js";

/**
 * //Découpage des parties des videos
 * @param {*} scene
 * @param {*} output
 */
export const split_videos = async (scene, projectName, output, room) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;

  if (!existsSync(export_file)) {
    mkdirSync(export_file, { recursive: true });
    chmodSync(export_file, "777");
  }

  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  let totalDuration = 0;
  const timeToStart = Number(scene?.start);
  const timeToEnd = Number(scene?.end);
  const timeDuration = Math.round(timeToEnd - timeToStart);

  const input = scene.src;
  const durationEstimate = secToMill(timeDuration);

  const status = {
    step: "split-video",
    id: scene.id,
    message: "wait",
    progress: 0,
    filename: scene.filename,
    duration: timeDuration,
    error: "",
  };

  try {
    const volumeDefault = scene.volume ? 1 : 0;

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
          "-r",
          "30",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
        ])
        .output(destination)
        .on("start", (cmdline) => {
          logVideoProcess("Export video", "start split");
          logVideoProcess("command ffmpeg", cmdline);
          status.message = "start";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on("codecData", (data) => {
          totalDuration = parseInt(data.duration.replace(/:/g, ""));
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) =>
              logSplitProgress(room, progress, event, status),
            durationEstimate
          )
        )

        .on("end", () => {
          console.log(`Finished split`);
          logVideoProcess("Export video", "finish split");
          console.log(100);
          status.message = "done";
          status.progress = 100;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);

          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Error: ${error.message}`);
          status.error = error.message;
          status.message = "error";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })

        .run();
    });
  } catch (error) {
    console.log(error.message);
    logErrorVideoProcess("Export video", `Error: ${error.message}`);
  }
};

/**
 * Concatenation des médias
 * @param {*} listInput
 * @param {*} projetFolder
 * @param {*} output
 */
export const concatenate_videos = (
  listInput,
  projetFolder,
  output,
  room,
  maxDuration
) => {
  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projetFolder}`;

  const durationEstimate = secToMill(maxDuration);

  const status = {
    step: "concat-video",
    message: "wait",
    progress: 0,
    duration: maxDuration,
    elapsed: 0,
    error: "",
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    if (!existsSync(export_file)) {
      mkdirSync(export_file, { recursive: true });
      chmodSync(export_file, "777");
    }

    const promise = new Promise((resolve) => {
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
          logVideoProcess("Export video", `Start concat video`);
          logVideoProcess("Export video", `command ffmpeg ${cmdline}`);
          status.message = "start";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished concat`);
          logVideoProcess("Export video", `Finished concat video`);
          status.progress = 100;
          status.message = "done";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Error: ${error.message}`);
          status.error = error.message;
          status.message = "error";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })
        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    status.error = error.message;
    status.message = "error";
    logErrorVideoProcess("Export video", `Error: ${error.message}`);
    ws.of(WEBSOCKET_PATH).to(room).emit(eventFeedbackPublish.error, status);
  }
};

/**
 * Split et Concatenation des fichier video
 * @param {*} listInput
 * @param {*} projetFolder
 * @param {*} output
 */
export const concatenate_combined_videos = (
  listInput,
  projetFolder,
  output,
  room,
  maxDuration
) => {
  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projetFolder}`;

  console.log("start concat video");

  const durationEstimate = secToMill(maxDuration);

  const status = {
    step: "concat-video",
    message: "wait",
    elapsed: 0,
    progress: 0,
    duration: maxDuration,
    error: "",
  };

  try {
    const { ffmpeg } = new FFmpegInstance();
    if (!existsSync(export_file)) {
      mkdirSync(export_file, { recursive: true });
      chmodSync(export_file, "777");
    }

    const promise = new Promise((resolve) => {
      const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
      const count = listInput.length;
      let filterCommandIn = "";
      let filterCommandOut = "";
      let filterCommandAudio = "";
      let filterConcatComand = `concat=n=${count}:v=1:a=1`;
      const resolution = "4096:2048";
      const fps = 25;

      for (const index in listInput) {
        const scene = listInput[index];

        const input = scene.src;
        const timeToStart = Number(scene.start);
        const timeToEnd = Number(scene.end);
        const timeDuration = Number(timeToEnd - timeToStart).toFixed(2);
        const volumeDefault = scene.volume ? 1 : 0;
        const rotate = scene.rotate
          ? `,transpose=1,transpose=1[v${index}]`
          : `[v${index}]`;

        ffmpeg
          .addInput(input)
          .seekInput(timeToStart)
          .inputOptions(["-t", timeDuration]);

        filterCommandIn += `[${index}:v]scale=${resolution},pad=${resolution},setsar=1${rotate};`;
        filterCommandAudio += `[${index}:a]volume=${volumeDefault}[volume${index}];`;
        filterCommandOut += `[v${index}][volume${index}]`;
      }
      filterConcatComand = `${filterCommandIn}${filterCommandAudio}${filterCommandOut}${filterConcatComand}[v][a]`;

      ffmpeg
        .complexFilter(filterConcatComand)
        .outputOptions([
          "-map [v]",
          "-map [a]",
          "-r",
          fps,
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
        ])
        .output(destination)
        // .withDuration(maxDuration + 1)
        .on("start", (cmdline) => {
          //console.log(`start concate`, cmdline);
          status.message = "start";
          logVideoProcess("Export video", `Start complex filter concat video`);
          logVideoProcess("Export video", `command ffmpeg ${cmdline}`);
          ws.to(room).emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished concate video`);
          status.progress = 100;
          status.message = "done";
          logVideoProcess(
            "Export video",
            `Finished complex filter concat video`
          );
          ws.to(room).emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          status.error = error.message;
          status.message = "error";
          logErrorVideoProcess("Export video", `Error: ${error.message}`);
          ws.to(room).emit(eventFeedbackPublish.error, status);
        })
        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    logErrorVideoProcess("Export video", `Error: ${error.message}`);
    status.error = error.message;
    status.message = "error";
    ws.to(room).emit(eventFeedbackPublish.error, status);
  }
};

/**
 * Decoupage des partie audios
 * @param {*} audio
 * @param {*} projectName
 * @param {*} output
 */
export const splitAudioPart = (audio, projectName, output, room) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;

  if (!existsSync(export_file)) {
    mkdirSync(export_file, { recursive: true });
    chmodSync(export_file, "777");
  }

  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;

  const timeToStart = Number(audio?.start);
  const timeToEnd = Number(audio?.end);
  const timeDuration = Math.round(timeToEnd - timeToStart);

  const input = audio.src;
  const durationEstimate = timeDuration * 1000;

  const status = {
    step: "split-audio",
    id: audio.id,
    message: "wait",
    elapsed: 0,
    progress: 0,
    filename: "",
    duration: timeDuration,
    error: "",
  };

  try {
    const volumeDefault = audio.volume ? 1 : 0;
    const promise = new Promise((resolve) => {
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
        .on("start", () => {
          status.message = "start";
          ws.to(room).emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress((progress, event) =>
            logSplitProgress(room, progress, event, status)
          ),
          durationEstimate
        )

        .on("end", () => {
          console.log(`Finished split`);
          console.log(100);
          status.progress = 100;
          status.message = "done";

          ws.to(room).emit(eventFeedbackPublish.export, status);

          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          status.error = error.message;
          status.message = "error";
          ws.to(room).emit(eventFeedbackPublish.error, status);
        })

        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    status.error = error.message;
    status.message = "error";
    ws.to(room).emit("error", status);
  }
};

export const concatenate_audios = (
  splited_audios,
  projectName,
  output,
  room,
  maxDuration
) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;
  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;

  const count = splited_audios.length;
  let filterCommandIn = "";
  let filterConcatComand = `concat=n=${count}:v=0:a=1[aout]`;

  const durationEstimate = secToMill(maxDuration);

  const status = {
    step: "concat-audio",
    message: "wait",
    elapsed: 0,
    progress: 0,
    duration: maxDuration,
    error: "",
  };

  try {
    const promise = new Promise((resolve) => {
      for (const index in splited_audios) {
        const input = splited_audios[index];
        ffmpeg.addInput(input);

        filterCommandIn += `[${index}:a]`;
      }
      filterConcatComand = `${filterCommandIn}${filterConcatComand}`;
      ffmpeg
        .complexFilter(filterConcatComand)
        .outputOptions(["-map [aout]"])
        .output(destination)
        .on("start", (cmdline) => {
          //console.log(`start concate`, cmdline);
          logVideoProcess("Export video", `Start concat audio`);
          logVideoProcess("Export video", `command ${cmdline}`);
          status.message = "start";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished audio concate`);
          logVideoProcess("Export video", `Finnish concat audio`);

          status.progress = 100;
          status.message = "done";
          status.remain = 0;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
          status.error = error.message;
          status.message = "error";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })

        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    status.error = error.message;
    logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
    status.message = "error";
    ws.of(WEBSOCKET_PATH).to(room).emit(eventFeedbackPublish.error, status);
  }
};
export const concatenate_combined_audios = (
  splited_audios,
  projectName,
  output,
  room,
  maxDuration
) => {
  const { ffmpeg } = new FFmpegInstance();

  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;
  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;

  const durationEstimate = secToMill(maxDuration);

  const status = {
    step: "concat-audio",
    message: "wait",
    progress: 0,
    elapsed: 0,
    duration: maxDuration,
    error: "",
  };

  try {
    const count = splited_audios.length;
    let filterCommandIn = "";
    let filterConcatOut = "";
    let filterConcatComand = `concat=n=${count}:v=0:a=1[aout]`;
    const promise = new Promise((resolve) => {
      for (const index in splited_audios) {
        const audio = splited_audios[index];
        const timeToStart = Number(audio?.start);
        const timeToEnd = Number(audio?.end);
        const timeDuration = Number(timeToEnd - timeToStart).toFixed();
        const volumeDefault = audio.volume ? 0.5 : 0;

        const input = audio.src;
        ffmpeg
          .addInput(input)
          .seekInput(timeToStart)
          .inputOptions(["-t", timeDuration]);

        filterCommandIn += `[${index}:a]volume=${volumeDefault}[volume=${index}];`;
        filterConcatOut += `[volume=${index}]`;
      }
      filterConcatComand = `${filterCommandIn}${filterConcatOut}${filterConcatComand}`;
      ffmpeg
        .complexFilter(filterConcatComand)
        .outputOptions([
          "-avoid_negative_ts",
          "make_zero",
          "-async",
          "1",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          "-map",
          "[aout]",
        ])
        .output(destination)
        .on("start", (cmdline) => {
          //console.log(`start concate`, cmdline);
          logVideoProcess("Export video", `Start complex filter concate audio`);
          logVideoProcess("Export video", `command ffmpeg: ${cmdline}`);
          status.message = "start";
          status.elapsed = 0;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished audio concate`);
          logVideoProcess(
            "Export video",
            `Finished complex filter concate audio`
          );
          status.progress = 100;
          status.message = "done";
          status.remain = 0;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
          status.error = error.message;
          status.message = "error";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })

        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
    status.error = error.message;
    status.message = "error";
    ws.of(WEBSOCKET_PATH).to(room).emit(eventFeedbackPublish.error, status);
  }
};

export const files_mapping = (
  videoFile,
  audioFile,
  projectName,
  output,
  room,
  maxDuration
) => {
  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;
  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  // const filterComand = `[1:a]adelay=1000|1000[a];[0:a]adelay=1000|1000[va];[a][va]amix=inputs=2[out]`;
  const filterComand = `[1:a][0:a]amix=inputs=2[out]`;

  const durationEstimate = secToMill(maxDuration);
  const status = {
    step: "mapping-video",
    message: "wait",
    progress: 0,
    elapsed: 0,
    filename: output,
    duration: maxDuration,
    error: "",
  };

  try {
    const { ffmpeg } = new FFmpegInstance();

    const promise = new Promise((resolve) => {
      ffmpeg
        .addInput(videoFile)
        .addInput(audioFile)
        /*.withDuration(maxDuration)
        .audioBitrate("320k") */
        .complexFilter(filterComand)
        .outputOptions([
          "-map [out]",
          "-map 0:v",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-q:a",
          "2",
        ])
        .output(destination)
        .on("start", (cmdline) => {
          //console.log(`start concate`, cmdline);
          logVideoProcess("Export video", `Start mapping files`);
          logVideoProcess("Export video", `command ffmpeg: ${cmdline}`);
          status.message = "start";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished mapping files`);
          logVideoProcess("Export video", `Finished mapping files`);
          status.message = "done";
          status.progress = 100;
          clean_file_process(videoFile);
          clean_file_process(audioFile);
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
          status.message = "error";
          status.error = error.message;
          clean_file_process(videoFile);
          clean_file_process(audioFile);
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })

        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    logErrorVideoProcess("Export video", `Erreur: ${error.message}`);
    status.message = "error";
    status.error = error.message;
    ws.of(WEBSOCKET_PATH).to(room).emit(eventFeedbackPublish.error, status);
  }
};

export const files_mapping_no_audio = (
  videoFile,
  projectName,
  output,
  room,
  maxDuration
) => {
  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectName}`;
  const destination = `${export_file}${DIRECTORY_SEPARATOR}${output}`;
  const durationEstimate = secToMill(maxDuration);
  const status = {
    step: "mapping-video",
    message: "wait",
    progress: 0,
    elapsed: 0,
    filename: output,
    duration: maxDuration,
    error: "",
  };

  try {
    const { ffmpeg } = new FFmpegInstance();

    const promise = new Promise((resolve) => {
      ffmpeg
        .addInput(videoFile)
        .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
        .output(destination)
        .on("start", (cmdline) => {
          //console.log(`start concate`, cmdline);
          status.message = "start";
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
        })
        .on(
          "progress",
          ffmpegOnProgress(
            (progress, event) => logProgress(room, progress, event, status),
            durationEstimate
          )
        )
        .on("end", () => {
          console.log(`Finished mapping files`);
          logVideoProcess("Export video", `Finished mapping files`);
          status.message = "done";
          status.progress = 100;
          clean_file_process(videoFile);
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.export, status);
          resolve(destination);
        })
        .on("error", (error) => {
          console.log(error.message);
          logErrorVideoProcess("Export video", `Finished mapping files`);
          clean_file_process(videoFile);
          status.message = "error";
          status.error = error.message;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackPublish.error, status);
        })
        .run();
    });

    return promise;
  } catch (error) {
    console.log(error.message);
    logVideoProcess("Export video", `Erreur: ${error.message}`);
    status.message = "error";
    status.error = error.message;
    ws.to(room).emit(eventFeedbackPublish.error, status);
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

//Final filter: -y -filter_complex "[1:a]volume=0.1[music];[music][0:a]amix=inputs=2[outa]"-map 0:v -map "[outa]" output_video.mp4

const logSplitProgress = (room, progress, event, status) => {
  const percent = Math.round(progress * 100);
  const timeElapsed = timecodeToSec(event.timemark);

  status.elapsed = timeElapsed;
  status.message = "progress";
  status.progress = percent;
  ws.to(room).emit(eventFeedbackPublish.export, status);
};
const logProgress = (room, progress, event, status) => {
  const percent = Math.round(progress * 100);
  const timeElapsed = timecodeToSec(event.timemark);
  status.elapsed = timeElapsed;
  status.message = "progress";
  status.progress = percent;
  // console.log("progress:", percent);
  ws.of(WEBSOCKET_PATH).to(room).emit(eventFeedbackPublish.export, status);
};

const secToMill = (sec) => {
  return sec * 1000;
};

/**
 * convert
 * @param {*} timecode
 * @returns
 */
const timecodeToSec = (timecode) => {
  const parts = timecode.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;
  const milliseconds = parseInt(parts[3], 10) || 0;

  const totalSeconds =
    hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;

  return totalSeconds;
};
export const create_workspace_export = (path) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    chmodSync(path, "777");
  }
};
export const delete_workspace_export = (path) => {
  if (existsSync(path)) {
    chmodSync(path, "777");

    rm(path, { recursive: true }, (err) => {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log("File deleted successfully");
    });
  }
};
