const FileUpload = require("../models/file-upload.model");
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");

exports.getFiles = (req, res, next) => {
  const fileQuery = FileUpload.find();

  fileQuery
    .then((fetchedFiles) => {
      res.status(200).json({
        message: "Files fetched successfully!",
        files: fetchedFiles,
      });
    })
    .catch((error) => {
      logger.log(error);
      res.status(500).json({
        message: "Fetching files failed!",
      });
    });
};

exports.getAllFiles = async (req, res) => {
  try {
    const files = await FileUpload.find().sort({ uploadTime: -1 }); // optional: sort by newest first
    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch file list" });
  }
};

exports.createFile = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const savedFiles = await Promise.all(
      req.files.map((file) => {
        return new FileUpload({
          filename: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
        }).save();
      })
    );

    req.savedFiles = savedFiles; // Pass to next handler
    res.status(201).json({ message: "Files uploaded", files: savedFiles });

  } catch (err) {
    logger.error("❌ File save error:", err);
    res.status(500).json({ error: "Failed to save file metadata" });
  }
};

exports.retrieveFile = async (req, res) => {
  const fileId = req.params.id;

  try {
    // Find the file metadata in the database
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Build the absolute file path
    const filePath = file.filepath;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Send the file to the client
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found on server" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};

exports.updateFile = async (req, res) => {
  const fileId = req.params.id;
  const { filename, filepath } = req.body; // Assuming filename and filepath can be updated

  try {
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Update metadata in MongoDB
    if (filename) file.filename = filename;
    if (filepath) file.filepath = filepath;

    const updatedFile = await file.save();

    res
      .status(200)
      .json({ message: "File metadata updated", file: updatedFile });
  } catch (err) {
    res.status(500).json({ error: "Failed to update file metadata" });
  }
};

exports.deleteFile = async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = file.filepath;

    // Delete the file from the server
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the file metadata from MongoDB
    await file.deleteOne(); // Corrected method here

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
};
