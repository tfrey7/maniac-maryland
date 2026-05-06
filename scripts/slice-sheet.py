#!/usr/bin/env python3
"""Slice a sprite sheet into N frame PNGs and downscale each."""
import sys
from PIL import Image

if len(sys.argv) != 7:
    sys.exit("Usage: slice-sheet.py <sheet-path> <out-prefix> <rows> <cols> <out-w> <out-h>")

sheet_path, out_prefix = sys.argv[1], sys.argv[2]
rows, cols = int(sys.argv[3]), int(sys.argv[4])
out_w, out_h = int(sys.argv[5]), int(sys.argv[6])

sheet = Image.open(sheet_path)
if sheet.mode != "RGBA":
    sheet = sheet.convert("RGBA")

sw, sh = sheet.size
cell_w, cell_h = sw // cols, sh // rows

n = 0
for r in range(rows):
    for c in range(cols):
        n += 1
        left = c * cell_w
        top = r * cell_h
        cell = sheet.crop((left, top, left + cell_w, top + cell_h))
        out_path = f"{out_prefix}-{n}.png"
        cell.resize((out_w, out_h), Image.NEAREST).save(out_path)
        print(f"Saved: {out_path} (cell {cell_w}x{cell_h} -> {out_w}x{out_h})")
