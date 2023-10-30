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

export const DIRECTORY_SEPARATOR = getDelimiter();
/**
 * Emplacement des traitement des fichiers
 */
export const upload_dir = `${__dirname}${DIRECTORY_SEPARATOR}uploads`;

export const domain = `${process.env.SERVER_HOST}:${process.env.PORT || 5500}`;
