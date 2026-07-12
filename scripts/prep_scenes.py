"""
prep_scenes.py — normalize the gift/section artwork into clean cutouts:
  * remove only the OUTER white background (flood-fill from the borders)
    so the cat's white body stays opaque and visible on any background,
  * auto-trim to the drawing's bounding box,
  * save transparent PNGs into assets/scenes/.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

OUT = os.path.join("assets", "scenes")
os.makedirs(OUT, exist_ok=True)

SRC = {
    "cookie": "cookie.jpg",
    "firework": "firework.jpg",
    "blueflower": "blueflower.jpg",
    "letter": "letter.png",
    "mainhub": "mainhub.jpg",
}

WHITE = 200        # min-channel below this = "ink" (outline / colour)
CLOSE = 9          # seal gaps in the open outline
PAD = 12

for name, path in SRC.items():
    img = Image.open(path).convert("RGBA")
    # pad with white so the subject never touches the frame (avoids
    # corner "pockets" getting filled on tight crops like the firework)
    pad0 = 44
    base = Image.new("RGBA", (img.width + 2 * pad0, img.height + 2 * pad0), (255, 255, 255, 255))
    base.paste(img, (pad0, pad0))
    img = base

    arr = np.asarray(img).astype(np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    m = rgb.min(axis=2)

    ink = m < WHITE
    # seal the outline, fill the enclosed body, shrink back to the true shape
    closed = ndimage.binary_dilation(ink, iterations=CLOSE)
    filled = ndimage.binary_fill_holes(closed)
    solid = ndimage.binary_erosion(filled, iterations=CLOSE)

    alpha = ndimage.gaussian_filter(np.where(solid, 255.0, 0.0), 0.8)
    alpha = np.clip(alpha, 0, 255)
    alpha = np.minimum(alpha, arr[:, :, 3]).astype(np.uint8)

    out = arr.copy()
    out[:, :, 3] = alpha

    ys, xs = np.where(alpha > 12)
    if len(ys):
        y0, y1 = max(0, ys.min() - PAD), min(out.shape[0], ys.max() + PAD)
        x0, x1 = max(0, xs.min() - PAD), min(out.shape[1], xs.max() + PAD)
        out = out[y0:y1, x0:x1]

    Image.fromarray(out, "RGBA").save(os.path.join(OUT, name + ".png"))
    print("%-12s %4dx%-4d" % (name, out.shape[1], out.shape[0]))

print("done ->", OUT)
