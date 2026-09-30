#!/bin/sh
# Renders every icon and splash PNG from the SVG sources in assets/brand (needs rsvg-convert).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAND_DIR="$ROOT/assets/brand"
IMAGE_DIR="$ROOT/assets/images"

render() { rsvg-convert "$BRAND_DIR/$1" -w "$3" -h "$3" > "$IMAGE_DIR/$2"; }

# iOS: ink tile (light), plus the iOS 18 dark (transparent) and tinted (grayscale) variants.
render icon.svg icon.png 1024
render icon-dark.svg icon-dark.png 1024
render icon-tinted.svg icon-tinted.png 1024
# Android adaptive icon: mark within the 66% safe zone, same ink tile behind it.
render adaptive-foreground.svg adaptive-icon/foreground.png 1024
render adaptive-background.svg adaptive-icon/background.png 1024
render android-monochrome.svg android-icon-monochrome.png 1024
# Web.
render favicon.svg favicon.png 48
render favicon.svg pwa/chrome-icon/chrome-icon-144.png 144
render favicon.svg pwa/chrome-icon/chrome-icon-192.png 192
render icon.svg pwa/chrome-icon/chrome-icon-512.png 512
# Splash: mark only, on the app's own first-frame background (set in app.json).
render splash-mark.svg splash.png 1024
render splash-mark-dark.svg splash-dark.png 1024
