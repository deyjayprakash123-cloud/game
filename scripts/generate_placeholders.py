"""
Placeholder Asset Generator for Falling Pickaxe Game.
Generates genuine, crisp retro pixel-art PNG images for all game objects.
"""
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def create_pixel_grid(width, height, scale=4):
    """Creates an image with enlarged pixel resolution for authentic pixel art."""
    return Image.new("RGBA", (width * scale, height * scale), (0, 0, 0, 0)), scale

def draw_pixel(draw, x, y, color, scale):
    draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

# ----------------------------------------------------
# 1. PICKAXES (4 Tiers)
# ----------------------------------------------------
def generate_pickaxes():
    tiers = [
        ("wood", (150, 95, 50), (190, 130, 80), (105, 60, 30), (170, 120, 60), (120, 75, 40)),
        ("stone", (140, 140, 145), (195, 195, 200), (90, 90, 95), (150, 100, 55), (100, 65, 35)),
        ("iron", (210, 220, 235), (250, 255, 255), (130, 140, 160), (145, 95, 50), (95, 60, 30)),
        ("diamond", (30, 220, 230), (160, 255, 255), (15, 140, 160), (45, 60, 90), (25, 35, 55))
    ]
    
    # 24x24 logical pixel grid scaled by 3 -> 72x72 px
    for name, head_main, head_hi, head_dark, handle_main, handle_dark in tiers:
        size = 24
        scale = 3
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Diagonal handle from (5, 19) to (16, 8)
        for i in range(14):
            hx = 5 + i
            hy = 19 - i
            draw_pixel(draw, hx, hy, handle_main, scale)
            draw_pixel(draw, hx - 1, hy, handle_dark, scale)
            draw_pixel(draw, hx, hy + 1, handle_dark, scale)
        
        # Curved Head / Blade
        # Symmetrical arc centered at (17, 7)
        head_coords = [
            # Top-left blade tip & curve
            (11, 4, head_dark), (12, 4, head_main), (13, 5, head_main), (14, 5, head_hi),
            (15, 6, head_main), (16, 6, head_hi), (17, 7, head_hi),
            # Bottom-right blade tip & curve
            (18, 8, head_main), (19, 8, head_dark), (20, 9, head_main), (21, 10, head_main),
            (21, 11, head_dark), (20, 12, head_dark),
            # Thicker head center & socket
            (16, 7, head_main), (17, 6, head_main), (18, 7, head_dark), (17, 8, head_dark),
            (15, 5, head_hi), (18, 9, head_main), (19, 10, head_dark),
            # Tips
            (10, 3, head_hi), (9, 3, head_dark), (22, 12, head_hi), (22, 13, head_dark)
        ]
        
        for hx, hy, col in head_coords:
            draw_pixel(draw, hx, hy, col, scale)
            
        # Add head outline / highlight
        draw_pixel(draw, 10, 4, head_dark, scale)
        draw_pixel(draw, 21, 12, head_dark, scale)
        
        path = f"assets/pickaxes/pickaxe_{name}.png"
        ensure_dir(path)
        img.save(path, "PNG")
        print(f"Generated {path}")

# ----------------------------------------------------
# 2. BLOCKS (Basic & Ores & Specials)
# ----------------------------------------------------
def draw_block_base(draw, size, scale, bg_color, border_hi, border_dark, noise_colors=None):
    # Fill background
    for y in range(size):
        for x in range(size):
            # Default fill
            c = bg_color
            if noise_colors:
                # Deterministic pseudo noise
                seed = (x * 37 + y * 91) % 100
                if seed < 15:
                    c = noise_colors[0]
                elif seed > 85:
                    c = noise_colors[1]
            draw_pixel(draw, x, y, c, scale)
            
    # Beveled edges (top & left highlight, bottom & right shadow)
    for x in range(size):
        draw_pixel(draw, x, 0, border_hi, scale)
        draw_pixel(draw, x, size - 1, border_dark, scale)
    for y in range(size):
        draw_pixel(draw, 0, y, border_hi, scale)
        draw_pixel(draw, size - 1, y, border_dark, scale)

def generate_blocks():
    size = 16
    scale = 4  # 16x16 scaled by 4 = 64x64 px standard block size
    
    # Standard Blocks
    blocks_def = {
        "dirt": {
            "bg": (134, 88, 48),
            "hi": (166, 115, 68),
            "dark": (92, 58, 30),
            "noise": [(110, 72, 38), (150, 102, 58)]
        },
        "stone": {
            "bg": (125, 125, 130),
            "hi": (165, 165, 172),
            "dark": (80, 80, 85),
            "noise": [(105, 105, 110), (145, 145, 150)]
        },
        "hard_stone": {
            "bg": (70, 72, 85),
            "hi": (105, 108, 125),
            "dark": (45, 46, 56),
            "noise": [(58, 60, 70), (85, 88, 100)]
        },
        "unbreakable": {
            "bg": (35, 30, 45),
            "hi": (75, 65, 95),
            "dark": (18, 15, 25),
            "noise": [(25, 20, 32), (50, 42, 65)]
        }
    }
    
    for name, data in blocks_def.items():
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_block_base(draw, size, scale, data["bg"], data["hi"], data["dark"], data["noise"])
        
        # Extra details for hard_stone: reinforced metal rivet corner bolts
        if name == "hard_stone":
            rivets = [(2, 2), (13, 2), (2, 13), (13, 13)]
            for rx, ry in rivets:
                draw_pixel(draw, rx, ry, (160, 165, 180), scale)
                draw_pixel(draw, rx + 1, ry + 1, (30, 32, 40), scale)
                
        # Unbreakable: bedrock fissures
        if name == "unbreakable":
            for (fx, fy) in [(4, 4), (5, 5), (6, 5), (7, 6), (10, 8), (11, 9), (12, 10), (9, 11), (8, 12)]:
                draw_pixel(draw, fx, fy, (95, 40, 120), scale)
                draw_pixel(draw, fx + 1, fy, (140, 70, 180), scale)
                
        path = f"assets/blocks/{name}.png"
        ensure_dir(path)
        img.save(path, "PNG")
        print(f"Generated {path}")

    # Ore Blocks (Embedded in Stone)
    ores = {
        "copper_ore": {
            "gem_main": (215, 110, 50),
            "gem_hi": (255, 170, 100),
            "gem_dark": (145, 65, 25)
        },
        "gold_ore": {
            "gem_main": (245, 205, 35),
            "gem_hi": (255, 245, 140),
            "gem_dark": (175, 135, 15)
        },
        "diamond_ore": {
            "gem_main": (35, 220, 235),
            "gem_hi": (190, 255, 255),
            "gem_dark": (15, 140, 160)
        },
        "emerald_ore": {
            "gem_main": (30, 215, 75),
            "gem_hi": (160, 255, 180),
            "gem_dark": (10, 135, 45)
        }
    }
    
    stone_data = blocks_def["stone"]
    for ore_name, colors in ores.items():
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_block_base(draw, size, scale, stone_data["bg"], stone_data["hi"], stone_data["dark"], stone_data["noise"])
        
        # Ore nugget clusters
        clusters = [
            [(4, 4), (5, 4), (4, 5), (5, 5), (6, 5)],
            [(10, 3), (11, 3), (11, 4), (12, 4)],
            [(3, 11), (4, 11), (4, 12)],
            [(9, 9), (10, 9), (10, 10), (11, 10), (9, 10)],
            [(12, 11), (13, 11)]
        ]
        for cluster in clusters:
            for idx, (ox, oy) in enumerate(cluster):
                col = colors["gem_main"]
                if idx == 0:
                    col = colors["gem_hi"]
                elif idx == len(cluster) - 1:
                    col = colors["gem_dark"]
                draw_pixel(draw, ox, oy, col, scale)
                
        path = f"assets/blocks/{ore_name}.png"
        ensure_dir(path)
        img.save(path, "PNG")
        print(f"Generated {path}")

    # Special Blocks
    # 1. TNT
    img_tnt = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d_tnt = ImageDraw.Draw(img_tnt)
    draw_block_base(d_tnt, size, scale, (190, 40, 30), (230, 80, 65), (130, 20, 15))
    # TNT middle white label band
    for y in range(5, 11):
        for x in range(1, 15):
            draw_pixel(d_tnt, x, y, (240, 240, 240), scale)
    # TNT pixel text in center
    # 'T'
    for x in [2, 3, 4]: draw_pixel(d_tnt, x, 6, (20, 20, 20), scale)
    for y in [7, 8, 9]: draw_pixel(d_tnt, 3, y, (20, 20, 20), scale)
    # 'N'
    for y in range(6, 10): 
        draw_pixel(d_tnt, 6, y, (20, 20, 20), scale)
        draw_pixel(d_tnt, 9, y, (20, 20, 20), scale)
    draw_pixel(d_tnt, 7, 7, (20, 20, 20), scale)
    draw_pixel(d_tnt, 8, 8, (20, 20, 20), scale)
    # 'T'
    for x in [11, 12, 13]: draw_pixel(d_tnt, x, 6, (20, 20, 20), scale)
    for y in [7, 8, 9]: draw_pixel(d_tnt, 12, y, (20, 20, 20), scale)
    img_tnt.save("assets/blocks/tnt.png", "PNG")
    print("Generated assets/blocks/tnt.png")

    # 2. Repair Block
    img_rep = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d_rep = ImageDraw.Draw(img_rep)
    draw_block_base(d_rep, size, scale, (30, 120, 60), (60, 180, 100), (15, 70, 35))
    # Green Cross
    for y in range(4, 12):
        for x in range(7, 9):
            draw_pixel(d_rep, x, y, (240, 255, 240), scale)
    for x in range(4, 12):
        for y in range(7, 9):
            draw_pixel(d_rep, x, y, (240, 255, 240), scale)
    # Heart center
    draw_pixel(d_rep, 7, 7, (255, 80, 100), scale)
    draw_pixel(d_rep, 8, 7, (255, 80, 100), scale)
    img_rep.save("assets/blocks/repair.png", "PNG")
    print("Generated assets/blocks/repair.png")

    # 3. Upgrade Block
    img_up = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d_up = ImageDraw.Draw(img_up)
    draw_block_base(d_up, size, scale, (140, 90, 20), (220, 170, 50), (80, 45, 10))
    # Upward glowing arrow
    arrow_pixels = [
        (7, 3), (8, 3),
        (6, 4), (7, 4), (8, 4), (9, 4),
        (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5),
        (4, 6), (5, 6), (10, 6), (11, 6),
        (7, 6), (8, 6),
        (7, 7), (8, 7),
        (7, 8), (8, 8),
        (7, 9), (8, 9),
        (7, 10), (8, 10),
        (7, 11), (8, 11),
        (7, 12), (8, 12)
    ]
    for ax, ay in arrow_pixels:
        draw_pixel(d_up, ax, ay, (255, 240, 120), scale)
    img_up.save("assets/blocks/upgrade.png", "PNG")
    print("Generated assets/blocks/upgrade.png")

    # 4. Bounce Block
    img_bnc = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d_bnc = ImageDraw.Draw(img_bnc)
    draw_block_base(d_bnc, size, scale, (150, 40, 170), (210, 90, 235), (90, 20, 105))
    # Spring / coil visual
    spring_coords = [
        (4, 12), (5, 12), (6, 12), (7, 12), (8, 12), (9, 12), (10, 12), (11, 12),
        (4, 10), (5, 9), (6, 10), (7, 11), (8, 10), (9, 9), (10, 10), (11, 11),
        (4, 7), (5, 6), (6, 7), (7, 8), (8, 7), (9, 6), (10, 7), (11, 8),
        (4, 4), (5, 4), (6, 4), (7, 4), (8, 4), (9, 4), (10, 4), (11, 4)
    ]
    for sx, sy in spring_coords:
        draw_pixel(d_bnc, sx, sy, (255, 210, 60), scale)
    img_bnc.save("assets/blocks/bounce.png", "PNG")
    print("Generated assets/blocks/bounce.png")

# ----------------------------------------------------
# 3. EFFECTS & PARTICLES
# ----------------------------------------------------
def generate_effects():
    # Spark (16x16)
    img_spark = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d_spark = ImageDraw.Draw(img_spark)
    # Bright center with cross flares
    for y in range(4, 12):
        d_spark.point((8, y), fill=(255, 255, 200, 255))
    for x in range(4, 12):
        d_spark.point((x, 8), fill=(255, 255, 200, 255))
    d_spark.rectangle([6, 6, 9, 9], fill=(255, 255, 255, 255))
    ensure_dir("assets/effects/spark.png")
    img_spark.save("assets/effects/spark.png", "PNG")

    # Explosion smoke (32x32)
    img_smoke = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_smoke = ImageDraw.Draw(img_smoke)
    d_smoke.ellipse([4, 4, 27, 27], fill=(255, 140, 20, 200))
    d_smoke.ellipse([8, 8, 23, 23], fill=(255, 220, 50, 230))
    d_smoke.ellipse([12, 12, 19, 19], fill=(255, 255, 255, 255))
    img_smoke.save("assets/effects/explosion_smoke.png", "PNG")

    # Rock Debris (12x12)
    img_deb = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
    d_deb = ImageDraw.Draw(img_deb)
    d_deb.polygon([(2, 2), (9, 1), (11, 7), (7, 10), (1, 8)], fill=(120, 120, 125))
    d_deb.polygon([(3, 3), (8, 2), (9, 6)], fill=(170, 170, 175))
    img_deb.save("assets/effects/debris_rock.png", "PNG")

    # Wood Debris (12x12)
    img_wood = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
    d_wood = ImageDraw.Draw(img_wood)
    d_wood.polygon([(1, 2), (10, 1), (11, 5), (3, 8)], fill=(140, 85, 45))
    img_wood.save("assets/effects/debris_wood.png", "PNG")

    # Dust (16x16)
    img_dust = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d_dust = ImageDraw.Draw(img_dust)
    d_dust.ellipse([2, 2, 13, 13], fill=(180, 180, 190, 140))
    img_dust.save("assets/effects/dust.png", "PNG")
    print("Generated effects")

# ----------------------------------------------------
# 4. UI ASSETS
# ----------------------------------------------------
def generate_ui():
    # Heart Icon (32x32)
    img_heart = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_heart = ImageDraw.Draw(img_heart)
    scale = 2
    # 16x16 heart
    heart_pixels = [
        (3, 3), (4, 3), (5, 3), (9, 3), (10, 3), (11, 3),
        (2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (8, 4), (9, 4), (10, 4), (11, 4), (12, 4),
        (2, 5), (3, 5), (4, 5), (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5), (11, 5), (12, 5),
        (2, 6), (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6), (11, 6), (12, 6),
        (3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7), (11, 7),
        (4, 8), (5, 8), (6, 8), (7, 8), (8, 8), (9, 8), (10, 8),
        (5, 9), (6, 9), (7, 9), (8, 9), (9, 9),
        (6, 10), (7, 10), (8, 10),
        (7, 11)
    ]
    for hx, hy in heart_pixels:
        draw_pixel(d_heart, hx, hy, (235, 45, 65), scale)
    # Highlight
    draw_pixel(d_heart, 3, 4, (255, 160, 180), scale)
    draw_pixel(d_heart, 4, 4, (255, 255, 255), scale)
    draw_pixel(d_heart, 10, 4, (255, 160, 180), scale)
    ensure_dir("assets/ui/heart_icon.png")
    img_heart.save("assets/ui/heart_icon.png", "PNG")

    # Coin Icon (32x32)
    img_coin = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_coin = ImageDraw.Draw(img_coin)
    d_coin.ellipse([2, 2, 29, 29], fill=(245, 190, 20), outline=(170, 120, 10), width=2)
    d_coin.ellipse([7, 7, 24, 24], fill=(255, 225, 60), outline=(210, 150, 15), width=2)
    # "$" or star in center
    d_coin.rectangle([14, 10, 17, 21], fill=(200, 130, 10))
    img_coin.save("assets/ui/coin_icon.png", "PNG")

    # Depth Icon (Down Arrow) (32x32)
    img_depth = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_depth = ImageDraw.Draw(img_depth)
    d_depth.polygon([(16, 26), (6, 14), (11, 14), (11, 5), (21, 5), (21, 14), (26, 14)], 
                    fill=(80, 200, 255), outline=(20, 90, 150))
    img_depth.save("assets/ui/depth_icon.png", "PNG")

    # Play & Restart Buttons (96x48)
    for btn_name, label, col_bg, col_border in [
        ("btn_play", "DROP", (45, 180, 80), (20, 110, 45)),
        ("btn_restart", "RETRY", (220, 60, 50), (140, 25, 20))
    ]:
        bimg = Image.new("RGBA", (96, 48), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bimg)
        bd.rounded_rectangle([2, 2, 93, 45], radius=8, fill=col_bg, outline=col_border, width=3)
        # Inner highlight
        bd.line([(8, 6), (88, 6)], fill=(255, 255, 255, 150), width=2)
        bimg.save(f"assets/ui/{btn_name}.png", "PNG")
    print("Generated UI assets")

# ----------------------------------------------------
# 5. BACKGROUNDS (Vertical Mine Themes)
# ----------------------------------------------------
def generate_backgrounds():
    # 540x960 responsive background textures
    # Layer 1: Surface entrance (evening twilight gradient with mine entrance scaffolding)
    w, h = 540, 960
    bg1 = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    d1 = ImageDraw.Draw(bg1)
    for y in range(h):
        r = int(25 + (y / h) * 15)
        g = int(20 + (y / h) * 10)
        b = int(40 + (y / h) * 10)
        d1.line([(0, y), (w, y)], fill=(r, g, b, 255))
    ensure_dir("assets/backgrounds/mine_bg_layer1.png")
    bg1.save("assets/backgrounds/mine_bg_layer1.png", "PNG")

    # Layer 2: Cavern brick / rocky texture
    bg2 = Image.new("RGBA", (w, h), (20, 18, 26, 255))
    d2 = ImageDraw.Draw(bg2)
    # Repeat subtle stone rock silhouettes in background
    random.seed(42)
    for _ in range(120):
        rx = random.randint(0, w)
        ry = random.randint(0, h)
        rw = random.randint(30, 90)
        rh = random.randint(20, 60)
        shade = random.randint(24, 38)
        d2.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=4, fill=(shade, shade - 2, shade + 4, 255))
    bg2.save("assets/backgrounds/mine_bg_layer2.png", "PNG")
    print("Generated backgrounds")

if __name__ == "__main__":
    generate_pickaxes()
    generate_blocks()
    generate_effects()
    generate_ui()
    generate_backgrounds()
    print("All placeholder assets successfully generated!")

