import tinyStorageClient from "tiny-storage-client";
import fs, { createWriteStream, writeFileSync } from "fs";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";
import path, { resolve } from "path";
import EventEmitter from "events";
import { PROGRESS, SUCCESS } from "../config/event.js";

export default class OvhObjectStorageServices {
  /**
   * nom du container
   */
  container;

  /**
   * nom du fichier
   *
   */
  filename;

  /**
   * emplacement du fichier
   */
  filepath;

  /**
   * object contenant les propriete de connection au bucket
   */
  credential;

  /**
   * contient le token d'cces
   */
  authToken;

  /**
   * Contient l'instance de l'objectStorage
   */
  clientStorage;

  /**
   * contient l'url du endpoint
   */
  endpoint;

  /**
   * contient l'instance EventEmitter
   */
  event;

  /**
     * credential object 
     * ```
     * {
     *      authUrl:"";
            username:""
            password:"";
            region:"";
            endpaint:""
     * }
    ```
     */
  constructor(credential) {
    this.credential = credential;
    this.clientStorage = tinyStorageClient(credential);
    this.endpoint = credential?.endpoint;
    this.event = new EventEmitter();
  }

  connect() {
    return new Promise((resolve) => {
      this.clientStorage.connection((err) => {
        if (err) {
          console.log(err);
          return;
        }
        this.authToken = this.clientStorage.getConfig().token;
        resolve(this.authToken);
      });
    });
  }

  setContainer(name) {
    this.container = name;
  }
  setEndpoint(url) {
    this.endpoint = url;
  }
  getAuthToken() {
    return new Promise((resolve) => {
      this.clientStorage.connection((err) => {
        if (err) {
          console.log(err);
          return;
        }
        const token = this.clientStorage.getConfig().token;
        resolve(token);
      });
    });
  }

  /**
   *  Obtenir la progression de l'upload du fichier en cours
   * @param {Function} callback
   */
  onProgress(callback = () => {}) {
    this.event.on(PROGRESS, (data) => {
      callback(data);
    });
  }

  /**
   * Obtenir les resultat de 'lupload
   * @param {*} callback
   */
  onSuccess(callback = () => {}) {
    this.event.on(SUCCESS, (data) => {
      callback(data);
    });
  }

  /**
   * Upload gros fichiers multiparts en dynamique
   *
   *  voir le [liens](https://docs.openstack.org/swift/latest/overview_large_objects.html) et [ici](https://docs.openstack.org/swift/latest/api/large_objects.html)
   *
   * ```js
   * config = {
   *  filePath:"",
   *  remoteFilename:"",
   *  containerName:"",
   *  segmentContainer:"",
   * segmentSize:
   * }
   * ```
   */
  async uploadLargeFile(options) {
    await this.connect();

    const {
      filePath,
      remoteFilename,
      containerName,
      segmentContainer,
      segmentSize,
    } = options;
    const CONTAINER = containerName || this.container;
    const SEGMENT_DESTINATION = segmentContainer || CONTAINER + "_segments";
    const SEGMENT_CHUNK_SIZE = segmentSize || 1024 * 1024 * 1024;
    this.container = containerName;

    const { size } = fs.statSync(filePath);
    const TOTAL_FILE_SIZE = size;
    const PREFIX = `${this.getTimestamp()}/${TOTAL_FILE_SIZE}`;

    return new Promise(async (resolve, reject) => {
      try {
        const result = { name: remoteFilename, url: "", size: TOTAL_FILE_SIZE };
        const check_result = await this.checkExistContainer(
          SEGMENT_DESTINATION
        );
        console.log(check_result);
        //Start upload
        let offset = 0;
        let segmentNumber = 1;
        let totalReadBytes = 0;

        const uploadArgs = {
          containerSegment: SEGMENT_DESTINATION,
          offset,
          filePath,
          remoteFilename,
          prefix: PREFIX,
          segmentNumber,
          segmentSize: SEGMENT_CHUNK_SIZE,
          totalReadBytes,
          totalFileSize: TOTAL_FILE_SIZE,
        };

        result.url = await this.uploadSegment(uploadArgs);
        //End upload
        resolve(result);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  /**
   * Envoie du manifest
   *Retourne le lien de du fichier uploadé
   */
  sendManifest(args) {
    return new Promise(async (resolve, reject) => {
      try {
        const { headers, remoteFilename } = args;

        const url = `${this.endpoint}/${this.container}/${remoteFilename}`;

        const manifestResponse = await fetch(url, {
          method: "PUT",
          headers,
        });

        if (manifestResponse.ok) {
          resolve(url);
        } else {
          throw new Error("Failed to upload the manifest file.");
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Envoie des segments
   */
  uploadSegment(args) {
    return new Promise(async (resolve, reject) => {
      try {
        let { offset, segmentNumber, segmentSize, totalReadBytes } = args;

        const {
          containerSegment,
          filePath,
          remoteFilename,
          prefix,
          totalFileSize,
        } = args;

        const segmentName = `${remoteFilename}/${prefix}/${segmentNumber
          .toString()
          .padStart(8, "0")}`;

        const readStream = fs.createReadStream(filePath, {
          start: offset,
          end: offset + segmentSize - 1,
        });

        await this.clientStorage.uploadFile(
          containerSegment,
          `${segmentName}`,
          () => readStream,

          {},
          async (err, res) => {
            if (err) {
              console.error(`Failed to upload segment ${segmentName}`);
              console.log(err);
              return;
            }

            console.log(`Uploaded segment ${segmentName}`);
            offset += segmentSize;
            segmentNumber++;

            if (offset < totalFileSize) {
              // Upload du segment suivant
              uploadSegment();
            } else {
              console.log("All segments uploaded successfully.");
              const optionManifest = {
                headers: {
                  "X-Auth-Token": this.authToken,
                  "X-Object-Manifest": `${containerSegment}/${remoteFilename}/${prefix}`,
                },
                remoteFilename,
              };

              const link = await this.sendManifest(optionManifest);
              const successResult = {
                name: remoteFilename,
                url: link,
                size: totalFileSize,
              };
              this.event.emit(SUCCESS, successResult);
              resolve(`${link}`);
            }
          }
        );

        readStream.on("data", (chunk) => {
          totalReadBytes += chunk.length;
          const progress = (totalReadBytes / totalFileSize) * 100;
          // console.log(`Upload progress: ${progress.toFixed(2)}%`);
          this.event.emit(PROGRESS, progress);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  checkExistContainer(containerSegment) {
    console.log(`Check if container segment exist`);
    let message = "";
    return new Promise(async (resolve) => {
      this.clientStorage.listBuckets(async (err, resp) => {
        if (err) {
          console.log(err.message);
        }
        const containers = resp.body;

        const segmentsContainer = containers?.find(
          (container) => container.name == containerSegment
        );

        if (!segmentsContainer) {
          await this.createContainer(containerSegment);
          message = "Container for segment has been created";

          resolve(message);
        } else {
          message = "Container Segment find";

          resolve(message);
        }
      });
    });
  }

  createContainer(containerName) {
    return new Promise(async (resolve) => {
      const headers = {
        "X-Auth-Token": this.authToken,
        "X-Container-Read": ".r:*",
      };

      try {
        if (!containerName) throw new Error("Container segment non defini");
        const url = `${this.endpoint}/${containerName}`;
        const response = await fetch(url, {
          method: "PUT",
          headers,
        });
        if (!response.ok) {
          throw new Error("Erreur creation du container");
        }
        resolve("success");
      } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
      }
    });
  }

  deleteFile() {}

  getTimestamp = () => {
    const dt = new Date();
    return dt.getTime();
  };
}
