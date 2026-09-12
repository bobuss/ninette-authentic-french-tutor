#!/usr/bin/env python3
"""One-off migration: extract inline base64 data-URIs in index.html into real image files."""
import re
import base64
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(ROOT, "index.html")
IMG_DIR = os.path.join(ROOT, "images")
os.makedirs(IMG_DIR, exist_ok=True)

EXT_MAP = {"png": "png", "jpeg": "jpg", "webp": "webp"}

with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

pattern = re.compile(r'data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)')

counter = 0
replacements = {}

def repl(match):
    global counter
    whole = match.group(0)
    if whole in replacements:
        return replacements[whole]
    mime, b64data = match.group(1), match.group(2)
    ext = EXT_MAP[mime]
    counter += 1
    filename = f"img-{counter:03d}.{ext}"
    filepath = os.path.join(IMG_DIR, filename)
    with open(filepath, "wb") as imgf:
        imgf.write(base64.b64decode(b64data))
    rel_path = f"images/{filename}"
    replacements[whole] = rel_path
    return rel_path

new_html = pattern.sub(repl, html)

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(new_html)

print(f"Extracted {counter} images into {IMG_DIR}")
print(f"New index.html size: {os.path.getsize(HTML_PATH)} bytes")
