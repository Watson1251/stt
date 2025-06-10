const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const fileUploadSchema = mongoose.Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  mimetype: { type: String, required: true },
  uploadTime: { type: Number, default: () => Date.now() }, // ← timestamp in ms
  enhancedpath: { type: String, default: "" },
  splitsDir: { type: String, default: "" },
  // uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

fileUploadSchema.plugin(uniqueValidator);

module.exports = mongoose.model("FileUpload", fileUploadSchema);
