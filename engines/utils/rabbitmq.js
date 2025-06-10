// utils/rabbitmq.js
const amqp = require("amqplib");
const logger = require("./logger");

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connectionString = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_URL}:${process.env.RABBITMQ_PORT}`;
  }

  async connect() {
    if (this.connection && this.channel) return;
    this.connection = await amqp.connect(this.connectionString);
    this.channel = await this.connection.createChannel();

    // Ensuring only one message is processed at a time
    this.channel.prefetch(1);

    logger.info("🟢 Connected to RabbitMQ with prefetch 1");
  }

  async publish(queue, message) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async consume(queue, callback) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.consume(queue, (msg) => {
      if (msg !== null) {
        callback(JSON.parse(msg.content.toString()), msg); // Pass the raw msg as well
      }
    });
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
  }
}

module.exports = new RabbitMQ(); // 👈 Singleton instance
