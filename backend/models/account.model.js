const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const accountSchema = mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
});

accountSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Account", accountSchema);
