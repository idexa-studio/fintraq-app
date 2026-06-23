#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND_DIR="$ROOT/assets/brand"
IMAGE_DIR="$ROOT/assets/images"

rsvg-convert "$BRAND_DIR/icon.svg" -w 1024 -h 1024 > "$IMAGE_DIR/icon.png"
rsvg-convert "$BRAND_DIR/adaptive-foreground.svg" -w 1024 -h 1024 > "$IMAGE_DIR/adaptive-icon/foreground.png"
rsvg-convert "$BRAND_DIR/adaptive-background.svg" -w 1024 -h 1024 > "$IMAGE_DIR/adaptive-icon/background.png"
rsvg-convert "$BRAND_DIR/android-monochrome.svg" -w 1024 -h 1024 > "$IMAGE_DIR/android-icon-monochrome.png"
rsvg-convert "$BRAND_DIR/favicon.svg" -w 48 -h 48 > "$IMAGE_DIR/favicon.png"
rsvg-convert "$BRAND_DIR/favicon.svg" -w 144 -h 144 > "$IMAGE_DIR/pwa/chrome-icon/chrome-icon-144.png"
rsvg-convert "$BRAND_DIR/favicon.svg" -w 192 -h 192 > "$IMAGE_DIR/pwa/chrome-icon/chrome-icon-192.png"
rsvg-convert "$BRAND_DIR/icon.svg" -w 512 -h 512 > "$IMAGE_DIR/pwa/chrome-icon/chrome-icon-512.png"
rsvg-convert "$BRAND_DIR/splash-mark.svg" -w 2048 -h 2048 > "$IMAGE_DIR/splash.png"
