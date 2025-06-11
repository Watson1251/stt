const express = require("express");
const checkAuth = require("../middleware/check-auth");
const TranscriptionController = require("../controllers/transcription.controller");

const router = express.Router();

router.get("/", checkAuth, TranscriptionController.getTranscriptions);
router.get("/:id", checkAuth, TranscriptionController.getTranscription);
router.post("/create", checkAuth, TranscriptionController.createTranscription);
router.put("/:id", checkAuth, TranscriptionController.updateTranscription);
router.delete("/:id", checkAuth, TranscriptionController.deleteTranscription);

module.exports = router;
