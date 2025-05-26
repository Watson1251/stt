const express = require("express");
const checkAuth = require("../middleware/check-auth");

const TweetsController = require("../controllers/tweets.controller");

const router = express.Router();

router.get("/", checkAuth, TweetsController.getTweets);
router.post("/create", checkAuth, TweetsController.createTweet);
router.post("/update", checkAuth, TweetsController.updateTweet);
router.post("/delete", checkAuth, TweetsController.deleteTweet);

module.exports = router;
