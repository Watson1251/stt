const express = require("express");
const checkAuth = require("../middleware/check-auth");
const uploadMiddleware = require("../middleware/upload-middleware");
const FileUploadController = require("../controllers/file-upload.controller");

const router = express.Router();

// Inject override parameters into req
const overrideUploadConfig = (req, res, next) => {
    req._uploadOptions = {
        uploadSubdir: "custom/",
        // maxFileSizeMB: 50,
        // mimeTypeMap: {
        //     "image/png": "png",
        //     "image/jpeg": "jpg",
        //     "video/mp4": "mp4"
        // }
    };
    next();
};


router.post("/", checkAuth, overrideUploadConfig, uploadMiddleware, FileUploadController.createFile);
router.put("/:id", checkAuth, FileUploadController.updateFile);
router.get("/:id", checkAuth, FileUploadController.retrieveFile);
router.delete("/:id", checkAuth, FileUploadController.deleteFile);

module.exports = router;
