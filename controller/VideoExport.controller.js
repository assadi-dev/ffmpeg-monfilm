import {
  concatenate_inputs,
  splitPart,
} from "../services/FFmpegExportProcess.services.js";

export const export_project = (req, res) => {
  try {
    const { start, end, input, output } = req.body;
    splitPart(start, end, input, output);
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
