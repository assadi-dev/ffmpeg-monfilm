import {
  DIRECTORY_SEPARATOR,
  __dirname,
  domain,
  platform,
} from "../config/constant.config.js";

export const getDelimiter = () => {
  if (platform == "win32") return "\\";
  else return "/";
};

export const generateGoprofilesObject = (fileObject) => {
  if (fileObject) {
    return {
      id: fileObject.id,
      filename: fileObject.filename,
      camera: fileObject.camera,
      path: cleanPathName(fileObject.path),
      progress: 0,
    };
  }
};
export const generateInsvfilesObject = (fileObject) => {
  if (fileObject) {
    return {
      id: fileObject.id,
      filename: fileObject.filename,
      camera: fileObject.camera,
      front: cleanPathName(fileObject.front),
      back: cleanPathName(fileObject.back),
      progress: 0,
      model: fileObject.model,
    };
  }
};

/**
 * Retourne l'emplacement réelle du fichier
 * @param {*} filepath
 * @returns
 */
export const cleanPathName = (filepath = "") => {
  const URL_UPLOADS = domain + "/uploads/";
  const UPLOAD_FILES_PATH = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}`;
  return filepath.replace(URL_UPLOADS, UPLOAD_FILES_PATH);
};
