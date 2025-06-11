const fs = require("fs").promises;
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");
const FileUpload = require("../models/file-upload.model");
const axios = require("axios");

const STT_URL = process.env.STT_ENGINE_URL || "http://localhost:3000";

async function consumeConvertQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.CONVERT_QUEUE || "convert_queue",
    async (message, msg) => {
      const { fileId, filepath, transcriptionId } = message;
      logger.info(`📦 Convert file ID: ${fileId}, path: ${filepath}, transcription: ${transcriptionId}`);

      try {
        const response = await axios.post(`${STT_URL}/convert`, message);

        if (response.data.code === 200) {
          const newPath = response.data.result;
          logger.info(`✅ File ${fileId} converted. New path: ${newPath}`);

          try {
            await fs.unlink(filepath);
            logger.info(`🗑️ Deleted original file: ${filepath}`);
          } catch (deleteError) {
            logger.warn(`⚠️ Could not delete file ${filepath}: ${deleteError.message}`);
          }

          await FileUpload.findByIdAndUpdate(fileId, { filepath: newPath });
          logger.info(`🔄 DB updated for file ID ${fileId} with new path`);

          const payload = { fileId, filepath: newPath, transcriptionId };
          await rabbitmq.publish(process.env.SPLIT_QUEUE || "split_queue", payload);
          logger.info(`📤 Published to split_queue:`, payload);

        } else {
          logger.error(`❌ Conversion error for file ${fileId}: ${response.data.message}`);
        }

      } catch (error) {
        logger.error(`❌ Exception during convert for ${fileId}: ${error.message}`);
      } finally {
        try {
          if (msg) rabbitmq.channel.ack(msg);
        } catch (ackError) {
          logger.error(`❌ Failed to ack convert message: ${ackError.message}`);
        }
      }
    }
  );
}

module.exports = consumeConvertQueue;
