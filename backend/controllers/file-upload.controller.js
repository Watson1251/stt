const FileUpload = require("../models/file-upload.model");
const path = require("path");
const fs = require("fs");

exports.createFile = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    try {
        const saved = await Promise.all(
            req.files.map(file => {
                return new FileUpload({
                    filename: file.originalname,
                    filepath: file.path,
                    // uploadedBy: req.userData.userId,
                }).save();
            })
        );

        res.status(201).json({ message: "Files uploaded", files: saved });
    } catch (err) {
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