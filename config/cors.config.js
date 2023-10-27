const corsOptions = {
  origin: "*",
  allowedHeaders: [
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
  ],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

export default corsOptions;
