/*
 *  File: index.js
 *  Author: Assadi Halifa
 *  Description: Streaming multer storage engine for OVH Object Storage.
 */

import path from "path";
import "request";
import { stat } from "node:fs/promises";

function collect(storage, req, file, cb) {
  cb.call(storage, null, {
    version: storage.version,
    username: storage.username,
    password: storage.password,
    authURL: storage.authURL,
    region: storage.region,
    container: storage.container,
  });
}

function OVHObjectStorage(opts) {
  switch (typeof opts.version) {
    case "number":
    case "undefined":
      this.version = opts.version || 2;
      break;
    default:
      throw new TypeError("Expected opts.version to be number");
  }

  switch (typeof opts.username) {
    case "string":
      this.username = opts.username;
      break;
    default:
      throw new TypeError("Expected opts.username to be string");
  }

  switch (typeof opts.password) {
    case "string":
      this.password = opts.password;
      break;
    default:
      throw new TypeError("Expected opts.password to be string");
  }

  switch (typeof opts.authURL) {
    case "string":
      this.authURL = opts.authURL;
      break;
    default:
      throw new TypeError("Expected opts.authURL to be string");
  }

  switch (typeof opts.region) {
    case "string":
      this.region = opts.region;
      break;
    default:
      throw new TypeError("Expected opts.region to be string");
  }

  switch (typeof opts.container) {
    case "string":
      this.container = opts.container;
      break;
    default:
      throw new TypeError("Expected opts.container to be string");
  }
}

function connect(opts) {
  const json = {
    auth: {
      identity: {
        methods: ["password"],
        password: {
          user: {
            name: opts.username,
            domain: {
              name: "Default",
            },
            password: opts.password,
          },
        },
      },
    },
  };

  return new Promise((resolve, reject) => {
    var tokenEndpoint = "/tokens";
    if (opts.version === 3) {
      var tokenEndpoint = "/auth" + tokenEndpoint;
    }
    request(
      {
        method: "POST",
        uri: opts.authURL + tokenEndpoint,
        json: json,
        headers: { Accept: "application/json" },
      },
      function (err, res, body) {
        if (err) return reject(err);
        if (body.error) return reject(new Error(body.error.message));
        if (!body.token)
          return reject(new Error("Connection response incomplete"));

        const token = res.headers["x-subject-token"];
        let catalog = body.token.catalog.find((c) => c.type === "object-store");
        const endpoint = catalog.endpoints.find(
          (e) => e.region && e.region === opts.region
        );

        resolve({ token, endpoint });
      }
    );
  });
}

function formatTargetURL(publicURL, container, filename) {
  const baseURL = publicURL + "/" + container + "/";
  return baseURL + filename;
}

function createFilename(filename) {
  const extention = path.extname(filename);
  const random = (Math.random() + 1).toString(36).substring(7);
  return Date.now() + "-" + filename;
}

OVHObjectStorage.prototype._handleFile = function (req, file, cb) {
  collect(this, req, file, function (err, opts) {
    if (err) return cb(err);

    connect(opts)
      .then(async (res) => {
        const publicURL =
          opts.version === 3 ? res.endpoint.url : res.endpoint.publicURL;
        const filename = createFilename(file.originalname);
        const params = {
          targetURL: formatTargetURL(publicURL, opts.container, filename),
          headers: {
            "X-Auth-Token": res.token,
            Accept: "application/json",
          },
        };
        let read = 0;

        const stream = file.stream;
        let size = stream._readableState.length;

        stream.on("data", (chunk) => {
          read += chunk.length;
          let progress = Math.round(100 * read);
        });
        stream.pipe(
          request(
            {
              method: "PUT",
              uri: params.targetURL,
              headers: params.headers,
            },
            function (error, response, body) {
              if (error) return cb(err);
              cb(null, {
                filename: filename,
                url: params.targetURL,
              });
            }
          )
        );

        stream.on("end", () => {
          console.log("end upload of" + file.originalname);
          stream.destroy();
        });

        stream.on("error", (error) => {
          console.log(error);
        });
      })
      .catch((err) => {
        return cb(err);
      });
  });
};

module.exports = function (opts) {
  return new OVHObjectStorage(opts);
};
