const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const transcriptionSchema = mongoose.Schema({
  fileId: { type: String, required: true },
  segmentIds: { type: [String], default: [] },
  status: { type: String, required: true },
  enhancedpath: { type: String, default: "" },
}, { timestamps: true });

transcriptionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Transcription", transcriptionSchema);