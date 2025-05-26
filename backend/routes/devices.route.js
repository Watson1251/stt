const express = require("express");
const checkAuth = require("../middleware/check-auth");

const DevicesController = require("../controllers/devices.controller");

const router = express.Router();

router.get("/connected", checkAuth, DevicesController.getConnectedDevices);

router.get("/", checkAuth, DevicesController.getDevices);
router.post("/create", checkAuth, DevicesController.createDevice);
router.post("/update", checkAuth, DevicesController.updateDevice);
router.post("/delete", checkAuth, DevicesController.deleteDevice);

module.exports = router;
