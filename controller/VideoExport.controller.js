import {
  concatenate_videos,
  splitAudioPart,
  concatenate_audios,
  split_videos,
  files_mapping,
} from "../services/FFmpegExportProcess.services.js";

export const export_project = (req, res) => {
  try {
    const { room, projectName, scenes, audios, maxDuration } = req.body;
    //Génération des split videos
    generate_finalOutput(room, scenes, audios, projectName, maxDuration);
    const content = {
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
  console.log("split des fichier videos");
  for (const scenePos in scenes) {
    let scene = scenes[scenePos];

    const sceneOut = `${projectName}-video-part-${scenePos}.mp4`;
    const spliFile = await split_videos(scene, projectName, sceneOut, room);
    splited_videos.push(spliFile);
  }
  const outputConcatenateVideo = `final-video-${projectName}.mp4`;
  console.log("Concatenation des fichiers videos");
  const mergedVideos = await concatenate_videos(
    splited_videos,
    projectName,
    outputConcatenateVideo,
    room,
    maxDuration
  );
  console.log("mergedVideos:", mergedVideos);
  console.log("Split des fichiers audios");
  for (const audioPos in audios) {
    let audio = audios[audioPos];
    const audiOut = `${projectName}-audio-part-${audioPos}.mp3`;
    const spliitFileAudio = await splitAudioPart(
      audio,
      projectName,
      audiOut,
      room
    );
    splited_audios.push(spliitFileAudio);
  }
  const outputConcatenateAudio = `final-audio-${projectName}.mp3`;
  const mergedAudio = await concatenate_audios(
    splited_audios,
    projectName,
    outputConcatenateAudio,
    room,
    maxDuration
  );
  console.log("mergedAudio:", mergedAudio);

  console.log("Mapping fichiers video eet audios");
  const finalOutput = `${projectName}.mp4`;
  const final_result = await files_mapping(
    mergedVideos,
    mergedAudio,
    projectName,
    finalOutput,
    room
  );
  console.log("final:", final_result);
};
