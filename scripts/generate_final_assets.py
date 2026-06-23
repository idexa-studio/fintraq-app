import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

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

def create_radial_glow(width, height, bg_color, glow_color, radius_ratio=0.5, intensity=0.75):
    """Generates a smooth radial gradient/glow at the center of the canvas."""
    mask_size = 256
    mask = Image.new("L", (mask_size, mask_size))
    center = mask_size / 2.0
    max_dist = center * radius_ratio * 2.0
    
    pixels = mask.load()
    for y in range(mask_size):
        for x in range(mask_size):
            dx = x - center
            dy = y - center
            dist = (dx*dx + dy*dy)**0.5
            if dist < max_dist:
                factor = (1.0 - dist / max_dist)
                val = int(255 * (factor * factor) * intensity)
                pixels[x, y] = val
            else:
                pixels[x, y] = 0
                
    try:
        resampling = Image.Resampling.LANCZOS
    except AttributeError:
        resampling = Image.LANCZOS
        
    large_mask = mask.resize((width, height), resampling)
    bg_img = Image.new("RGB", (width, height), bg_color)
    glow_img = Image.new("RGB", (width, height), glow_color)
    
    return Image.composite(glow_img, bg_img, large_mask)

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
    
    # 6. splash.png (2048x2048 canvas with splash logo centered at 640x640 and typography)
    print("Processing splash-mark.svg -> temp_splash_mark.png -> splash.png")
    temp_splash_mark_svg = process_svg("splash-mark.svg")
    temp_splash_mark_png = os.path.join(TEMP_DIR, "splash-mark.png")
    # Render splash mark to 640x640 (larger to reduce padding)
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "640",
        "-h", "640",
        temp_splash_mark_svg,
        "-o", temp_splash_mark_png
    ], check=True)
    
    # Generate background with beautiful ambient radial glow (slightly wider radius)
    splash_canvas = create_radial_glow(
        2048, 2048, 
        bg_color=(20, 20, 18), 
        glow_color=(0, 61, 32), 
        radius_ratio=0.65, 
        intensity=0.75
    ).convert("RGBA")
    
    # Paste splash mark centered (shifted up by 120px to balance with typography below)
    splash_mark_img = Image.open(temp_splash_mark_png)
    logo_w, logo_h = 640, 640
    offset_x = (2048 - logo_w) // 2
    offset_y = (2048 - logo_h) // 2 - 120
    splash_canvas.paste(splash_mark_img, (offset_x, offset_y), splash_mark_img)
    
    # Draw typography (larger font to scale with the logo)
    draw = ImageDraw.Draw(splash_canvas)
    font_path = os.path.join(PROJECT_DIR, "assets", "fonts", "MuseoModerno", "MuseoModerno-Bold.ttf")
    font_size = 130
    
    try:
        font = ImageFont.truetype(font_path, font_size)
    except IOError:
        font = ImageFont.load_default()
        print("Warning: MuseoModerno-Bold.ttf not found, using default font.")
        
    text_main = "Fintraq"
    text_dot = "."
    
    # Calculate bounding boxes
    try:
        left_main, top_main, right_main, bottom_main = draw.textbbox((0, 0), text_main, font=font)
        w_main = right_main - left_main
        left_dot, top_dot, right_dot, bottom_dot = draw.textbbox((0, 0), text_dot, font=font)
        w_dot = right_dot - left_dot
    except AttributeError:
        w_main, _ = draw.textsize(text_main, font=font)
        w_dot, _ = draw.textsize(text_dot, font=font)
        
    text_w = w_main + w_dot
    start_x = (2048 - text_w) // 2
    text_y = 1380
    
    # Draw main text in off-white (#E8E7E1) and trailing dot in emerald (#00CC6A)
    draw.text((start_x, text_y), text_main, font=font, fill=(232, 231, 225, 255))
    draw.text((start_x + w_main, text_y), text_dot, font=font, fill=(0, 204, 106, 255))
    
    # Save splash screen
    splash_canvas.save(os.path.join(ASSETS_DIR, "splash.png"), "PNG")
    
    # Clean up temp directory
    print("Cleaning up temp files...")
    for f in os.listdir(TEMP_DIR):
        os.remove(os.path.join(TEMP_DIR, f))
    os.rmdir(TEMP_DIR)
    
    print("All adapted assets generated successfully using SVGs and rsvg-convert!")

if __name__ == "__main__":
    main()
