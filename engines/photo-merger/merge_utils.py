import os
import hashlib
import shutil
from multiprocessing import Pool

RESET = '\033[0m'
COLORS = {
    'red': '\033[31m',
    'green': '\033[32m',
    'yellow': '\033[33m',
    'blue': '\033[34m',
    'reset': RESET
}

def print_colored(text, color='reset'):
    color_code = COLORS.get(color.lower(), RESET)
    print(f"{color_code}{text}{RESET}")

def hash_file(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def extract_image_id(image_name, isnumeric=True):
    img_id, ext = os.path.splitext(image_name)
    img_id = img_id.split(',')[0].split('_')[0]
    
    if isnumeric and not img_id.isdigit():
        return None, ext
    
    if isnumeric:
        img_id = img_id.zfill(8)

    return img_id, ext

def get_images_given_id(directory, img_id):
    return sorted([f for f in os.listdir(directory) if img_id in f])

def get_max_counter(images):
    counters = [int(os.path.splitext(f.split('_')[1])[0]) for f in images if '_' in f]
    return max(counters) if counters else 0

def find_next_available_filename(dst_dir, images, img_id, ext):
    max_counter = get_max_counter(images)
    dst_file = os.path.join(dst_dir, f"{img_id}_{max_counter + 1}{ext}")
    return dst_file if not os.path.exists(dst_file) else find_next_available_filename(dst_dir, images, img_id, ext)

def check_for_duplicates(src_file, target_dir, img_id):
    first_subdir, second_subdir = img_id[:3], img_id[3:6]
    target_check_dir = os.path.join(target_dir, first_subdir, second_subdir)
    if not os.path.exists(target_check_dir):
        return False
    images = get_images_given_id(target_check_dir, img_id)
    if not images:
        return False
    src_hash = hash_file(src_file)
    return any(hash_file(os.path.join(target_check_dir, f)) == src_hash for f in images)

def move_or_copy(src_file, dst_file, iscopy):
    if iscopy:
        shutil.copy2(src_file, dst_file)
    else:
        shutil.move(src_file, dst_file)
    print_colored(f"[+] {'Copied' if iscopy else 'Moved'} {src_file} -> {dst_file}", "green")

def copy_image_with_counter(src_file, dst_root, img_id, ext, iscopy=True):
    first_subdir, second_subdir = img_id[:3], img_id[3:6]
    dst_dir = os.path.join(dst_root, first_subdir, second_subdir)
    os.makedirs(dst_dir, exist_ok=True)
    images = get_images_given_id(dst_dir, img_id)
    dst_file = os.path.join(dst_dir, f"{img_id}{ext}")
    if images:
        dst_file = find_next_available_filename(dst_dir, images, img_id, ext)
    move_or_copy(src_file, dst_file, iscopy)

def collect_image_paths(src_dir):
    print_colored(f"[~] Collecting images from {src_dir}", "yellow")
    valid_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'}
    paths = [os.path.join(r, f) for r, _, files in os.walk(src_dir) for f in files if os.path.splitext(f)[1].lower() in valid_exts]
    print_colored(f"[~] Collected {len(paths)} images.", "yellow")
    return sorted(paths)
