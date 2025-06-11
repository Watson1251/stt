const express = require("express");
const checkAuth = require("../middleware/check-auth");
const SegmentController = require("../controllers/segment.controller");

const router = express.Router();

router.get("/", checkAuth, SegmentController.getSegments);
router.get("/:id", checkAuth, SegmentController.getSegment);
router.post("/create", checkAuth, SegmentController.createSegment);
router.put("/:id", checkAuth, SegmentController.updateSegment);
router.delete("/:id", checkAuth, SegmentController.deleteSegment);

module.exports = router;
