import {
  concatenate_inputs,
  splitPart,
  splitAudioPart,
} from "../services/FFmpegExportProcess.services.js";

export const export_project = (req, res) => {
  try {
    const { room, projectName, scenes, audios } = req.body;
    //Génération des split videos
    generate_finalOutput(room, scenes, audios, projectName);
    const content = { message: "process en cours" };
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
  projectName
) => {
  const splited_videos = [];
  const splited_audios = [];
  console.log("des fichier videos");
  /*   for (const scenePos in scenes) {
    let scene = scenes[scenePos];
    const sceneOut = `${projectName}-video-part-${scenePos}.mp4`;
    const spliFile = await splitPart(scene, projectName, sceneOut);
    splited_videos.push(spliFile);
  }
  const outputFile = `${projectName}.mp4`;
  console.log("Concatenation des fichiers videos");
  concatenate_inputs(splited_videos, projectName, outputFile); */
  console.log("Split des fichiers audios");
  for (const audioPos in audios) {
    let audio = audios[audioPos];
    const audiOut = `${projectName}-video-part-${audioPos}.mp3`;
    const spliitFileAudio = await splitAudioPart(audio, projectName, audiOut);
    splited_audios.push(spliitFileAudio);
  }
};
