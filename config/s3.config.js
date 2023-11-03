import { S3Client } from "@aws-sdk/client-s3";

const options = {
  endpoint: `https://s3.gra.io.cloud.ovh.net/`,
  credentials: {
    accessKeyId: "68e1b4fb1a33410b878fb1842aedc66b",
    secretAccessKey: "0edb809b5ef042e4b6369eaf5c950bc9",
  },
  region: "gra",
};

export const s3 = new S3Client(options);
