// consumers/split.consumer.js
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");
const FileUpload = require("../models/file-upload.model");
const axios = require('axios');

const STT_URL = process.env.STT_ENGINE_URL || "http://localhost:3000";

async function consumeSplitQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.SPLIT_QUEUE || "split_queue",
    async (message, msg) => {

      const { fileId, filepath } = message;
      console.log(`🔊 Split audio file ID: ${fileId}, path: ${filepath}`);

      try {
        const response = await axios.post(STT_URL + "split", message);
        logger.info(`response:`, response.data);

        // if (response.data.code === 200) {
        //   const newPath = response.data.result;
        //   // Update the MongoDB document
        //   await FileUpload.findByIdAndUpdate(fileId, { wavpath: newPath });

        //   logger.info(`🔄 Updated database for file ID ${fileId}`);

        //   // Publish updated file info to split_queue
        //   const payload = { fileId, filepath: newPath };
        //   await rabbitmq.publish(process.env.SPLIT_QUEUE || "split_queue", payload);

        //   logger.info(`📤 Published to split_queue:`, payload);
        // } else {
        //   logger.error(`❌ Error converting file ${fileId}: ${response.data.message}`);
        // }
      } catch (error) {
        logger.error(error.message);
      }


      // Manually acknowledge message
      rabbitmq.channel.ack(msg);
    }
  );
}

module.exports = consumeSplitQueue;
