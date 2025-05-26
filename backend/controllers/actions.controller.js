const axios = require('axios');
const Action = require('../models/action.model');
const Device = require('../models/device.model');
const Account = require('../models/account.model');
const Tweet = require('../models/tweet.model');

const XENGINE_URL = process.env.XENGINE_URL || 'http://localhost:5000/';

const path = require('path');
const fs = require('fs');

const SHARED_FOLDER = '/db/tweet_media/';
const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'video/mp4': 'mp4',
  'video/webm': 'webm'
};

exports.uploadMedia = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'لم يتم تحميل أي ملفات.' });
  }

  const delimiter = '---';
  const uploadedUrls = [];

  try {
    req.files.forEach(file => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      if (!ext) throw new Error('نوع ملف غير مدعوم.');

      const targetDir = path.join(SHARED_FOLDER);
      fs.mkdirSync(targetDir, { recursive: true });

      const finalPath = path.join(targetDir, file.filename);
      fs.renameSync(file.path, finalPath);

      const url = path.join('/db/tweet_media', file.filename).replace(/\\/g, '/');
      uploadedUrls.push(url);
    });

    res.status(201).json({
      message: 'تم رفع الوسائط بنجاح',
      mediaUrl: uploadedUrls.join(delimiter)
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'فشل في رفع الوسائط', error: err.message });
  }
};

// TaskType mapping based on the provided enum
const TaskType = {
  tweet: 1,
  repost: 2,
  reply: 3,
  like: 4
};

exports.getActions = (req, res, next) => {

  const query = Action.find();

  query
    .then(fetched => {
      res.status(200).json({
        message: "Actions fetched successfully!",
        actions: fetched
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.getAction = (req, res, next) => {
  Action.findById(req.params.id)
    .then(action => {
      if (action) {
        res.status(200).json(action);
      } else {
        res.status(404).json({ message: "Action not found!" });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({
        message: "Fetching action failed!"
      });
    });
};

exports.getScreenshot = async (req, res) => {
  const { task_id, stage_name } = req.query;

  if (!task_id || !stage_name) {
    return res.status(400).json({
      message: "Missing task_id or stage_name"
    });
  }

  try {
    const response = await axios.get(`${XENGINE_URL}/tasks/device_screenshots`, {
      params: {
        task_id,
        stage_name
      },
      responseType: 'stream', // so we can stream image back
    });

    console.log("Engine Response:", response.data);

    // Forward content type and stream back to frontend
    res.setHeader("Content-Type", "image/png");
    response.data.pipe(res);

  } catch (error) {
    console.error("Error forwarding request to engine:", error.message);

    res.status(500).json({
      message: "Failed to fetch screenshot from engine",
      error: error.message
    });
  }
};

exports.sendAction = async (req, res, next) => {
  console.log("Received Request:", req.body);

  try {
    const response = await axios.post(`${XENGINE_URL}/tasks/tweet`, req.body, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("Engine Response:", response.data);
    res.json(response.data); // Forward the response back to the frontend
  } catch (error) {
    console.error("Error forwarding request to engine:", error.message);
    res.status(500).json({
      message: "Failed to send action to engine",
      error: error.message
    });
  }
};

exports.createActions = async (req, res, next) => {
  try {
    // Validate request body
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    // Insert actions into the database
    const createdData = await Action.insertMany(req.body.map(action => ({
      action: action.action,
      deviceId: action.deviceId, // This is MongoDB _id
      accountId: action.accountId,
      timestamp: action.timestamp,
      isFinished: false,
      status: action.status,
      taskId: action.taskId,
      categoryId: action.categoryId,
      tweetId: action.tweetId,
      targetTweetId: action.targetTweetId,
      mediaUrl: action.mediaUrl,
      hashtag: action.hashtag,
    })));

    // Get unique IDs for batch fetching
    const deviceIds = [...new Set(createdData.map(action => action.deviceId))];
    const accountIds = [...new Set(createdData.map(action => action.accountId))];
    const tweetIds = [...new Set(createdData.map(action => action.tweetId).filter(id => id))];

    // Fetch all required data in a **single query per model**
    const devices = await Device.find({ _id: { $in: deviceIds } }).lean();
    const accounts = await Account.find({ _id: { $in: accountIds } }).lean();
    const tweets = await Tweet.find({ _id: { $in: tweetIds } }).lean();

    // Create mapping for quick lookup
    const deviceMap = new Map(devices.map(device => [device._id.toString(), { deviceId: device._id.toString(), serial: device.serial, devicePin: parseInt(device.pin) }]));
    const accountMap = new Map(accounts.map(account => [account._id.toString(), { username: account.username }]));
    const tweetMap = new Map(tweets.map(tweet => [tweet._id.toString(), { tweet: tweet.tweet }]));

    // Construct request body for the engine
    const deviceActions = new Map();

    for (const action of createdData) {
      const deviceData = deviceMap.get(action.deviceId);
      const accountData = accountMap.get(action.accountId);
      const tweetData = tweetMap.get(action.tweetId);

      if (!deviceData) continue; // Skip if device is missing

      const tweetPayload = {
        username: accountData ? accountData.username : "Unknown",
        tweet: tweetData ? tweetData.tweet : null,
        task_type: TaskType[action.action] || 0, // Default to 0 if action is unrecognized
        hashtag: action.hashtag || null,
        image_url: action.mediaUrl || null,
        tweet_id: action.targetTweetId || null // Use targetTweetId for retweet/reply/like
      };

      if (!deviceActions.has(deviceData.serial)) {
        deviceActions.set(deviceData.serial, {
          device_id: deviceData.serial, // Use serial instead of _id
          device_pin: deviceData.devicePin,
          tweets: []
        });
      }

      deviceActions.get(deviceData.serial).tweets.push(tweetPayload);
    }

    const engineRequestBody = { devices: Array.from(deviceActions.values()) };

    // Send request to the engine
    const response = await axios.post(`${XENGINE_URL}/tasks/tweet`, engineRequestBody, {
      headers: { "Content-Type": "application/json" }
    });

    // Validate engine response and update actions
    if (response.data.statuses && Array.isArray(response.data.statuses)) {
      const updateOperations = response.data.statuses.map(({ device, status, task_id }) => {
        const deviceSerial = device.device_id;
        const matchingDevice = devices.find(d => d.serial === deviceSerial);

        if (!matchingDevice) return null;

        return {
          updateMany: {
            filter: { deviceId: matchingDevice._id.toString(), isFinished: false },
            update: { $set: { status, taskId: task_id } }
          }
        };
      }).filter(op => op !== null);

      if (updateOperations.length > 0) {
        await Action.bulkWrite(updateOperations);
      }
    }

    // Fetch updated actions from the database
    const updatedActions = await Action.find({ deviceId: { $in: deviceIds }, isFinished: false });

    // Respond to frontend
    res.status(201).json({
      message: "Actions added successfully",
      actions: updatedActions.map(item => ({
        ...item.toObject(),
        id: item._id
      })),
      engineResponse: response.data // Optional: Include engine response in frontend response
    });

  } catch (error) {
    console.error("Error processing actions:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.createAction = (req, res, next) => {

  const action = new Action({
    action: req.body.action,
    deviceId: req.body.deviceId,
    accountId: req.body.accountId,
    timestamp: req.body.timestamp,
    isFinished: false,
    status: req.body.status,
    taskId: req.body.taskId,
    categoryId: req.body.categoryId,
    tweetId: req.body.tweetId,
    targetTweetId: req.body.targetTweetId,
    mediaUrl: req.body.mediaUrl,
    hashtag: req.body.hashtag,
  });

  // action
  //   .save()
  //   .then(async createdData => {
  //     res.status(201).json({
  //       message: "Action added successfully",
  //       action: {
  //         ...createdData,
  //         id: createdData._id
  //       }
  //     });
  //   })
  //   .catch(error => {
  //     console.error(error.message);
  //     res.status(500).json({
  //       message: error.message
  //     });
  //   });

};

exports.updateAction = (req, res, next) => {

  const action = new Action({
    _id: req.body.id,
    action: req.body.action,
    deviceId: req.body.deviceId,
    accountId: req.body.accountId,
    timestamp: req.body.timestamp,
    isFinished: false,
    status: req.body.status,
    taskId: req.body.taskId,
    categoryId: req.body.categoryId,
    tweetId: req.body.tweetId,
    targetTweetId: req.body.targetTweetId,
    mediaUrl: req.body.mediaUrl,
    hashtag: req.body.hashtag,
  });

  Action.updateOne({ _id: action._id }, action)
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

exports.deleteAction = (req, res, next) => {

  Action.deleteOne({ _id: req.body.id })
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
