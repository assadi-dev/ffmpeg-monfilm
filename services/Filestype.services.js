import { createWriteStream, existsSync, unlinkSync, write } from "fs";
import {
  DIRECTORY_SEPARATOR,
  URL_FILE_UPLOAD,
  __dirname,
  upload_dir,
  platform,
} from "../config/constant.config.js";
import slugify from "slugify";
import fetch from "node-fetch";

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
  //console.log(URL_UPLOADS, filepath);
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
    remove: /[*+~()'"!:@]/g,
    lower: true,
    trime: true,
  });
};

/**
 * Écrire un fichier à partir d'une URL
 * @param {string} url
 * @param {string} filename
 * @param {string} path_destination Destination du fichier
 */

export const writeFileFromUrl = (url, filename, path_destination) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const unit8Array = new Uint8Array(buffer);
        const path = `${path_destination}${DIRECTORY_SEPARATOR}${toSlugify(
          filename
        )}`;

        const writeStream = createWriteStream(path);
        writeStream.write(unit8Array, (err) => {
          if (err) {
            throw new Error(err);
          } else {
            writeStream.end();
          }
        });

        writeStream.on("finish", () => {
          resolve({ path: path, filename: filename });
        });
        writeStream.on("error", (err) => {
          reject(err);
        });
      } else {
        throw new Error("Error fetch video");
      }
    } catch (error) {
      throw error;
    }
  });
};

/**
 * Retourne la liste des fichiers téléchargés
 * @param {Array} files
 * @param {String} destination Dossier d’empagement à enregistrer
 */

export const getDownloadedExportFiles = async (files = [], destination) => {
  return new Promise(async (resolve, reject) => {
    const downloadedFiles = [];
    try {
      for (const file of files) {
        if (file.src && file.filename && file.id) {
          const snapshot = await writeFileFromUrl(
            file.src,
            `${file.id}_${file.filename}`,
            destination
          );
          downloadedFiles.push({ ...file, src: snapshot.path });
        }
      }
      resolve(downloadedFiles);
    } catch (error) {
      reject(error);
    }
  });
};
