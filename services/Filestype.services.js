import { existsSync, unlinkSync } from "fs";
import {
  DIRECTORY_SEPARATOR,
  URL_FILE_UPLOAD,
  __dirname,
  domain,
  platform,
} from "../config/constant.config.js";
import slugify from "slugify";

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
  const URL_UPLOADS = URL_FILE_UPLOAD + "/uploads/";
  console.log(URL_UPLOADS, filepath);
  const UPLOAD_FILES_PATH = `${__dirname}${DIRECTORY_SEPARATOR}uploads${DIRECTORY_SEPARATOR}`;
  return filepath.replace(URL_UPLOADS, UPLOAD_FILES_PATH);
};

/**
 * Execution de la fonction après un temps donné en millisecondes
 * @param {number} delay en millisecondes
 * @param {any} callback fonction à executer
 */
export const postDelayed = (delay = 500, callback = () => {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      callback();
      resolve("success");
    }, delay);
  });
};

/**
 * Suppression d'un fichier physiquement
 * .
 * @param {string} path Emplacement du fichier
 */
export const removeFile = (path) => {
  if (existsSync(path)) {
    unlinkSync(path);
  }
};

/**
 * Conversion d'un nom en slug
 * @param {String} name
 * @returns
 */
export const toSlugify = (name) => {
  return slugify(name, {
    replacement: "_",
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    trime: true,
  });
};
