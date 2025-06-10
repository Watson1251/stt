// consumers/split.consumer.js
const rabbitmq = require("../utils/rabbitmq");

// Utility function to introduce sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function consumeSplitQueue() {
  await rabbitmq.connect();

  await rabbitmq.consume(
    process.env.SPLIT_QUEUE || "split_queue",
    async (message, msg) => {
      console.log(`🟢 [split_queue] Received:`, message);

      const { fileId, filepath } = message;

      // Simulating processing time
      await sleep(5000); // Adjust time as needed

      console.log(`🔊 Split audio file ID: ${fileId}, path: ${filepath}`);

      // Manually acknowledge message
      rabbitmq.channel.ack(msg);
    }
  );
}

module.exports = consumeSplitQueue;
