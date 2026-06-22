import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageChops

PROJECT_DIR = "/Users/ahmed/Documents/Projects/ReactNative/luno-react-native"
IN_DIR = os.path.join(PROJECT_DIR, "assets", "brand", "screenshots", "in")
OUT_DIR = os.path.join(PROJECT_DIR, "assets", "brand", "screenshots", "out")
FONT_BOLD_PATH = os.path.join(PROJECT_DIR, "assets", "fonts", "MuseoModerno", "MuseoModerno-Bold.ttf")
FONT_REGULAR_PATH = os.path.join(PROJECT_DIR, "assets", "fonts", "MuseoModerno", "MuseoModerno-Medium.ttf")

os.makedirs(OUT_DIR, exist_ok=True)

TEMP_DIR = os.path.join(PROJECT_DIR, "assets", "temp")
BRAND_DIR = os.path.join(PROJECT_DIR, "assets", "brand")

COLOR_MAP = {
    "#8DBDFF": "#86FFC5",
    "#4F8FFF": "#00CC6A",
    "#234777": "#006633",
    "#163054": "#00331A",
    "#7CB4FF": "#00CC6A",
    "#71AEFF": "#00CC6A",
    "#1C4F8F": "#004F26",
    "#EEF5FF": "#EEFFF6",
}

def process_svg(filename):
    """Processes brand SVGs on the fly, mapping color palette to the green emerald theme."""
    os.makedirs(TEMP_DIR, exist_ok=True)
    svg_path = os.path.join(BRAND_DIR, filename)
    with open(svg_path, 'r') as f:
        content = f.read()
    for old_color, new_color in COLOR_MAP.items():
        content = content.replace(old_color, new_color)
        content = content.replace(old_color.lower(), new_color.lower())
        content = content.replace(old_color.upper(), new_color.upper())
    temp_path = os.path.join(TEMP_DIR, filename)
    with open(temp_path, 'w') as f:
        f.write(content)
    return temp_path

# Continuous wave control points across the wide 5400x1920 canvas
WAVE_POINTS = [
    (0, 1220),
    (540, 1140),
    (1080, 1020),
    (1620, 920),
    (2160, 1120),
    (2700, 1260),
    (3240, 1080),
    (3780, 960),
    (4320, 1160),
    (4860, 1220),
    (5400, 1120)
]

def get_wave_y(x):
    """Calculates the smooth interpolated Y coordinate at horizontal position X."""
    for i in range(len(WAVE_POINTS) - 1):
        x1, y1 = WAVE_POINTS[i]
        x2, y2 = WAVE_POINTS[i+1]
        if x1 <= x <= x2:
            mu = (x - x1) / (x2 - x1)
            mu2 = (1 - math.cos(mu * math.pi)) / 2
            return y1 * (1 - mu2) + y2 * mu2
    return WAVE_POINTS[-1][1]

def create_radial_glow_mask(width, height, radius_ratio=0.6, intensity=0.45):
    """Generates a soft, subtle radial gradient mask."""
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
        
    return mask.resize((width, height), resampling)

def create_device_mockup(screenshot_path, rotation=0, scale=1.0):
    """Frames a screenshot inside a premium, modern smartphone mockup."""
    base_w, base_h = 540, 1170
    screen_w = int(base_w * scale)
    screen_h = int(base_h * scale)
    bezel = int(12 * scale)
    
    frame_w = screen_w + 2 * bezel
    frame_h = screen_h + 2 * bezel
    
    mockup = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(mockup)
    
    # Outer frame shell (dark slate)
    draw.rounded_rectangle(
        [(0, 0), (frame_w, frame_h)], 
        radius=int(50 * scale), 
        fill=(28, 28, 26, 255), 
        outline=(58, 58, 53, 255), 
        width=int(2 * scale)
    )
    
    # Screen inner outline
    draw.rounded_rectangle(
        [(bezel - 1, bezel - 1), (frame_w - bezel + 1, frame_h - bezel + 1)], 
        radius=int(40 * scale), 
        outline=(10, 10, 10, 255), 
        width=int(2 * scale)
    )
    
    if not os.path.exists(screenshot_path):
        print(f"Error: Screenshot path not found: {screenshot_path}")
        return None
        
    screenshot = Image.open(screenshot_path).convert("RGBA")
    screenshot_resized = screenshot.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    # Apply rounded corners to screen
    screen_mask = Image.new("L", (screen_w, screen_h), 0)
    mask_draw = ImageDraw.Draw(screen_mask)
    mask_draw.rounded_rectangle(
        [(0, 0), (screen_w, screen_h)], 
        radius=int(38 * scale), 
        fill=255
    )
    
    mockup.paste(screenshot_resized, (bezel, bezel), screen_mask)
    
    # Draw notch/dynamic island
    island_w = int(130 * scale)
    island_h = int(32 * scale)
    island_x = (frame_w - island_w) // 2
    island_y = bezel + int(15 * scale)
    draw.rounded_rectangle(
        [(island_x, island_y), (island_x + island_w, island_y + island_h)],
        radius=int(16 * scale),
        fill=(10, 10, 10, 255)
    )
    
    # Rotate using Bicubic interpolation
    if rotation != 0:
        try:
            resampling = Image.Resampling.BICUBIC
        except AttributeError:
            resampling = Image.BICUBIC
        mockup = mockup.rotate(rotation, resample=resampling, expand=True)
        
    return mockup

def draw_mixed_line(draw, fonts, y, line_parts, canvas_w=1080, align="center"):
    """Draws a line with mixed formatting, highlighting bold phrases in emerald green."""
    widths = []
    total_w = 0
    for text, style in line_parts:
        font = fonts[style]
        try:
            left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
            w = right - left
        except AttributeError:
            w, _ = draw.textsize(text, font=font)
        widths.append(w)
        total_w += w
        
    if align == "center":
        start_x = (canvas_w - total_w) // 2
    else:
        start_x = 100
        
    current_x = start_x
    for i, (text, style) in enumerate(line_parts):
        font = fonts[style]
        color = (0, 204, 106, 255) if style == "bold" else (232, 231, 225, 255)
        draw.text((current_x, y), text, font=font, fill=color)
        current_x += widths[i]

def draw_multiline_subtitle(draw, font, text, start_y, canvas_w=1080, margin=120):
    """Wraps and centers descriptions on screen, using generous margins to keep it elegant."""
    words = text.split(" ")
    lines = []
    current_line = []
    
    max_w = canvas_w - 2 * margin
    
    for word in words:
        test_line = " ".join(current_line + [word])
        try:
            left, top, right, bottom = draw.textbbox((0, 0), test_line, font=font)
            w = right - left
        except AttributeError:
            w, _ = draw.textsize(test_line, font=font)
            
        if w < max_w:
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
        
    current_y = start_y
    for line in lines:
        try:
            left, top, right, bottom = draw.textbbox((0, 0), line, font=font)
            w = right - left
        except AttributeError:
            w, _ = draw.textsize(line, font=font)
        start_x = (canvas_w - w) // 2
        draw.text((start_x, current_y), line, font=font, fill=(154, 153, 147, 255))
        current_y += 44

def main():
    print("Generating continuous wide background canvas...")
    # 1. Create a wide canvas of size 5400x1920 (5 screens combined side by side)
    wide_canvas = Image.new("RGBA", (5400, 1920), (20, 20, 18, 255))
    
    # 2. Combine multiple overlapping radial glow spots along the canvas width (softer intensity for elegance)
    glow_mask_wide = Image.new("L", (5400, 1920), 0)
    for cx, cy in [(540, 1200), (1800, 1000), (3100, 1300), (4500, 1100)]:
        glow_spot_canvas = Image.new("L", (5400, 1920), 0)
        glow_spot = create_radial_glow_mask(2048, 2048, radius_ratio=0.6, intensity=0.45)
        glow_spot_canvas.paste(glow_spot, (cx - 1024, cy - 1024))
        glow_mask_wide = ImageChops.lighter(glow_mask_wide, glow_spot_canvas)
        
    glow_color_img = Image.new("RGBA", (5400, 1920), (0, 50, 25, 255))
    wide_canvas = Image.composite(glow_color_img, wide_canvas, glow_mask_wide)
    
    # 3. Draw thin, refined continuous trendline curve (opacity 40% to be clean and non-distracting)
    glow_img = Image.new("RGBA", (5400, 1920), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    
    color = (0, 204, 106, 75)  # Soft green
    for x in range(0, 5400, 4):
        y1 = get_wave_y(x)
        y2 = get_wave_y(x + 4)
        glow_draw.line([(x, y1), (x + 4, y2)], fill=color, width=3)
            
    # Draw connection nodes (small minimalist dots) at the center of each screen
    for i in range(5):
        cx = i * 1080 + 540
        cy = int(get_wave_y(cx))
        # Small elegant dot
        glow_draw.ellipse([(cx - 8, cy - 8), (cx + 8, cy + 8)], fill=(0, 204, 106, 180))
        glow_draw.ellipse([(cx - 4, cy - 4), (cx + 4, cy + 4)], fill=(255, 255, 255, 255))
        
    wide_canvas = Image.alpha_composite(wide_canvas, glow_img)
    
    # 4. Define screens copy and details (two-line titles for strong visual hierarchy and scan-friendliness)
    # y_shift is adjusted to 70px to bring mockups slightly up and fill space better
    screens = [
        {
            "file": "dashboard.jpeg",
            "out": "1_dashboard.jpg",
            "headline": [
                [("Track your", "regular")],
                [("wealth.", "bold")]
            ],
            "subtitle": "All your accounts, cash, cards, and balances unified at a glance.",
            "rotation": 0,
            "scale": 1.28,
            "y_shift": 70
        },
        {
            "file": "analytics.jpeg",
            "out": "2_analytics.jpg",
            "headline": [
                [("Visualize your", "regular")],
                [("spends & trends", "bold"), (".", "regular")]
            ],
            "subtitle": "Smart category breakdowns and monthly analysis of your cashflow.",
            "rotation": -6,
            "scale": 1.28,
            "y_shift": 70
        },
        {
            "file": "account-details.jpeg",
            "out": "3_accounts.jpg",
            "headline": [
                [("Multi-currency", "regular")],
                [("ledgers", "bold"), (".", "regular")]
            ],
            "subtitle": "Separate accounts for cash, savings, digital wallets, and cards.",
            "rotation": 6,
            "scale": 1.28,
            "y_shift": 70
        },
        {
            "file": "person-details.jpeg",
            "out": "4_splits.jpg",
            "headline": [
                [("Manage shared", "regular")],
                [("splits & debts", "bold"), (".", "regular")]
            ],
            "subtitle": "Keep tabs on group expenses, splits, and informal lending.",
            "rotation": -6,
            "scale": 1.28,
            "y_shift": 70
        },
        {
            "file": "transaction-details.jpeg",
            "out": "5_search.jpg",
            "headline": [
                [("Search &", "regular")],
                [("filter instantly", "bold"), (".", "regular")]
            ],
            "subtitle": "Locate any record with robust multi-select, amount and date filters.",
            "rotation": 0,
            "scale": 1.32,
            "y_shift": 70
        }
    ]
    
    # Load fonts (sizes increased to 68px and 34px to fill the top section beautifully)
    try:
        font_h1 = ImageFont.truetype(FONT_BOLD_PATH, 68)
        font_sub = ImageFont.truetype(FONT_REGULAR_PATH, 34)
    except IOError:
        font_h1 = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        print("Warning: Fonts not found, falling back to default.")
        
    fonts = {"bold": font_h1, "regular": font_h1}
    
    # 5. Process each screen by cropping from wide canvas and compositing overlay mockup + text
    for i, screen in enumerate(screens):
        print(f"Slicing and rendering screen {i+1}/5: {screen['out']}")
        
        # Crop segment from continuous wide canvas
        segment = wide_canvas.crop((i * 1080, 0, (i + 1) * 1080, 1920)).copy()
        
        # Render device mockup
        screenshot_path = os.path.join(IN_DIR, screen["file"])
        mockup = create_device_mockup(screenshot_path, screen["rotation"], screen["scale"])
        if mockup:
            mock_w, mock_h = mockup.size
            mock_x = (1080 - mock_w) // 2
            mock_y = 1260 - mock_h // 2 + screen["y_shift"]
            segment.paste(mockup, (mock_x, mock_y), mockup)
            
        # Draw typography
        segment_draw = ImageDraw.Draw(segment)
        
        # Draw two-line headline (repositioned for visual balance)
        draw_mixed_line(segment_draw, fonts, 150, screen["headline"][0], canvas_w=1080, align="center")
        draw_mixed_line(segment_draw, fonts, 235, screen["headline"][1], canvas_w=1080, align="center")
        
        # Draw subtitle below headlines
        draw_multiline_subtitle(segment_draw, font_sub, screen["subtitle"], 340, canvas_w=1080, margin=110)
        
        # Save as high-quality JPEG
        segment.convert("RGB").save(os.path.join(OUT_DIR, screen["out"]), "JPEG", quality=95)
        print(f"Saved: {screen['out']}")
        
    print("All seamless store screenshots generated successfully!")
    
    # Generate Google Play Store featured graphic
    make_featured_graphic()

def make_featured_graphic():
    print("Generating Google Play Store featured graphic (1024x500)...")
    
    # 1. Base dark canvas
    canvas = Image.new("RGBA", (1024, 500), (20, 20, 18, 255))
    
    # 2. Combine multiple overlapping radial glows (behind text and mockups)
    glow_mask_wide = Image.new("L", (1024, 500), 0)
    
    # Glow Spot 1: Branding area (left)
    glow_spot_left = create_radial_glow_mask(600, 600, radius_ratio=0.6, intensity=0.35)
    glow_mask_wide.paste(glow_spot_left, (200 - 300, 250 - 300))
    
    # Glow Spot 2: Device mockup area (right)
    glow_spot_right = create_radial_glow_mask(800, 800, radius_ratio=0.6, intensity=0.55)
    glow_mask_wide.paste(glow_spot_right, (770 - 400, 250 - 400))
    
    glow_color_img = Image.new("RGBA", (1024, 500), (0, 50, 25, 255))
    canvas = Image.composite(glow_color_img, canvas, glow_mask_wide)
    
    # 3. Draw thin, refined connecting curve behind elements
    glow_img = Image.new("RGBA", (1024, 500), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    color = (0, 204, 106, 50)  # Very soft green line
    
    def get_featured_wave_y(x):
        pts = [(0, 320), (250, 280), (500, 340), (750, 250), (1024, 270)]
        for i in range(len(pts) - 1):
            x1, y1 = pts[i]
            x2, y2 = pts[i+1]
            if x1 <= x <= x2:
                mu = (x - x1) / (x2 - x1)
                mu2 = (1 - math.cos(mu * math.pi)) / 2
                return y1 * (1 - mu2) + y2 * mu2
        return pts[-1][1]
        
    for x in range(0, 1024, 4):
        y1 = get_featured_wave_y(x)
        y2 = get_featured_wave_y(x + 4)
        glow_draw.line([(x, y1), (x + 4, y2)], fill=color, width=2)
        
    canvas = Image.alpha_composite(canvas, glow_img)
    
    # 4. Render and paste overlapping phone mockups on the right side
    # Mockup 1 (Analytics screen, slightly smaller and tilted -8 deg)
    screenshot_1_path = os.path.join(IN_DIR, "analytics.jpeg")
    mockup_1 = create_device_mockup(screenshot_1_path, rotation=-8, scale=0.34)
    if mockup_1:
        w, h = mockup_1.size
        canvas.paste(mockup_1, (690 - w // 2, 250 - h // 2), mockup_1)
        
    # Mockup 2 (Dashboard screen, larger, straight)
    screenshot_2_path = os.path.join(IN_DIR, "dashboard.jpeg")
    mockup_2 = create_device_mockup(screenshot_2_path, rotation=0, scale=0.38)
    if mockup_2:
        w, h = mockup_2.size
        canvas.paste(mockup_2, (840 - w // 2, 250 - h // 2), mockup_2)
        
    # 5. Render brand logo mark (using process_svg and rsvg-convert)
    temp_logo_svg = process_svg("splash-mark.svg")
    temp_logo_png = os.path.join(TEMP_DIR, "temp_featured_logo.png")
    subprocess.run([
        "/opt/homebrew/bin/rsvg-convert",
        "-w", "140",
        "-h", "140",
        temp_logo_svg,
        "-o", temp_logo_png
    ], check=True)
    
    logo_img = Image.open(temp_logo_png).convert("RGBA")
    canvas.paste(logo_img, (100, 100), logo_img)
    
    # Clean up temp logo files
    os.remove(temp_logo_svg)
    os.remove(temp_logo_png)
    if os.path.exists(TEMP_DIR) and not os.listdir(TEMP_DIR):
        os.rmdir(TEMP_DIR)
        
    # 6. Render text
    draw = ImageDraw.Draw(canvas)
    
    try:
        font_logo = ImageFont.truetype(FONT_BOLD_PATH, 56)
        font_h1 = ImageFont.truetype(FONT_BOLD_PATH, 42)
        font_sub = ImageFont.truetype(FONT_REGULAR_PATH, 22)
    except IOError:
        font_logo = ImageFont.load_default()
        font_h1 = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    # Draw Brand Title "Fintraq." beside the logo
    draw.text((260, 132), "Fintraq", font=font_logo, fill=(232, 231, 225, 255))
    try:
        left, top, right, bottom = draw.textbbox((0, 0), "Fintraq", font=font_logo)
        w_brand = right - left
    except AttributeError:
        w_brand, _ = draw.textsize("Fintraq", font=font_logo)
    draw.text((260 + w_brand, 132), ".", font=font_logo, fill=(0, 204, 106, 255))
    
    # Draw headlines
    fonts = {"bold": font_h1, "regular": font_h1}
    draw_mixed_line(draw, fonts, 275, [("Track wealth", "bold")], canvas_w=1024, align="left")
    draw_mixed_line(draw, fonts, 335, [("simply", "bold"), (".", "regular")], canvas_w=1024, align="left")
    
    # Draw description
    draw.text((100, 395), "Unified personal finance ledger.", font=font_sub, fill=(154, 153, 147, 255))
    
    # Save the featured graphic
    canvas.convert("RGB").save(os.path.join(OUT_DIR, "featured_graphic.jpg"), "JPEG", quality=95)
    print(f"Saved featured graphic: featured_graphic.jpg")

if __name__ == "__main__":
    main()
