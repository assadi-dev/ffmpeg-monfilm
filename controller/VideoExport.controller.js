import {
  files_mapping,
  concatenate_combined_videos,
  concatenate_combined_audios,
  files_mapping_no_audio,
} from "../services/FFmpegExportProcess.services.js";

export const export_project = (req, res) => {
  try {
    const { room, projectName, scenes, audios, maxDuration } = req.body;
    //Génération des split videos
    generate_finalOutput(room, scenes, audios, projectName, maxDuration);
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
  maxDuration
) => {
  console.log("Concatenation des fichiers videos");
  const final_video_input = await concate_process_videos(
    room,
    scenes,
    projectName
  );
  console.log("mergedVideos:", final_video_input);

  if (audios.length == 0) {
    console.log("Mapping fichiers video no audio");
    const finalOutput = `${projectName}.mp4`;
    const final_result = await files_mapping_no_audio(
      mergedVideos,
      projectName,
      finalOutput,
      room,
      maxDuration
    );
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
    const final_result = await files_mapping(
      final_video_input,
      final_audio_output,
      projectName,
      finalOutput,
      room,
      maxDuration
    );
    console.log("final:", final_result);
  }
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
  const outputConcatenateVideo = `final-video-${projectName}.mp4`;
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
  const outputConcatenateAudio = `final-audio-${projectName}.mp3`;
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
