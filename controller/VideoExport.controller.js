import {
  files_mapping,
  concatenate_combined_videos,
  concatenate_combined_audios,
  files_mapping_no_audio,
  delete_workspace_export,
  create_workspace_export,
  injectVideo360Metadata,
} from "../services/FFmpegExportProcess.services.js";
import OvhObjectStorageServices from "../services/OvhObjectStorage.services.js";
import {
  DIRECTORY_SEPARATOR,
  EVASION_API,
  OVH_CONTAINER,
  OVH_CREDENTIALS,
  upload_dir,
  WEBSOCKET_PATH,
} from "../config/constant.config.js";
import { ws } from "../index.js";
import { existsSync, renameSync, statSync } from "fs";
import { clean_file_process } from "../services/FFmpegCameraProcess.services.js";
import {
	getDownloadedExportFiles,
	postDelayed,
	removeFile,
} from "../services/Filestype.services.js";
import fetch from "node-fetch";
import { toSlugify } from "../services/Filestype.services.js";
import {
  logErrorVideoProcess,
  logVideoProcess,
} from "../services/FullProcess.services.js";
import { eventFeedbackExportPublish } from "../config/ffmpegComand.config.js";

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
		const { scenes } = req.body;

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
	try {
		console.log(`Export project: ${idProjectVideo}`);
		logVideoProcess(
			`Export project: ${idProjectVideo}`,
			`Start export process project: ${idProjectVideo} room: ${room}`
		);

		const projectSlug = toSlugify(projectName);

		const export_file = `${upload_dir}${DIRECTORY_SEPARATOR}export_file${DIRECTORY_SEPARATOR}${projectSlug}`;

		if (existsSync(export_file)) {
			delete_workspace_export(export_file);
		}
		await postDelayed(3000);
		create_workspace_export(export_file);

		console.log("Téléchargement des fichiers");
		logVideoProcess(
			`Export project: ${idProjectVideo}`,
			`Téléchargement des fichiers videos`
		);

		let finishProgress = 0;

		/**
		 * Notifie la progression du téléchargement
		 * @param {Object} fileDataProgress objet contenant la progression du fichier
		 * @param {number} finishProgress  stockage des progression terminé
		 */
		const getProgressDownloaded = async (fileDataProgress) => {
			const totalProgress = scenes.length * 100;
			fileDataProgress.progress >= 100 ? (finishProgress += 100) : 0;
			const avgProgress = Math.floor(
				((finishProgress + fileDataProgress.progress) / totalProgress) * 100
			);
			let finalProgress = avgProgress >= 100 ? 100 : avgProgress;

			const status = {
				step: "download",
				progress: finalProgress,
			};

			ws.of(WEBSOCKET_PATH).to(room).emit("export-project-video", status);
		};

		const filesVideo = await getDownloadedExportFiles(
			scenes,
			export_file,
			getProgressDownloaded
		);
		scenes = filesVideo;

		logVideoProcess(
			`Export project: ${idProjectVideo}`,
			`Concatenation des fichiers videos`
		);

		const mergedVideos = await concate_process_videos(room, scenes, projectSlug);

		let final_result = "";

		if (audios.length == 0) {
			console.log("Mapping fichiers video no audio");
			const finalOutput = `${projectSlug}.mp4`;
			const final_video_input = await files_mapping_no_audio(
				mergedVideos,
				projectSlug,
				finalOutput,
				room,
				maxDuration
			);
			final_result = final_video_input;
		} else {
			console.log("Concatenation des fichiers audios");
			const filesAudio = await getDownloadedExportFiles(audios, export_file);
			audios = filesAudio;

			const final_audio_output = await concate_process_audio(
				room,
				audios,
				projectSlug
			);

			console.log("Mapping fichiers video et audios");
			const finalOutput = `${projectSlug}.mp4`;
			final_result = await files_mapping(
				mergedVideos,
				final_audio_output,
				projectSlug,
				finalOutput,
				room,
				maxDuration
			);
		}

		console.log("Injection metadata 360");
		const injectOutput = final_result.replace(".mp4", "-injected-metadata.mp4");
		await injectVideo360Metadata(final_result, injectOutput);
		removeFile(final_result);
		const final_injected = injectOutput.replace("-injected-metadata.mp4", ".mp4");
		renameSync(injectOutput, final_injected);

		console.log("Metadata 360 injected !");
		const remoteFilename = `${timestamp()}_${projectSlug}.mp4`;
		const FinalObject = { filePath: final_injected, remoteFilename };

		const url = await upload_ovh(room, FinalObject);

		const { size } = statSync(final_result);

		//Envoie ovh
		console.log("send ovh");
		const resProject = await updateUserProject(
			idProjectVideo,
			remoteFilename,
			url,
			maxDuration,
			size
		);

		if (resProject.ok) {
			console.log("Project has been updated with success");
			postDelayed(10000, () => delete_workspace_export(export_file));
			logVideoProcess();
		} else {
			resProject.json().then((errorMessage) => {
				console.log("Error update project", errorMessage);
				logErrorVideoProcess(
					"Export project",
					"Error update project: " + errorMessage
				);
			});
		}
	} catch (error) {
		console.log("error", error);
		console.log(room);
		ws.of(WEBSOCKET_PATH).to(room).emit("export-error", error.message);
		logErrorVideoProcess("Export project", error.message);
	}
};

//Utilitaire
export const retrieveDuration = (inputs) => {
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

  console.log("start concate_process_videos");

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
  const outputConcatenateAudio = `final-audio-${toSlugify(projectName)}.m4a`;
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
  try {
    return new Promise((resolve) => {
      const { filePath, remoteFilename } = fileObjetct;

      const status = {
        step: "ovh",
        message: "start",
        filename: fileObjetct.filename,
        progress: 0,
        url: "",
        error: "",
      };

      (async () => {
        const ovhStorageServices = new OvhObjectStorageServices(
          OVH_CREDENTIALS
        );

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
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackExportPublish.publish, status);
        };
        ovhStorageServices.onProgress(listen);
        const finish = (response) => {
          status.progress = 100;
          status.message = "done";
          status.url = response?.url;
          ws.of(WEBSOCKET_PATH)
            .to(room)
            .emit(eventFeedbackExportPublish.publish, status);
          resolve(response?.url);
          clean_file_process(filePath);
          logVideoProcess("Upload OVH ", `Upload OVH OK:  ${response?.url}`);
        };
        ovhStorageServices.onSuccess(finish);
      })();
    });
  } catch (error) {
    const message = error.message;
    console.error("Upload error:", message);
    logErrorVideoProcess("Upload OVH error", `Erreur: ${message}`);

    ws.of(WEBSOCKET_PATH)
      .to(room)
      .emit(eventFeedbackExportPublish.error, error.message);
  }
};

/**
 *
 * @param {*} idProjectVideo id du projet
 * @param {*} exportUrl lien de la video exporté
 * @returns
 */
const updateUserProject = (
  idProjectVideo,
  filename,
  exportUrl,
  duration,
  size
) => {
  const url = `${EVASION_API}/v2/project/update/export`;
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
