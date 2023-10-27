export const upload_gopro = (req, res) => {
  const file = req?.files;
  const filename = file?.filename;
  const idProjectvideo = req.body?.idProjectvideo;

  let filesData = [...req?.files].map((item) => item.filename);
  let jsonRes = { idProjectvideo, filesData };
  res.json(jsonRes);
};
