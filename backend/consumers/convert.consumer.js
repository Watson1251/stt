// consumers/convert.consumer.js
const fs = require("fs").promises;
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");
const FileUpload = require("../models/file-upload.model");
const axios = require('axios');

const STT_URL = process.env.STT_ENGINE_URL || "http://localhost:3000";

async function consumeConvertQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.CONVERT_QUEUE || "convert_queue",
    async (message, msg) => {

      const { fileId, filepath } = message;
      logger.info(`📦 Convert file ID: ${fileId}, path: ${filepath}`);

      try {
        const response = await axios.post(STT_URL + "convert", message);

        if (response.data.code === 200) {
          const newPath = response.data.result;
          logger.info(`✅ File ${fileId} conversion request sent successfully. New path: ${newPath}`);

          // Attempt to delete the original file
          try {
            await fs.unlink(filepath);
            logger.info(`🗑️ Deleted original file: ${filepath}`);
          } catch (deleteError) {
            logger.warn(`⚠️ Could not delete file ${filepath}: ${deleteError.message}`);
          }

          // Update the MongoDB document
          await FileUpload.findByIdAndUpdate(fileId, { filepath: newPath });

          logger.info(`🔄 Updated database for file ID ${fileId} with new path`);

          // Publish updated file info to split_queue
          const payload = { fileId, filepath: newPath };
          await rabbitmq.publish(process.env.SPLIT_QUEUE || "split_queue", payload);

          logger.info(`📤 Published to split_queue:`, payload);
        } else {
          logger.error(`❌ Error converting file ${fileId}: ${response.data.message}`);
        }
      } catch (error) {
        logger.error(error.message);
      }

      // Manually acknowledge message
      rabbitmq.channel.ack(msg);
    }
  );
}

module.exports = consumeConvertQueue;
