const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const actionSchema = mongoose.Schema({
  action: { type: String, required: true },
  deviceId: { type: String, required: true },
  accountId: { type: String, required: true },
  timestamp: { type: Number, required: true },
  isFinished: { type: Boolean, required: true },
  status: { type: String },
  taskId: { type: String },
  tweetId: { type: String },
  categoryId: { type: String },
  targetTweetId: { type: String },
  mediaUrl: { type: String },
  hashtag: { type: String },
});

actionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Action", actionSchema);
