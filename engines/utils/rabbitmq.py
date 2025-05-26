# utils/rabbitmq.py

import os
import json
import pika
import time
from threading import Thread
from queue import Queue
from typing import List, Dict
from utils.logger import AppLogger

logger = AppLogger().get_logger()

class RabbitMQManager:
    def __init__(self, queue_name, durable=True, auto_ack=False, callback=None):
        self.host = os.getenv("RABBITMQ_URL", "localhost")
        self.port = int(os.getenv("RABBITMQ_PORT", 5672))
        self.user = os.getenv("RABBITMQ_DEFAULT_USER", "admin")
        self.password = os.getenv("RABBITMQ_DEFAULT_PASS", "admin")
        self.queue_name = queue_name
        self.durable = durable
        self.auto_ack = auto_ack
        self.callback = callback

        self.publish_queue = Queue()
        self.ack_queue = Queue()
        self._start_publisher_thread()
        self._start_ack_thread()

    def _connect(self):
        credentials = pika.PlainCredentials(self.user, self.password)
        parameters = pika.ConnectionParameters(
            host=self.host,
            port=self.port,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )

        while True:
            try:
                connection = pika.BlockingConnection(parameters)
                channel = connection.channel()
                channel.queue_declare(queue=self.queue_name, durable=self.durable)
                return connection, channel
            except pika.exceptions.AMQPConnectionError:
                logger.info("Waiting for RabbitMQ to be ready...")
                time.sleep(5)
    
    def is_queue_empty(self) -> bool:
        """
        Checks if the queue has any pending messages. Returns True if empty, False otherwise.
        """
        try:
            credentials = pika.PlainCredentials(self.user, self.password)
            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            queue = channel.queue_declare(queue=self.queue_name, passive=True)
            message_count = queue.method.message_count
            connection.close()
            logger.info(f"[RabbitMQ] Queue '{self.queue_name}' has {message_count} messages")
            return message_count == 0
        except Exception as e:
            logger.exception("[RabbitMQ] Failed to check queue length")
            return False  # Fail safe: assume it's not empty
    
    def drain_messages(self, max_wait=2) -> List[Dict]:
        connection, channel = self._connect()
        messages = []
        start_time = time.time()

        logger.info(f"[RabbitMQ] Draining messages from '{self.queue_name}' for up to {max_wait} seconds...")

        while True:
            method, props, body = channel.basic_get(self.queue_name, auto_ack=False)
            if method is None:
                if time.time() - start_time > max_wait:
                    logger.debug("[RabbitMQ] Max wait reached, no more messages.")
                    break
                else:
                    time.sleep(0.1)  # Short wait before retrying
                    continue

            try:
                logger.debug(f"[RabbitMQ] Raw message: {body}")
                message = json.loads(body)
                message["_delivery_tag"] = method.delivery_tag
                messages.append((message, method.delivery_tag))
            except Exception as e:
                logger.error(f"[RabbitMQ] Failed to decode message: {body}. Error: {e}")
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        connection.close()
        logger.info(f"[RabbitMQ] Drained {len(messages)} message(s) from queue.")
        return messages

    def publish(self, message: dict):
        self.publish_queue.put(message)

    def ack(self, delivery_tag):
        self.ack_queue.put(delivery_tag)

    def _start_publisher_thread(self):
        def publisher_worker():
            connection, channel = self._connect()
            logger.info("Publisher thread started.")
            while True:
                message = self.publish_queue.get()
                if message is None:
                    break  # Stop signal
                try:
                    body = json.dumps(message)
                    channel.basic_publish(
                        exchange='',
                        routing_key=self.queue_name,
                        body=body,
                        properties=pika.BasicProperties(delivery_mode=2 if self.durable else 1)
                    )
                    logger.info(f"Published to {self.queue_name}: {body}")
                except Exception as e:
                    logger.error(f"Failed to publish message: {e}")
                finally:
                    self.publish_queue.task_done()
            connection.close()
            logger.info("Publisher thread stopped.")

        Thread(target=publisher_worker, daemon=True).start()

    def _start_ack_thread(self):
        def ack_worker():
            connection, channel = self._connect()
            logger.info("Ack thread started.")
            while True:
                item = self.ack_queue.get()
                if item is None:
                    break
                try:
                    channel.basic_ack(delivery_tag=item)
                    logger.info(f"Acknowledged message with tag: {item}")
                except Exception as e:
                    logger.error(f"Failed to ack tag {item}: {e}")
                finally:
                    self.ack_queue.task_done()
            connection.close()
            logger.info("Ack thread stopped.")

        Thread(target=ack_worker, daemon=True).start()

    def publish(self, message: dict):
        self.publish_queue.put(message)

    def ack(self, delivery_tag):
        self.ack_queue.put(delivery_tag)

    def consume_with_manual_ack_queue(self, on_message_callback, ack_queue=None):
        connection, channel = self._connect()

        def wrapper(ch, method, properties, body):
            try:
                message = json.loads(body)
                logger.info(f"Received (manual ack queue) from {self.queue_name}: {message}")
                message["_delivery_tag"] = method.delivery_tag
                on_message_callback(message)
            except Exception as e:
                logger.error(f"Error in message handler: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

        channel.basic_qos(prefetch_count=50)
        channel.basic_consume(queue=self.queue_name, on_message_callback=wrapper, auto_ack=False)

        logger.info(f"Consuming (manual ack) from {self.queue_name}...")

        while True:
            connection.process_data_events(time_limit=1)
            if ack_queue:
                while not ack_queue.empty():
                    tag = ack_queue.get()
                    try:
                        channel.basic_ack(delivery_tag=tag)
                        logger.info(f"[RabbitMQ] Acknowledged tag: {tag}")
                    except Exception as e:
                        logger.error(f"[RabbitMQ] Failed to ack tag {tag}: {e}")
                    ack_queue.task_done()
