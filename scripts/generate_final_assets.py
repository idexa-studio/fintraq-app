import os
from PIL import Image, ImageDraw, ImageChops

PROJECT_DIR = "/Users/ahmed/Documents/Projects/ReactNative/luno-react-native"
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets", "images")

def create_logo_layer(is_monochrome=False):
    # Base logo image (4096 x 4096 transparent)
    img = Image.new("RGBA", (4096, 4096), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Mask image for transparency cutout (ring in monochrome, background elsewhere)
    mask = Image.new("L", (4096, 4096), 255)
    mask_draw = ImageDraw.Draw(mask)
    
    # Colors
    if is_monochrome:
        top_color = (0, 0, 0, 255)
        bottom_color = (0, 0, 0, 255)
        coin_color = (0, 0, 0, 255)
    else:
        top_color = (16, 185, 129, 255)  # Vibrant Emerald (#10B981)
        bottom_color = (6, 95, 70, 255)   # Deep Emerald (#065F46)
        coin_color = (52, 211, 153, 255)  # Mint (#34D399)
        
    # Draw capsules and coin on logo layer
    # Top horizontal bank capsule
    draw.rounded_rectangle(
        (2048 - 850, 1550, 2048 + 850, 2250),
        radius=350,
        fill=top_color
    )
    
    # Bottom horizontal bank capsule
    draw.rounded_rectangle(
        (2048 - 850, 2400, 2048 + 850, 3100),
        radius=350,
        fill=bottom_color
    )
    
    # Descending Coin (Mint)
    cx, cy = 2048, 1200
    r = 340
    draw.ellipse(
        (cx - r, cy - r, cx + r, cy + r),
        fill=coin_color
    )
    
    if is_monochrome:
        # Cutout ring on monochrome (value 0 is transparent)
        # Ring center at cx, cy, radius 240, width 30 (inner 225, outer 255)
        mask_draw.ellipse(
            (cx - 255, cy - 255, cx + 255, cy + 255),
            fill=0
        )
        mask_draw.ellipse(
            (cx - 225, cy - 225, cx + 225, cy + 225),
            fill=255
        )
    else:
        # Draw standard white ring line
        draw.ellipse(
            (cx - 240, cy - 240, cx + 240, cy + 240),
            outline=(255, 255, 255, 255),
            width=30
        )
        
    # Apply mask to alpha channel
    r_ch, g_ch, b_ch, a_ch = img.split()
    final_alpha = ImageChops.multiply(a_ch, mask)
    img.putalpha(final_alpha)
    
    return img

def main():
    print("Generating logo source layers...")
    logo_color = create_logo_layer(is_monochrome=False)
    logo_mono = create_logo_layer(is_monochrome=True)
    
    # Ensure directories exist
    os.makedirs(ASSETS_DIR, exist_ok=True)
    os.makedirs(os.path.join(ASSETS_DIR, "adaptive-icon"), exist_ok=True)
    
    # 1. assets/images/icon.png (1024x1024, Solid White Background)
    print("Generating icon.png...")
    icon_img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    # Resize color logo to 1024x1024 (standard size centered)
    resized_logo = logo_color.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_img.alpha_composite(resized_logo)
    icon_img.save(os.path.join(ASSETS_DIR, "icon.png"), "PNG")
    
    # 2. assets/images/adaptive-icon/foreground.png (1024x1024, Transparent, Safe zone scaled)
    # The logo fits beautifully inside the 675px safe zone circle at standard scaling,
    # but let's downscale it slightly to 90% of full size (~922px canvas size inside 1024x1024)
    # to give extra breathing room for Android launchers.
    print("Generating adaptive-icon/foreground.png...")
    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # Scale logo slightly to 85% to guarantee it fits safely in the center circle
    scaled_logo_w = int(1024 * 0.85)
    scaled_logo_h = int(1024 * 0.85)
    resized_logo_adaptive = logo_color.resize((scaled_logo_w, scaled_logo_h), Image.Resampling.LANCZOS)
    # Paste centered
    offset_x = (1024 - scaled_logo_w) // 2
    offset_y = (1024 - scaled_logo_h) // 2
    foreground.paste(resized_logo_adaptive, (offset_x, offset_y), resized_logo_adaptive)
    foreground.save(os.path.join(ASSETS_DIR, "adaptive-icon", "foreground.png"), "PNG")
    
    # 3. assets/images/adaptive-icon/background.png (1024x1024, Solid White)
    print("Generating adaptive-icon/background.png...")
    background = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    background.save(os.path.join(ASSETS_DIR, "adaptive-icon", "background.png"), "PNG")
    
    # 4. assets/images/android-icon-monochrome.png (1024x1024, Transparent, Monochrome Black)
    print("Generating android-icon-monochrome.png...")
    monochrome = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    resized_logo_mono = logo_mono.resize((scaled_logo_w, scaled_logo_h), Image.Resampling.LANCZOS)
    monochrome.paste(resized_logo_mono, (offset_x, offset_y), resized_logo_mono)
    monochrome.save(os.path.join(ASSETS_DIR, "android-icon-monochrome.png"), "PNG")
    
    # 5. assets/images/splash.png (2048x2048, Transparent Background, Centered logo scaled)
    # Splash logo should be centered and relatively small (~18% of screen width)
    print("Generating splash.png...")
    splash = Image.new("RGBA", (2048, 2048), (0, 0, 0, 0))
    splash_logo_size = 420  # 420x420 centered on 2048x2048
    resized_splash_logo = logo_color.resize((splash_logo_size, splash_logo_size), Image.Resampling.LANCZOS)
    offset_splash_x = (2048 - splash_logo_size) // 2
    offset_splash_y = (2048 - splash_logo_size) // 2
    splash.paste(resized_splash_logo, (offset_splash_x, offset_splash_y), resized_splash_logo)
    splash.save(os.path.join(ASSETS_DIR, "splash.png"), "PNG")
    
    # 6. assets/images/favicon.png (48x48, Transparent)
    print("Generating favicon.png...")
    favicon = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    resized_fav = logo_color.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.alpha_composite(resized_fav)
    favicon.save(os.path.join(ASSETS_DIR, "favicon.png"), "PNG")
    
    print("All assets generated successfully!")

if __name__ == "__main__":
    main()
