// consumers/convert.consumer.js
const rabbitmq = require("../utils/rabbitmq");
const logger = require("../utils/logger");

// Utility function to introduce sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function consumeConvertQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.CONVERT_QUEUE || "convert_queue",
    async (message, msg) => {
      logger.info(`🟢 [convert_queue] Received:`, message);

      const { fileId, filepath } = message;

      // Simulating processing time
      await sleep(5000); // Adjust time as needed

      logger.info(`📦 Convert file ID: ${fileId}, path: ${filepath}`);

      // Manually acknowledge message
      rabbitmq.channel.ack(msg);
    }
  );
}

module.exports = consumeConvertQueue;
