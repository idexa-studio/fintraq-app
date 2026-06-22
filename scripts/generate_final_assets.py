import os
import subprocess
from PIL import Image

PROJECT_DIR = "/Users/ahmed/Documents/Projects/ReactNative/luno-react-native"
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets", "images")
BRAND_DIR = os.path.join(PROJECT_DIR, "assets", "brand")
TEMP_DIR = os.path.join(PROJECT_DIR, "assets", "temp")

# Color mappings: Blue brand -> Green brand
COLOR_MAP = {
    # Mint gradient (Vibrant/Active elements)
    "#8DBDFF": "#86FFC5",
    "#4F8FFF": "#00CC6A",
    # Deep gradient (Shadow capsule)
    "#234777": "#006633",
    "#163054": "#00331A",
    # Glow / Radial gradient
    "#7CB4FF": "#00CC6A",
    "#71AEFF": "#00CC6A",
    "#1C4F8F": "#004F26",
    # Stroke on ring
    "#EEF5FF": "#EEFFF6",
    # Background slate -> Background forest-slate
    "#101A2B": "#14221B",
    "#0B111C": "#0D1612",
    "#080D16": "#080D0B",
    # Favicon backgrounds
    "#101B2D": "#14231C",
    "#09111B": "#09110F",
    # Adaptive backgrounds
    "#0B121E": "#0D1714",
}

def process_svg(filename):
    svg_path = os.path.join(BRAND_DIR, filename)
    with open(svg_path, 'r') as f:
        content = f.read()
    
    # Replace colors case-insensitively
    for old_color, new_color in COLOR_MAP.items():
        content = content.replace(old_color, new_color)
        content = content.replace(old_color.lower(), new_color.lower())
        content = content.replace(old_color.upper(), new_color.upper())
        
    temp_path = os.path.join(TEMP_DIR, filename)
    with open(temp_path, 'w') as f:
        f.write(content)
    return temp_path

def main():
    print("Generating color-adapted brand assets from original SVGs...")
    os.makedirs(ASSETS_DIR, exist_ok=True)
    os.makedirs(os.path.join(ASSETS_DIR, "adaptive-icon"), exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Render SVGs with correct dimensions using rsvg-convert
    # 1. icon.png (1024x1024)
    print("Processing icon.svg -> icon.png")
    temp_icon = process_svg("icon.svg")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "1024",
        "-h", "1024",
        temp_icon,
        "-o", os.path.join(ASSETS_DIR, "icon.png")
    ], check=True)
    
    # 2. adaptive-icon/foreground.png (1024x1024)
    print("Processing adaptive-foreground.svg -> foreground.png")
    temp_fore = process_svg("adaptive-foreground.svg")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "1024",
        "-h", "1024",
        temp_fore,
        "-o", os.path.join(ASSETS_DIR, "adaptive-icon", "foreground.png")
    ], check=True)
    
    # 3. adaptive-icon/background.png (1024x1024)
    print("Processing adaptive-background.svg -> background.png")
    temp_back = process_svg("adaptive-background.svg")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "1024",
        "-h", "1024",
        temp_back,
        "-o", os.path.join(ASSETS_DIR, "adaptive-icon", "background.png")
    ], check=True)
    
    # 4. android-icon-monochrome.png (1024x1024)
    # The monochrome SVG is already correct (black/transparent), no need to adapt colors, just render
    print("Processing android-monochrome.svg -> android-icon-monochrome.png")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "1024",
        "-h", "1024",
        os.path.join(BRAND_DIR, "android-monochrome.svg"),
        "-o", os.path.join(ASSETS_DIR, "android-icon-monochrome.png")
    ], check=True)
    
    # 5. favicon.png (48x48)
    print("Processing favicon.svg -> favicon.png")
    temp_fav = process_svg("favicon.svg")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "48",
        "-h", "48",
        temp_fav,
        "-o", os.path.join(ASSETS_DIR, "favicon.png")
    ], check=True)
    
    # 6. splash.png (2048x2048 canvas with splash logo centered at 420x420)
    print("Processing splash-mark.svg -> temp_splash_mark.png -> splash.png")
    temp_splash_mark_svg = process_svg("splash-mark.svg")
    temp_splash_mark_png = os.path.join(TEMP_DIR, "splash-mark.png")
    # Render splash mark to 420x420
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "420",
        "-h", "420",
        temp_splash_mark_svg,
        "-o", temp_splash_mark_png
    ], check=True)
    
    # Paste splash mark centered on 2048x2048 transparent background
    splash_mark_img = Image.open(temp_splash_mark_png)
    splash_canvas = Image.new("RGBA", (2048, 2048), (0, 0, 0, 0))
    offset = (2048 - 420) // 2
    splash_canvas.paste(splash_mark_img, (offset, offset), splash_mark_img)
    splash_canvas.save(os.path.join(ASSETS_DIR, "splash.png"), "PNG")
    
    # Clean up temp directory
    print("Cleaning up temp files...")
    for f in os.listdir(TEMP_DIR):
        os.remove(os.path.join(TEMP_DIR, f))
    os.rmdir(TEMP_DIR)
    
    print("All adapted assets generated successfully using SVGs and rsvg-convert!")

if __name__ == "__main__":
    main()
