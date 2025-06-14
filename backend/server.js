const app = require("./app");
const debug = require("debug")("node-angular");
const http = require("http");
const os = require("os");
const logger = require("./utils/logger");
logger.info("Starting backend service...");

const normalizePort = (val) => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const onError = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
  switch (error.code) {
    case "EACCES":
      logger.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const getInternalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
  debug("Listening on " + bind);

  const internalIp = getInternalIp();
  logger.info(`Serving at: http://${internalIp}:${port}`);
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port, "0.0.0.0");

// Load consumers
const startConsumers = async () => {
  const startConvertConsumer = require("./consumers/convert.consumer");
  const startSplitConsumer = require("./consumers/split.consumer");

  try {
    await startConvertConsumer();
    await startSplitConsumer();
  } catch (err) {
    logger.error("❌ Failed to start consumers:", err);
  }
};

startConsumers();
