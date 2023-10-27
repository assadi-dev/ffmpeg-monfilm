import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const dir = `uploads/`;

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    callback(null, dir);
  },
  filename: (req, file, callback) => {
    const name = file.originalname.toLowerCase().replace(/\s/g, "_");
    const extension = file.mimetype.split("/")[1];
    callback(null, `${Date.now()}_${name}`);
  },
});

const upload = multer({ storage: storage });

export const progress_middleware = (req, res, next) => {
  console.log(req.body);
  let progress = 0;
  const file_size = req.headers["content-length"];
  // set event listener
  req.on("data", (chunk) => {
    progress += chunk.length;
    const percentage = (progress / file_size) * 100;
    // other code ...
    console.log(percentage);
  });

  // invoke next middleware
  next();
};

export default upload;
