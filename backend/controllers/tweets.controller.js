const Tweet = require("../models/tweet.model");

exports.getTweets = (req, res, next) => {

  const query = Tweet.find();

  query
    .then(fetched => {
      res.status(200).json({
        message: "Tweets fetched successfully!",
        tweets: fetched
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.createTweet = (req, res, next) => {

  const tweet = new Tweet({
    tweet: req.body.tweet,
    categoryId: req.body.categoryId,
    isConsumed: req.body.isConsumed,
  });

  tweet
    .save()
    .then(createdData => {
      res.status(201).json({
        message: "Tweet added successfully",
        tweet: {
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

exports.updateTweet = (req, res, next) => {

  const tweet = new Tweet({
    _id: req.body.id,
    tweet: req.body.tweet,
    categoryId: req.body.categoryId,
    isConsumed: req.body.isConsumed,
  });

  Tweet.updateOne({ _id: tweet._id }, tweet)
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

exports.deleteTweet = (req, res, next) => {

  Tweet.deleteOne({ _id: req.body.id })
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
