import os
import argparse
from multiprocessing import Pool
from merge_utils import (
    extract_image_id, collect_image_paths, copy_image_with_counter,
    print_colored, move_or_copy
)

def check_and_process_image(args):
    src_file, dst_dir, rejected_dir, iscopy, isnumeric = args
    img_name = os.path.basename(src_file)
    img_id, ext = extract_image_id(img_name, isnumeric=isnumeric)

    if not img_id:
        os.makedirs(rejected_dir, exist_ok=True)
        failed_file = os.path.join(rejected_dir, img_name)
        move_or_copy(src_file, failed_file, iscopy)
        return

    copy_image_with_counter(src_file, dst_dir, img_id, ext, iscopy)

def walk_and_process(src_dir, dst_dir, rejected_dir=None, iscopy=False, isnumeric=True, num_workers=4):
    if rejected_dir is None:
        rejected_dir = os.path.join(os.path.dirname(dst_dir), "failed")

    image_paths = collect_image_paths(src_dir)
    args = [(img, dst_dir, rejected_dir, iscopy, isnumeric) for img in image_paths]

    with Pool(processes=num_workers) as pool:
        pool.map(check_and_process_image, args)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge organized images into the base directory.")
    parser.add_argument("src", help="Source directory")
    parser.add_argument("dst", help="Destination directory")
    parser.add_argument("--rejected", help="Directory for rejected images")
    parser.add_argument("--iscopy", action="store_true", help="Use copy instead of move")
    parser.add_argument("--isnumeric", action="store_true", help="Require numeric-only image IDs")
    parser.add_argument("--workers", type=int, default=4, help="Number of worker processes")

    args = parser.parse_args()
    walk_and_process(args.src, args.dst, args.rejected, args.iscopy, args.isnumeric, args.workers)