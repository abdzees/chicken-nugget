"""
slice_bunnies.py — cut individual bunnies out of bunnies.png.

The bunnies are white-filled with coloured (pink/blue) outlines on a white
background, so we can't just key out white. Instead we:
  1. find "ink" pixels (coloured or dark) = the outlines/shading,
  2. morphologically close small gaps and fill each enclosed shape,
  3. label the separate blobs and crop each to a transparent PNG.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "bunnies.png"
OUT_DIR = os.path.join("assets", "bunnies")
MIN_AREA = 4000          # ignore tiny specks (e.g. the "zZ")
CLOSE_ITERS = 6          # seal gaps in hand-drawn outlines
PAD = 12                 # transparent padding around each crop

os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
rgb = np.asarray(img)[:, :, :3].astype(np.int16)
R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

brightness = rgb.max(axis=2)
chroma = rgb.max(axis=2) - rgb.min(axis=2)

# ink = coloured outline OR dark stroke; near-white background/fill -> False
ink = (chroma > 22) | (brightness < 205)

# close gaps, fill the interior, then shrink back to the real outline
closed = ndimage.binary_dilation(ink, iterations=CLOSE_ITERS)
filled = ndimage.binary_fill_holes(closed)
solid = ndimage.binary_erosion(filled, iterations=CLOSE_ITERS)

labels, n = ndimage.label(solid)
slices = ndimage.find_objects(labels)

blobs = []
for i, sl in enumerate(slices, start=1):
    area = int((labels[sl] == i).sum())
    if area < MIN_AREA:
        continue
    ys, xs = sl
    cy = (ys.start + ys.stop) / 2
    cx = (xs.start + xs.stop) / 2
    blobs.append((i, sl, area, cy, cx))

# order top-to-bottom, then left-to-right (stable, readable filenames)
H = rgb.shape[0]
blobs.sort(key=lambda b: (round(b[3] / (H / 2)), b[4]))

print("found %d bunnies (of %d raw components)" % (len(blobs), n))

sources = []
for idx, (lab, sl, area, cy, cx) in enumerate(blobs, start=1):
    mask = labels[sl] == lab

    # smooth the alpha edge a touch for clean anti-aliasing
    alpha = ndimage.gaussian_filter(mask.astype(np.float32), sigma=1.2)
    alpha = np.clip(alpha, 0, 1)

    crop_rgb = np.asarray(img)[sl][:, :, :3]
    out = np.dstack([crop_rgb, (alpha * 255).astype(np.uint8)])

    # pad with transparency so rotation in the rain never clips
    padded = np.zeros((out.shape[0] + PAD * 2, out.shape[1] + PAD * 2, 4), np.uint8)
    padded[PAD:PAD + out.shape[0], PAD:PAD + out.shape[1]] = out

    name = "bunny-%d.png" % idx
    Image.fromarray(padded, "RGBA").save(os.path.join(OUT_DIR, name))
    sources.append("assets/bunnies/" + name)
    print("  %-14s %4dx%-4d  area=%d" % (name, padded.shape[1], padded.shape[0], area))

print("\nSOURCES = [")
for s in sources:
    print('    "%s",' % s)
print("];")
