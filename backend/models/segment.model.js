const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const segmentSchema = mongoose.Schema({
  path: { type: String, required: true },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  status: { type: String, required: true },
  text: { type: String, default: "" },
  suggestions: { type: Array, default: [] },
  editedText: { type: String, default: "" },
}, { timestamps: true });

segmentSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Segment", segmentSchema);