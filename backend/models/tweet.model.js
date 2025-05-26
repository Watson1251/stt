const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const tweetSchema = mongoose.Schema({
  tweet: { type: String, required: true },
  categoryId: { type: String, required: true },
  isConsumed: { type: Boolean, required: true },
});

tweetSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Tweet", tweetSchema);
