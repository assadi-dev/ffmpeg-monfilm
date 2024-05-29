export const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "FFMPEG Traitement Video API",
      version: "1.0.0",
      description:
        "API for video converter. Attention : base URL is http://localhost:5500/api",
    },
    host: "localhost:5500",
  },

  apis: ["./docs/openapi/paths/*.yaml"],
};
