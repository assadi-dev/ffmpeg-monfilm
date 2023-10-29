import { fileInsvObject, fileGoproObject } from "../config/fileTest.config.js";

export default class ObjectFileTest {
  typeCamera;

  /**
   *
   * @param {*} typeCamera type camera ```insv | gopro```
   */
  constructor(typeCamera) {
    this.typeCamera = typeCamera;
  }

  get_random_project() {
    let listFiles =
      this.typeCamera == "insv" ? fileInsvObject : fileGoproObject;

    let date = new Date();
    let randomIndex = Math.round(Math.random() * (listFiles.length - 1));
    let getRandom = listFiles[randomIndex];
    let old_name = getRandom.filename.trim().split("_");

    getRandom.filename = `${date.getTime()}_${old_name.at(-1)}`;
    return getRandom;
  }
}
