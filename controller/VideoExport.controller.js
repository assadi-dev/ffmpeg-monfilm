import {
  concatenate_videos,
  splitAudioPart,
  concatenate_audios,
  split_videos,
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
  const splited_videos = [];
  const splited_audios = [];
  const listVideosDurations = [];
  const listAudiosDurations = [];
  console.log("split des fichier videos");
  for (const scenePos in scenes) {
    let scene = scenes[scenePos];

    const { src, start, end, rotate, duration, volume } = scene;
    const value = { src, start, end, rotate, duration, volume };
    listVideosDurations.push(duration);
    splited_videos.push(value);
  }
  const outputConcatenateVideo = `${timestamp()}-final-video-${projectName}.mp4`;
  console.log("Concatenation des fichiers videos");
  const totalPartVideoDuration = calculatSumDuration(listVideosDurations);
  const mergedVideos = await concatenate_combined_videos(
    splited_videos,
    projectName,
    outputConcatenateVideo,
    room,
    totalPartVideoDuration
  );
  console.log("mergedVideos:", mergedVideos);

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
    for (const audioPos in audios) {
      let audio = audios[audioPos];

      const { src, start, end, duration, volume } = audio;
      const value = { src, start, end, duration, volume };
      listAudiosDurations.push(duration);
      splited_audios.push(value);
    }
    const outputConcatenateAudio = `${timestamp()}-final-audio-${projectName}.mp3`;
    const totalPartAudioDuration = calculatSumDuration(listAudiosDurations);
    console.log("Concatenation des fichiers audios");
    const mergedAudio = await concatenate_combined_audios(
      splited_audios,
      projectName,
      outputConcatenateAudio,
      room,
      totalPartAudioDuration
    );
    console.log("mergedAudio:", mergedAudio);

    console.log("Mapping fichiers video et audios");
    const finalOutput = `${projectName}.mp4`;
    const final_result = await files_mapping(
      mergedVideos,
      mergedAudio,
      projectName,
      finalOutput,
      room,
      maxDuration
    );
    console.log("final:", final_result);
  }
};

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
