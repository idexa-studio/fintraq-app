import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageChops

PROJECT_DIR = "/Users/ahmed/Documents/Projects/ReactNative/luno-react-native"
IN_DIR = os.path.join(PROJECT_DIR, "assets", "brand", "screenshots", "in")
OUT_DIR = os.path.join(PROJECT_DIR, "assets", "brand", "screenshots", "out")
FONT_BOLD_PATH = os.path.join(PROJECT_DIR, "assets", "fonts", "MuseoModerno", "MuseoModerno-Bold.ttf")
FONT_REGULAR_PATH = os.path.join(PROJECT_DIR, "assets", "fonts", "MuseoModerno", "MuseoModerno-Medium.ttf")

os.makedirs(OUT_DIR, exist_ok=True)

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

if __name__ == "__main__":
    main()
