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


router.post("/create", checkAuth, overrideUploadConfig, uploadMiddleware, FileUploadController.createFile);
router.get("/retrieve/:id", checkAuth, FileUploadController.retrieveFile);

module.exports = router;
