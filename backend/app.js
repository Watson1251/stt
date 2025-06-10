const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./utils/logger");
const rabbitmq = require("./utils/rabbitmq");

dotenv.config();

const fileUploadRoutes = require("./routes/file-upload.route");

const app = express();

app.use(cors());

const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/stt_db";

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info(`Database at: ${mongoUrl}`);
  })
  .catch((error) => {
    logger.error(error);
    logger.error("Connection failed!");
  });

// connect to RabbitMQ
(async () => {
  try {
    await rabbitmq.connect(); // connect once globally
  } catch (err) {
    logger.error("❌ RabbitMQ connection failed:", err);
  }
})();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use('/media', express.static(path.join(__dirname, '../db/tweet_media')));
// app.use("/", express.static(path.join(__dirname, "angular", "browser")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/api/file-upload", fileUploadRoutes);

// app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, "angular", "index.html"));
// });

module.exports = app;
