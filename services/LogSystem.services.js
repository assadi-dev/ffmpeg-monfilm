import { createLogger, format, transports } from "winston";
import path from "path";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { DIRECTORY_SEPARATOR } from "../config/constant.config.js";
const { combine, timestamp, label, simple } = format;

export class LogSystem {
  logger;
  constructor() {
    const logPath = `${path.resolve()}${DIRECTORY_SEPARATOR}logs${DIRECTORY_SEPARATOR}combined.log`;
    this.init_path(logPath);
    const logErrorPath = `${path.resolve()}${DIRECTORY_SEPARATOR}logs${DIRECTORY_SEPARATOR}error.log`;

    this.logger = createLogger({
      format: combine(timestamp(), simple()),
      transports: [
        new transports.File({ filename: logPath }),
        new transports.File({
          filename: logErrorPath,
          level: "error",
        }),
      ],
    });
  }

  setLabel(labelString) {
    this.logger = createLogger({
      format: combine(label({ label: labelString }), timestamp(), simple()),
      transports: [
        new transports.File({ filename: path.resolve("./logs/combined.log") }),
        new transports.File({
          filename: path.resolve("./logs/error.log"),
          level: "error",
        }),
      ],
    });
  }

  setInfo(message) {
    this.logger.log({
      level: "info",
      message: message,
    });
  }

  setError(message) {
    this.logger.log({
      level: "error",
      message: message,
    });
  }

  setWarn(message) {
    this.logger.log({
      level: "warn",
      message: message,
    });
  }

  init_path(path) {
    if (!existsSync(path)) {
      //writeFileSync(path, "");
      chmodSync(path, "777");
    }
  }
}
