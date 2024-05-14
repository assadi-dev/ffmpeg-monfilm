import { createLogger, format, transports } from "winston";
import path from "path";
const { combine, timestamp, label, simple } = format;

export class LogSystem {
  logger;
  constructor() {
    this.logger = createLogger({
      format: combine(timestamp(), simple()),
      transports: [
        new transports.File({ filename: path.resolve("./logs/combined.log") }),
        new transports.File({
          filename: path.resolve("./logs/error.log"),
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
}
