import os
from flask import Flask, request, jsonify
from organize import walk_and_process as organize_images
from merge import walk_and_process as merge_images
from staging_consumer import start_staging_queue_consumer
from utils.logger import AppLogger
from watcher import watch_directory

# logger setup
logger = AppLogger().get_logger()
logger.info("Starting photo-merger")

# Run health check before anything else
try:
    import health_check
    health_check.run()  # This must be defined as `def run()` in health_check.py
except Exception as e:
    logger.error(f"Health check failed: {e}")

# RabbitMQ setup
WATCH_DIR = os.getenv("WATCH_DIR", "/shared")
STAGING_DIR = os.getenv("STAGING_DIR", "/staging")
watch_directory(WATCH_DIR, STAGING_DIR)

# Start the staging queue consumer
start_staging_queue_consumer()

app = Flask(__name__)

@app.route("/organize", methods=["POST"])
def organize_route():
    data = request.get_json()
    required_keys = ["src", "dst", "base"]
    for key in required_keys:
        if key not in data:
            return jsonify({"error": f"Missing required field: {key}"}), 400

    src = data["src"]
    dst = data["dst"]
    base = data["base"]
    rejected = data.get("rejected")
    workers = int(data.get("workers", 4))
    isnumeric = data.get("isnumeric", True)

    try:
        from organize import walk_and_process
        walk_and_process(src, dst, base_dir=base, rejected_dir=rejected, isnumeric=isnumeric, num_workers=workers)
        return jsonify({"status": "success", "message": "Organize completed."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/merge", methods=["POST"])
def merge_route():
    data = request.get_json()
    required_keys = ["src", "dst"]
    for key in required_keys:
        if key not in data:
            return jsonify({"error": f"Missing required field: {key}"}), 400

    src = data["src"]
    dst = data["dst"]
    rejected = data.get("rejected")
    iscopy = data.get("iscopy", True)
    workers = int(data.get("workers", 4))
    isnumeric = data.get("isnumeric", True)

    try:
        merge_images(src, dst, rejected_dir=rejected, iscopy=iscopy, isnumeric=isnumeric, num_workers=workers)
        return jsonify({"status": "success", "message": "Merge completed."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
