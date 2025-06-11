// consumers/split.consumer.js
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");
const Transcription = require("../models/transcription.model");
const Segment = require("../models/segment.model");
const axios = require('axios');

const STT_URL = process.env.STT_ENGINE_URL || "http://localhost:3000";

async function consumeSplitQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.SPLIT_QUEUE || "split_queue",
    async (message, msg) => {

      const { fileId, filepath, transcriptionId } = message;
      console.log(`🔊 Split audio file ID: ${fileId}, path: ${filepath}, transcription: ${transcriptionId}`);

      try {
        const response = await axios.post(STT_URL + "split", message);
        logger.info(`response:`, response.data);

        if (response.data.code === 200) {
          const chunks = response.data.result;

          // Log chunks
          chunks.forEach((chunk, index) => {
            logger.info(`🔄 Chunk ${index + 1}: ${JSON.stringify(chunk, null, 2)}`);
          });

          // Create segments from chunks
          const insertedSegments = await Segment.insertMany(
            chunks.map(chunk => ({
              path: chunk.path,
              start: chunk.start,
              end: chunk.end,
              status: 'pending',
              text: '',
              suggestions: [],
              editedText: '',
            }))
          );

          // Extract segment IDs
          const segmentIds = insertedSegments.map(seg => seg._id.toString());

          // Update transcription
          const updated = await Transcription.findByIdAndUpdate(
            transcriptionId,
            {
              $set: {
                segmentIds,
                status: 'segmented',
              },
            },
            { new: true }
          );

          if (updated) {
            logger.info(`✅ Transcription ${transcriptionId} updated with ${segmentIds.length} segments.`);
          } else {
            logger.warn(`⚠️ Transcription ${transcriptionId} not found for update.`);
          }
        }
      } catch (error) {
        logger.error(`❌ Error processing message: ${error.message}`);
      }

      // Manually acknowledge message
      rabbitmq.channel.ack(msg);
    }
  );
}

module.exports = consumeSplitQueue;
