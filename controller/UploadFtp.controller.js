import {
  DIRECTORY_SEPARATOR,
  FTP_CREDENTIALS,
  FTP_DESTINATION_DIR,
  FTP_ENDPOINT,
  upload_dir,
} from "../config/constant.config.js";
import FTPServices from "../services/FTPServices.services.js";

const ftpservices = new FTPServices(FTP_CREDENTIALS);

const sendProcess = async (source, destination, filename) => {
  try {
    await ftpservices.connect();
    await ftpservices.send(source, destination);
    const link = `${FTP_ENDPOINT}/${filename}`;
    console.log(link);
  } catch (error) {
    throw new Error(error);
  }
};

export const sendFTP = (req, res) => {
  try {
    const filename = `1701167231509_GS010093.mp4`;
    const source = `${upload_dir}${DIRECTORY_SEPARATOR}${filename}`;
    const destination = `${FTP_DESTINATION_DIR}/${filename}`;

    sendProcess(source, destination, filename);
    res.json("envoie du fichier en cours");
  } catch (error) {
    res.status(500).json(error.message);
  }
};
