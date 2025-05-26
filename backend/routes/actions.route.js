const express = require("express");
const checkAuth = require("../middleware/check-auth");

const ActionsController = require("../controllers/actions.controller");
const uploadMiddleware = require('../middleware/upload-middleware'); // your multer setup

const router = express.Router();
router.get("/screenshot", checkAuth, ActionsController.getScreenshot);

router.post('/upload-media', uploadMiddleware, ActionsController.uploadMedia);

router.get("/", checkAuth, ActionsController.getActions);
router.get("/:id", checkAuth, ActionsController.getAction);
router.post("/send", checkAuth, ActionsController.sendAction);
router.post("/create", checkAuth, ActionsController.createAction);
router.post("/create-many", checkAuth, ActionsController.createActions);
router.post("/update", checkAuth, ActionsController.updateAction);
router.post("/delete", checkAuth, ActionsController.deleteAction);



module.exports = router;
