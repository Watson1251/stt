# staging_consumer.py

import os
import time
import threading
from utils.logger import AppLogger
from utils.rabbitmq import RabbitMQManager
from queue import Queue
from health_check import run as run_health_check

logger = AppLogger().get_logger()

STAGING_QUEUE = os.getenv("STAGING_QUEUE", "staging_queue")
HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", 60))

ack_queue = Queue()
rmq = RabbitMQManager(queue_name=STAGING_QUEUE)

def handle_batch(messages):
    logger.info(f"[StagingQueue] Processing batch of {len(messages)} messages")

    grouped = {}
    for msg, tag in messages:
        image_path = msg.get("path")
        if not image_path:
            logger.warning(f"[StagingQueue] Skipping message with no path: {msg}")
            continue
        parent_dir = os.path.basename(os.path.dirname(image_path))
        msg["_delivery_tag"] = tag
        grouped.setdefault(parent_dir, []).append(msg)

    def process_group(group_name, group_messages):
        logger.info(f"[StagingQueue] Processing group '{group_name}' with {len(group_messages)} images")
        paths = [msg["path"] for msg in group_messages]

        try:
            from organize import walk_and_process
            base_dir = os.path.join(os.getenv("BASE_DIR", "/images"), group_name)
            dst_dir = os.path.join(os.getenv("ORGANIZED_DIR", "/organized"), group_name)
            rejected_dir = os.path.join(os.path.dirname(dst_dir), "rejected")
            walk_and_process(paths, dst_dir, base_dir=base_dir, rejected_dir=rejected_dir,
                             isnumeric=True, num_workers=4)
            for msg in group_messages:
                rmq.ack(msg["_delivery_tag"])
        except Exception as e:
            logger.error(f"[StagingQueue] Error processing group '{group_name}': {e}")

    threads = []
    for group_name, group_msg_list in grouped.items():
        t = threading.Thread(target=process_group, args=(group_name, group_msg_list))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

def start_staging_queue_consumer():
    def loop():
        last_health_check = time.time()
        idle_counter = 0

        while True:
            logger.debug("[StagingQueue] Top of loop")

            if not rmq.is_queue_empty():
                logger.debug("[StagingQueue] Queue is NOT empty")
                messages = rmq.drain_messages()
                logger.debug(f"[StagingQueue] drain_messages() returned {len(messages)} messages")
                if messages:
                    idle_counter = 0
                    handle_batch(messages)
                else:
                    logger.warning("[StagingQueue] Queue has messages but none could be drained!")
            else:
                logger.debug("[StagingQueue] Queue is empty")

            if time.time() - last_health_check > HEALTH_CHECK_INTERVAL:
                logger.info("[StagingQueue] Periodic health check triggered")
                run_health_check()
                last_health_check = time.time()

            idle_counter += 1
            if idle_counter % 60 == 0:
                logger.info("[StagingQueue] Still looping every second (idle)...")

            time.sleep(1)

    threading.Thread(target=loop, daemon=True).start()

