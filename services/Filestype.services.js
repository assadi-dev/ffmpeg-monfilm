import { platform } from "../config/constant.config.js";

export const getDelimiter = () => {
  if (platform == "win32") return "\\";
  else return "/";
};

export const generateGoprfilesObject = (fileObject) => {
  if (fileObject) {
    return {
      id: fileObject.id,
      filename: fileObject.filename,
      camera: fileObject.camera,
      progress: 0,
    };
  }
};
