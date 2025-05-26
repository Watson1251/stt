const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const deviceSchema = mongoose.Schema({
  name: { type: String, required: true },
  serial: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  phone: { type: Number, required: true },
  accounts: { type: [String], required: true },
});

deviceSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Device", deviceSchema);
