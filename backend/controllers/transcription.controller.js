const Transcription = require("../models/transcription.model");
const FileUpload = require("../models/file-upload.model");
const logger = require("../utils/logger");
const rabbitmq = require("../utils/rabbitmq");

exports.getTranscriptions = async (req, res) => {
  try {
    const transcriptions = await Transcription.find();
    res.status(200).json({
      message: "Transcriptions fetched successfully!",
      transcriptions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fetching transcriptions failed!" });
  }
};

exports.getTranscription = async (req, res) => {
  try {
    const transcription = await Transcription.findById(req.params.id);
    if (transcription) {
      res.status(200).json(transcription);
    } else {
      res.status(404).json({ message: "Transcription not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fetching transcription failed!" });
  }
};

exports.createTranscription = async (req, res) => {
  const { fileId, segmentIds, status, enhancedpath } = req.body;

  const transcription = new Transcription({
    fileId,
    segmentIds: segmentIds || [],
    status,
    enhancedpath: enhancedpath || "",
  });

  try {
    const created = await transcription.save();

    // ✅ Publish the transcription after creation
    const file = await FileUpload.findById(fileId);
    if (!file) {
      logger.warn(`⚠️ File with ID ${fileId} not found, cannot queue transcription`);
    } else {
      const isAudio = file.mimetype?.startsWith("audio/");
      const queueName = isAudio
        ? process.env.SPLIT_QUEUE || "split_queue"
        : process.env.CONVERT_QUEUE || "convert_queue";

      const payload = {
        fileId: file._id.toString(),
        filepath: file.filepath,
        transcriptionId: created._id.toString(),
      };

      try {
        await rabbitmq.publish(queueName, payload);
        logger.info(`📤 Transcription ${created._id} queued to ${queueName}:`, payload);
      } catch (err) {
        logger.error(
          `❌ Failed to queue transcription ${created._id} to ${queueName}: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`
        );
      }

    }

    res.status(201).json({
      message: "Transcription added and queued successfully",
      transcription: created,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Creating transcription failed!" });
  }
};

exports.updateTranscription = async (req, res) => {
  const { fileId, segmentIds, status, enhancedpath } = req.body;

  try {
    const result = await Transcription.findByIdAndUpdate(
      req.params.id,
      { fileId, segmentIds, status, enhancedpath },
      { new: true }
    );

    if (result) {
      res.status(200).json({ message: "Update successful", transcription: result });
    } else {
      res.status(404).json({ message: "Transcription not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Couldn't update transcription!" });
  }
};

exports.deleteTranscription = async (req, res) => {
  try {
    const result = await Transcription.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ message: "Deletion successful!" });
    } else {
      res.status(404).json({ message: "Transcription not found!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Deleting transcription failed!" });
  }
};
