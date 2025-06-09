const express = require("express");
const checkAuth = require("../middleware/check-auth");
const uploadMiddleware = require("../middleware/upload-middleware");
const FileUploadController = require("../controllers/file-upload.controller");

const router = express.Router();

// Inject override parameters into req
const overrideUploadConfig = (req, res, next) => {
  req._uploadOptions = {
    uploadSubdir: "custom/",
    mimeTypeMap: {
      // Video formats
      "video/mp4": "mp4",
      "video/x-matroska": "mkv",
      "video/quicktime": "mov",
      "video/x-msvideo": "avi",
      "video/webm": "webm",

      // Audio formats
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/ogg": "ogg",
      "audio/webm": "weba",
      "audio/mp4": "m4a",
    },
  };
  next();
};

router.get("/", checkAuth, FileUploadController.getAllFiles);
router.post(
  "/",
  checkAuth,
  overrideUploadConfig,
  uploadMiddleware,
  FileUploadController.createFile
);
router.put("/:id", checkAuth, FileUploadController.updateFile);
router.get("/:id", checkAuth, FileUploadController.retrieveFile);
router.delete("/:id", checkAuth, FileUploadController.deleteFile);

module.exports = router;
