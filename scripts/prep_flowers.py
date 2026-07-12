"""
prep_flowers.py — copy the iCloud photos into assets/scenes/flowers/,
fixing EXIF rotation and downsizing them for the web.
"""
import os
import glob
from PIL import Image, ImageOps

SRC_DIR = "iCloudPhotos"
OUT_DIR = os.path.join("assets", "scenes", "flowers")
MAX_SIDE = 1400
QUALITY = 84

os.makedirs(OUT_DIR, exist_ok=True)

files = sorted(glob.glob(os.path.join(SRC_DIR, "*.JPEG")) + glob.glob(os.path.join(SRC_DIR, "*.jpg")))
print("found %d photos" % len(files))

for i, path in enumerate(files, start=1):
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)  # respect the phone's rotation metadata
    img = img.convert("RGB")

    w, h = img.size
    scale = MAX_SIDE / max(w, h)
    if scale < 1:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    out_path = os.path.join(OUT_DIR, "flower-%d.jpg" % i)
    img.save(out_path, "JPEG", quality=QUALITY, optimize=True)
    print("  flower-%-3d <- %-16s %4dx%-4d" % (i, os.path.basename(path), img.width, img.height))

print("done ->", OUT_DIR)
