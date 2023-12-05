import tinyStorageClient from "tiny-storage-client";

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

  uploadLargeFile() {}

  sendManifest() {}

  uploadSegment() {}

  createContainer() {}

  deleteFile() {}
}
