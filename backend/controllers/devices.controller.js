const Device = require("../models/device.model");
const axios = require('axios');

const XENGINE_URL = process.env.XENGINE_URL || 'http://localhost:5000/';

exports.getConnectedDevices = async (req, res, next) => {
  try {
    const response = await axios.get(XENGINE_URL + "/devices/connected_devices");

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getDevices = (req, res, next) => {

  const query = Device.find();

  query
    .then(fetched => {
      res.status(200).json({
        message: "Devices fetched successfully!",
        devices: fetched
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.createDevice = (req, res, next) => {

  const device = new Device({
    name: req.body.name,
    serial: req.body.serial,
    pin: req.body.pin,
    phone: req.body.phone,
    accounts: req.body.accounts
  });

  device
    .save()
    .then(createdData => {
      res.status(201).json({
        message: "Device added successfully",
        device: {
          ...createdData,
          id: createdData._id
        }
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.updateDevice = (req, res, next) => {

  const device = new Device({
    _id: req.body.id,
    name: req.body.name,
    serial: req.body.serial,
    pin: req.body.pin,
    phone: req.body.phone,
    accounts: req.body.accounts
  });

  Device.updateOne({ _id: device._id }, device)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Update failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
};

exports.deleteDevice = (req, res, next) => {

  Device.deleteOne({ _id: req.body.id })
    .then(result => {

      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Deletion failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
};
