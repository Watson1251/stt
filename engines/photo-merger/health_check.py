import os
import shutil
import time
import threading
from utils.logger import AppLogger
from utils.rabbitmq import RabbitMQManager
from watcher import IMAGE_EXTENSIONS, STABILITY_WAIT_SECONDS

logger = AppLogger().get_logger()

WATCH_DIR = os.getenv("WATCH_DIR", "/shared")
STAGING_DIR = os.getenv("STAGING_DIR", "/staging")
QUEUE_NAME = os.getenv("STAGING_QUEUE", "staging_queue")

rmq = RabbitMQManager(queue_name=QUEUE_NAME)

def is_image(file_path):
    return os.path.isfile(file_path) and os.path.splitext(file_path)[1].lower() in IMAGE_EXTENSIONS

def is_stable(file_path):
    try:
        size = os.path.getsize(file_path)
        time.sleep(STABILITY_WAIT_SECONDS)
        return size == os.path.getsize(file_path)
    except Exception as e:
        logger.warning(f"[HealthCheck] Stability check failed for {file_path}: {e}")
        return False

def process_watch_file(file_path):
    if not is_image(file_path):
        logger.debug(f"[HealthCheck] Skipping non-image: {file_path}")
        return
    if not is_stable(file_path):
        logger.warning(f"[HealthCheck] Skipping unstable file: {file_path}")
        return
    rel_path = os.path.relpath(file_path, WATCH_DIR)
    target_path = os.path.join(STAGING_DIR, rel_path)
    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        shutil.move(file_path, target_path)
        logger.info(f"[HealthCheck] Moved to staging: {target_path}")
        rmq.publish({"path": target_path})
        logger.info(f"[HealthCheck] Message enqueued for: {target_path}")
    except Exception as e:
        logger.error(f"[HealthCheck] Failed to move/publish {file_path}: {e}")

def scan_watch_dir():
    logger.info(f"[HealthCheck] Scanning watch directory: {WATCH_DIR}")
    threads = []
    for root, _, files in os.walk(WATCH_DIR):
        for name in files:
            file_path = os.path.join(root, name)
            t = threading.Thread(target=process_watch_file, args=(file_path,))
            t.start()
            threads.append(t)
    for t in threads:
        t.join()

def process_staging_file(file_path):
    if not is_image(file_path):
        logger.debug(f"[HealthCheck] Skipping non-image: {file_path}")
        return
    try:
        rmq.publish({"path": file_path})
        logger.info(f"[HealthCheck] Re-published to queue: {file_path}")
    except Exception as e:
        logger.error(f"[HealthCheck] Failed to re-publish {file_path}: {e}")

def scan_staging_dir():
    logger.info(f"[HealthCheck] Scanning staging directory: {STAGING_DIR}")
    threads = []
    for root, _, files in os.walk(STAGING_DIR):
        for name in files:
            file_path = os.path.join(root, name)
            t = threading.Thread(target=process_staging_file, args=(file_path,))
            t.start()
            threads.append(t)
    for t in threads:
        t.join()

def run():
    logger.info("[HealthCheck] Running startup health check")
    scan_watch_dir()
    
    if rmq.is_queue_empty():
        scan_staging_dir()
    else:
        logger.info("[HealthCheck] Skipping staging scan because queue is not empty")

if __name__ == "__main__":
    run()
