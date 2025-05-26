import os
import shutil
import argparse
from multiprocessing import Pool
from utils.logger import AppLogger
from merge_utils import (
    extract_image_id, collect_image_paths, check_for_duplicates,
    copy_image_with_counter, print_colored
)
logger = AppLogger().get_logger()

def check_and_process_image(args):
    src_file, base_dir, dst_dir, rejected_dir, isnumeric = args
    img_name = os.path.basename(src_file)
    img_id, ext = extract_image_id(img_name, isnumeric)

    if not img_id:
        os.makedirs(rejected_dir, exist_ok=True)
        shutil.copy2(src_file, os.path.join(rejected_dir, img_name))
        logger.info(f"[!] Invalid ID: Copied to rejected: {img_name}")
        return

    if check_for_duplicates(src_file, base_dir, img_id):
        os.remove(src_file)
        logger.info(f"[!] DUPLICATE: Deleted {src_file}")
        return

    if check_for_duplicates(src_file, dst_dir, img_id):
        os.remove(src_file)
        logger.info(f"[!] DUPLICATE: Deleted {src_file}")
        return

    copy_image_with_counter(src_file, dst_dir, img_id, ext)

def walk_and_process(src, dst_dir, base_dir="images", rejected_dir=None, isnumeric=True, num_workers=4):
    if rejected_dir is None:
        rejected_dir = os.path.join(os.path.dirname(dst_dir), "rejected")

    if isinstance(src, str):
        image_paths = collect_image_paths(src)
    else:
        image_paths = src  # src is already a list of paths

    args = [(img, base_dir, dst_dir, rejected_dir, isnumeric) for img in image_paths]

    with Pool(processes=num_workers) as pool:
        pool.map(check_and_process_image, args)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Organize new images into structure and reject invalid ones.")
    parser.add_argument("src", help="Source directory")
    parser.add_argument("dst", help="Destination directory")
    parser.add_argument("--base", default="images", help="Base directory for checking duplicates")
    parser.add_argument("--rejected", help="Directory for rejected images")
    parser.add_argument("--workers", type=int, default=4, help="Number of worker processes")
    parser.add_argument("--isnumeric", action="store_true", help="Only accept numeric image IDs (default: False)")

    args = parser.parse_args()
    walk_and_process(args.src, args.dst, args.base, args.rejected, args.isnumeric, args.workers)
