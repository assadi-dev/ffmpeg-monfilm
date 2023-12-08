import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const dir = `uploads/chunk`;

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      chmodSync(dir, 777);
    }

    callback(null, dir);
  },
  /* filename: (req, file, callback) => {
    const name = file.originalname.toLowerCase().replace(/\s/g, "_");
    const extension = file.mimetype.split("/")[1];
    callback(null, `${Date.now()}_${name}`);
  }, */
});

export const flow_multer = multer({ storage: storage });
