import path from "path";
import os from "os";
import dotenv from "dotenv";
import { getDelimiter } from "../services/Filestype.services.js";
dotenv.config();

export const __dirname = path.resolve();

/**
 * Retourne l'os
 * @return {string} ```'aix', 'darwin', 'freebsd','linux','openbsd', 'sunos', and 'win32'```
 */
export const platform = os.platform();

export const hostname = os.hostname();

/**
 * Retourne le délimiteur des dossier en fonction de l'OS
 */
export const DIRECTORY_SEPARATOR = getDelimiter();
/**
 * Emplacement des traitement des fichiers
 */
export const upload_dir = `${__dirname}${DIRECTORY_SEPARATOR}uploads`;

export const domain = `${process.env.SERVER_HOST}:${process.env.PORT || 5500}`;

//TODO : Fix Temporaire pour la suppression des fichiers .360 et .insv
export const URL_FILE_UPLOAD = process.env.URL_FILE_UPLOAD;

/**
 * Credential ObjectStorage OVH
 */
export const OVH_CREDENTIALS = {
  authUrl: process.env.OVH_OBJECT_STORAGE_AUTH_URL,
  username: process.env.OVH_OBJECT_STORAGE_USERNAME,
  password: process.env.OVH_OBJECT_STORAGE_USER_PASSWORD,
  region: process.env.OVH_OBJECT_STORAGE_REGION,
  endpoint: process.env.OVH_OBJECT_STORAGE_ENDPOINT,
};

export const CONTAINER_EVASION = process.env.OVH_OBJECT_STORAGE_CONTAINER;

/**
 * Credential service FTP
 */

export const FTP_CREDENTIALS = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  secure: false,
};

export const FTP_ENDPOINT = process.env.FTP_STATIC_LOW_URL;
export const FTP_DESTINATION_DIR = process.env.FTP_UPLOAD_DIR;
export const EVASION_API = `${process.env.EVASION_SITE}/api`;

export const OVH_CONTAINER = process.env.OVH_OBJECT_STORAGE_CONTAINER;

export const WEBSOCKET_PATH = process.env.WEBSOCKET_PATH;
