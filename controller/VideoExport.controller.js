import {
  files_mapping,
  concatenate_combined_videos,
  concatenate_combined_audios,
  files_mapping_no_audio,
  delete_workspace_export,
  create_workspace_export,
} from "../services/FFmpegExportProcess.services.js";
import slugify from "slugify";
import OvhObjectStorageServices from "../services/OvhObjectStorage.services.js";
import {
  DIRECTORY_SEPARATOR,
  EVASION_API,
  OVH_CONTAINER,
  OVH_CREDENTIALS,
  upload_dir,
} from "../config/constant.config.js";
import { ws } from "../index.js";
import { statSync } from "fs";
import { clean_file_process } from "../services/FFmpegCameraProcess.services.js";
import { postDelayed, toSlugify } from "../services/Filestype.services.js";

export const export_project = (req, res) => {
  try {
    const { idProjectVideo, room, projectName, scenes, audios, maxDuration } =
      req.body;

    generate_finalOutput(
      room,
      scenes,
      audios,
      projectName,
      maxDuration,
      idProjectVideo
    );
    const content = {
      room,
      message: "process en cours",
      scenes,
      audios,
      maxDuration,
    };

    res.json(content);
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const merges_input = (req, res) => {
  try {
    const { scenes, audios } = req.body;
    const outputFile = "visdeo-concatenate.mp4";
    concatenate_inputs(scenes, outputFile);

    const content = { message: "concatenation en cours", scenes };
    res.json(content);
  } catch (error) {
    return res.status(500).json({
      message: error?.message,
    });
  }
};

export const generate_finalOutput = async (
  room,
  scenes,
  audios,
  projectName,
  maxDuration,
  idProjectVideo
) => {
  console.log(`Export project: ${idProjectVideo}`);
  console.log("Concatenation des fichiers videos");
  const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${toSlugify(
    projectName
  )}`;

  create_workspace_export(export_file);
  const mergedVideos = await concate_process_videos(room, scenes, projectName);

  let final_result = "";
  console.log("mergedVideos:", mergedVideos);

  if (audios.length == 0) {
    console.log("Mapping fichiers video no audio");
    const finalOutput = `${toSlugify(projectName)}.mp4`;
    const final_video_input = await files_mapping_no_audio(
      mergedVideos,
      projectName,
      finalOutput,
      room,
      maxDuration
    );
    final_result = final_video_input;
    console.log("final:", final_result);
  } else {
    console.log("Concatenation des fichiers audios");
    const final_audio_output = await concate_process_audio(
      room,
      audios,
      projectName
    );
    console.log("mergedAudio:", final_audio_output);

    console.log("Mapping fichiers video et audios");
    const finalOutput = `${projectName}.mp4`;
    final_result = await files_mapping(
      mergedVideos,
      final_audio_output,
      projectName,
      finalOutput,
      room,
      maxDuration
    );
    console.log("final:", final_result);
    //Envoie ovh
    console.log("send ovh");
  }
  const remoteFilename = `${timestamp()}_${toSlugify(projectName)}.mp4`;
  const FinalObject = { filePath: final_result, remoteFilename };
  const url = await upload_ovh(room, FinalObject);
  //Update UserProject
  const { size } = statSync(final_result);

  const resProject = await updateUserProject(
    idProjectVideo,
    remoteFilename,
    url,
    maxDuration,
    size
  );
  resProject.ok
    ? console.log("Project has been updated with success")
    : console.log("Error update project");
  postDelayed(10000, () => delete_workspace_export(export_file));
};

//Utilitaire
const retrieveDuration = (inputs) => {
  return inputs.reduce((a, b) => Math.ceil(a + b));
};

const calculatSumDuration = (inputs = []) => {
  return inputs.reduce((a, b) => Math.ceil(a + b));
};

const timestamp = () => {
  const dt = new Date();
  return dt.getTime();
};

const concate_process_videos = async (room, scenes, projectName) => {
  const splited_videos = [];
  const listVideosDurations = [];

  for (const scenePos in scenes) {
    let scene = scenes[scenePos];

    const { src, start, end, rotate, duration, volume } = scene;
    const value = { src, start, end, rotate, duration, volume };
    listVideosDurations.push(duration);
    splited_videos.push(value);
  }
  const outputConcatenateVideo = `final-video-${toSlugify(projectName)}.mp4`;
  const totalPartVideoDuration = calculatSumDuration(listVideosDurations);
  const mergedVideos = await concatenate_combined_videos(
    splited_videos,
    projectName,
    outputConcatenateVideo,
    room,
    totalPartVideoDuration
  );

  return mergedVideos;
};

const concate_process_audio = async (room, audios, projectName) => {
  const splited_audios = [];
  const listAudiosDurations = [];

  for (const audioPos in audios) {
    let audio = audios[audioPos];

    const { src, start, end, duration, volume } = audio;
    const value = { src, start, end, duration, volume };
    listAudiosDurations.push(duration);
    splited_audios.push(value);
  }
  const outputConcatenateAudio = `final-audio-${toSlugify(projectName)}.mp3`;
  const totalPartAudioDuration = calculatSumDuration(listAudiosDurations);

  const mergedAudio = await concatenate_combined_audios(
    splited_audios,
    projectName,
    outputConcatenateAudio,
    room,
    totalPartAudioDuration
  );

  return mergedAudio;
};

const upload_ovh = (room, fileObjetct) => {
  return new Promise(async (resolve, reject) => {
    const { filePath, remoteFilename } = fileObjetct;

    const status = {
      step: "ovh",
      message: "start",
      filename: fileObjetct.filename,
      progress: 0,
      url: "",
      error: "",
    };

    try {
      const ovhStorageServices = new OvhObjectStorageServices(OVH_CREDENTIALS);

      const options = {
        filePath,
        remoteFilename,
        containerName: OVH_CONTAINER,
        segmentSize: 1024 * 1024 * 50,
      };
      await ovhStorageServices.connect();
      ovhStorageServices.uploadLargeFile(options);
      const listen = (progress) => {
        const percent = Math.ceil(progress * 100);
        status.progress = percent;
        status.message = "progress";
        ws.of(process.env.WEBSOCKET_PATH)
          .to(room)
          .emit("export-project-video", status);
      };
      ovhStorageServices.onProgress(listen);
      const finish = (response) => {
        status.progress = 100;
        status.message = "done";
        status.url = response?.url;
        ws.of(process.env.WEBSOCKET_PATH)
          .to(room)
          .emit("export-project-video", status);
        resolve(response?.url);
        clean_file_process(filePath);
      };
      ovhStorageServices.onSuccess(finish);
    } catch (error) {
      const message = error.message;
      console.error("Upload error:", message);
      reject(message);
    }
  });
};

/**
 *
 * @param {*} idProjectVideo id du projet
 * @param {*} exportUrl liex de la video exporté
 * @returns
 */
const updateUserProject = (
  idProjectVideo,
  filename,
  exportUrl,
  duration,
  size
) => {
  const url = ` ${EVASION_API}/v2/project/update/export`;

  const body = {
    idProjectVideo,
    filename,
    exportUrl,
    duration,
    size,
  };

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
};
