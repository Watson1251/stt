import os
import time
import shutil
import threading
import pyinotify

from utils.logger import AppLogger
from utils.rabbitmq import RabbitMQManager

logger = AppLogger().get_logger()

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'}
STABILITY_WAIT_SECONDS = 3

QUEUE_NAME = os.getenv("STAGING_QUEUE", "staging_queue")
rmq = RabbitMQManager(queue_name=QUEUE_NAME)

class ImageHandlerThread(threading.Thread):
    def __init__(self, path, watch_dir, target_dir):
        super().__init__()
        self.path = path
        self.watch_dir = watch_dir
        self.target_dir = target_dir

    def run(self):
        logger.info(f"Thread started for: {self.path}")
        if not self._is_stable():
            logger.warning(f"File not stable: {self.path}")
            return

        try:
            relative_path = os.path.relpath(self.path, self.watch_dir)
            target_path = os.path.join(self.target_dir, relative_path)
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            shutil.move(self.path, target_path)

            # Check if the directory of the moved file is now empty
            source_dir = os.path.dirname(self.path)
            if source_dir != self.watch_dir and not os.listdir(source_dir):
                try:
                    os.rmdir(source_dir)
                    logger.info(f"Deleted empty directory: {source_dir}")
                except Exception as e:
                    logger.error(f"Failed to delete directory {source_dir}: {e}")

            logger.info(f"Moved image to: {target_path}")
            rmq.publish({
                "path": target_path
            })
            logger.info(f"Message enqueued for: {target_path}")
        except Exception as e:
            logger.error(f"Error processing {self.path}: {e}")

    def _is_stable(self):
        try:
            initial_size = os.path.getsize(self.path)
            time.sleep(STABILITY_WAIT_SECONDS)
            return os.path.getsize(self.path) == initial_size
        except Exception as e:
            logger.error(f"Stability check failed for {self.path}: {e}")
            return False

class EventHandler(pyinotify.ProcessEvent):
    def __init__(self, watch_dir, target_dir):
        self.watch_dir = watch_dir
        self.target_dir = target_dir

    def process_IN_CLOSE_WRITE(self, event):
        if not os.path.isfile(event.pathname):
            return
        if os.path.splitext(event.pathname)[1].lower() not in IMAGE_EXTENSIONS:
            return

        logger.info(f"File closed after writing: {event.pathname}")
        thread = ImageHandlerThread(event.pathname, self.watch_dir, self.target_dir)
        thread.start()

def watch_directory(watch_dir, target_dir):
    wm = pyinotify.WatchManager()
    handler = EventHandler(watch_dir, target_dir)
    notifier = pyinotify.ThreadedNotifier(wm, handler)
    notifier.start()

    mask = pyinotify.IN_CLOSE_WRITE
    wm.add_watch(watch_dir, mask, rec=True, auto_add=True)

    logger.info(f"Watching directory recursively: {watch_dir}")
