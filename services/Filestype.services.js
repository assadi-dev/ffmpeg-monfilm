import { platform } from "../config/constant.config.js";

export const getDelimiter = () => {
  if (platform == "win32") return "\\";
  else return "/";
};
