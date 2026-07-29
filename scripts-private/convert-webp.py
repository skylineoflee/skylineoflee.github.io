#!/usr/bin/env python3
"""Convert PNG to WebP in source/img and themes/fluid/source/img."""
import os
from pathlib import Path
from PIL import Image

ROOT = Path("E:/MY/skylineoflee.github.io")
TARGETS = [
    ROOT / "source" / "img",
    ROOT / "themes" / "fluid" / "source" / "img",
]

QUALITY = 80
METHOD = 6  # slower but better compression

def convert(png_path: Path) -> tuple[int, int]:
    webp_path = png_path.with_suffix(".webp")
    img = Image.open(png_path)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")
    img.save(webp_path, "WEBP", quality=QUALITY, method=METHOD, lossless=False)
    orig = png_path.stat().st_size
    new = webp_path.stat().st_size
    return orig, new


def main():
    print(f"{'file':<40} {'PNG':>10}  {'WebP':>10}  {'saved':>10}")
    print("-" * 80)
    total_orig = total_new = 0
    for d in TARGETS:
        for png in sorted(d.glob("*.png")):
            orig, new = convert(png)
            saved = (1 - new / orig) * 100
            total_orig += orig
            total_new += new
            print(f"{png.relative_to(ROOT)}".ljust(40), f"{orig/1024:>7.1f}KB", f"{new/1024:>7.1f}KB", f"{saved:>7.1f}%")
    if total_orig:
        print("-" * 80)
        print(f"{'TOTAL':<40} {total_orig/1024:>7.1f}KB {total_new/1024:>7.1f}KB  {(1 - total_new/total_orig)*100:>7.1f}%")


if __name__ == "__main__":
    main()