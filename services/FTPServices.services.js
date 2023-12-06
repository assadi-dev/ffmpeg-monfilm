import * as ftp from "basic-ftp";

export default class FTPServices {
  credentials;
  client;

  /**
   * Donées de connexions FTP
   *
   * ```
   *      host = "myftpserver.com",
   *      user = "very",
   *     password = "password",
   *     secure = true
   * ```
   * @param {*} credentials
   */
  constructor(credentials) {
    this.credential = credentials;
    this.client = new ftp.Client();
  }

  connect() {
    return this.client.access(this.credential);
  }

  /**
   *
   * @param {*} source_file Chemin source du fichier
   * @param {*} destination_file Chemin de destination
   */
  send(source_file, destination_file) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.uploadFrom(source_file, destination_file);
        resolve("success");
      } catch (error) {
        reject(error);
      }
      this.client.close();
    });
  }

  async list() {
    return await this.client.list();
  }
}
