const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DEFAULT_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../../db/media");
const DEFAULT_MAX_FILE_SIZE_MB = 100;

module.exports = function dynamicUpload(req, res, next) {
  const maxFileSizeMB = req._uploadOptions?.maxFileSizeMB || DEFAULT_MAX_FILE_SIZE_MB;

  // Resolve mimeTypeMap
  let mimeTypeMap = req._uploadOptions?.mimeTypeMap || "any";
  if (!req._uploadOptions?.mimeTypeMap) {
    try {
      const parsed = JSON.parse(req.body.mimeTypeMap || req.query.mimeTypeMap || "{}");
      if (Object.keys(parsed).length > 0) mimeTypeMap = parsed;
    } catch {
      mimeTypeMap = "any";
    }
  }

  // Resolve subdirectory structure
  const subDir = req._uploadOptions?.uploadSubdir || req.body.uploadSubdir || req.query.uploadSubdir || "";
  const finalUploadDir = path.join(DEFAULT_UPLOAD_DIR, subDir);

  // Ensure destination folder exists
  fs.mkdirSync(finalUploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isValid = mimeTypeMap === "any" || mimeTypeMap[file.mimetype];
      return isValid
        ? cb(null, finalUploadDir)
        : cb(new Error("Invalid mime type"), null);
    },
    filename: (req, file, cb) => {
      let ext = "bin";

      if (mimeTypeMap !== "any" && mimeTypeMap[file.mimetype]) {
        ext = mimeTypeMap[file.mimetype];
      } else if (file.originalname) {
        const parsedExt = path.extname(file.originalname).slice(1);
        if (parsedExt) ext = parsedExt;
      }

      const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const isAccepted = mimeTypeMap === "any" || mimeTypeMap[file.mimetype];
    cb(isAccepted ? null : new Error("Unsupported file type"), isAccepted);
  };

  const limits = { fileSize: maxFileSizeMB * 1024 * 1024 };

  const upload = multer({ storage, fileFilter, limits }).any();

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};
