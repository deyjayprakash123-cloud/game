import os
from PIL import Image, ImageDraw

def create_diamond_pickaxe_128():
    width, height = 128, 128
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 32x32 logical pixel grid scaled by 4 = 128x128 px
    scale = 4

    def px(x, y, color):
        draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

    # 16-Bit Obsidian Glass & Luminous Cyan Gemstone Palette
    # Obsidian / reinforced titanium shaft
    OBSIDIAN_DARK   = (18, 14, 26, 255)  # Pitch black obsidian shadow
    OBSIDIAN_BASE   = (38, 30, 52, 255)  # Deep violet volcanic glass
    OBSIDIAN_MID    = (64, 50, 84, 255)  # Polished obsidian body
    OBSIDIAN_LIGHT  = (102, 82, 132, 255)# Glassy purple reflective bevel
    OBSIDIAN_SHINE  = (156, 132, 196, 255)# Sharp facet sheen

    # Titanium bands & cyan energy channels along handle
    FITTING_DARK    = (28, 34, 46, 255)
    FITTING_MID     = (72, 86, 110, 255)
    FITTING_LIGHT   = (136, 160, 196, 255)
    GEM_INLAY       = (34, 211, 238, 255) # Glowing cyan inlay

    # Luminous Cyan Gemstone Head (Faceted crystalline diamond)
    GEM_DEEP_SHADOW = (8, 54, 72, 255)   # Deepest refraction shadow
    GEM_SHADOW      = (14, 102, 128, 255)# Deep cyan crystal facet
    GEM_BASE        = (20, 154, 186, 255)# Pure vibrant cyan
    GEM_MID         = (34, 211, 238, 255)# Luminous electric diamond
    GEM_LIGHT       = (165, 243, 252, 255)# Pale cyan crystal facet highlight
    GEM_PING        = (255, 255, 255, 255)# Pure white crystalline specular ping

    # -------------------------------------------------------------
    # 1. OBSIDIAN / REINFORCED TITANIUM SHAFT
    # Diagonal 45 degrees, line from (6, 25) to (19, 12)
    # -------------------------------------------------------------
    for i in range(15):
        hx = 6 + i
        hy = 25 - i

        # Reinforced titanium bands with embedded glowing cyan conduit at i=3, i=7, i=11
        if i in [3, 7, 11]:
            px(hx + 1, hy, FITTING_DARK)
            px(hx, hy + 1, FITTING_DARK)
            px(hx, hy, GEM_INLAY)          # Glowing gem inlay in band
            px(hx - 1, hy, FITTING_MID)
            px(hx - 1, hy - 1, FITTING_LIGHT)
        else:
            # Polished dark violet obsidian glass
            px(hx + 1, hy, OBSIDIAN_DARK)
            px(hx, hy + 1, OBSIDIAN_DARK)
            px(hx, hy, OBSIDIAN_MID)
            px(hx - 1, hy, OBSIDIAN_BASE)
            px(hx - 1, hy - 1, OBSIDIAN_LIGHT)

            # Occasional sharp glass reflection
            if i in [5, 9]:
                px(hx - 1, hy - 1, OBSIDIAN_SHINE)

    # Faceted obsidian pommel butt with titanium bracket
    px(5, 26, OBSIDIAN_DARK)
    px(6, 26, FITTING_MID)
    px(5, 25, OBSIDIAN_LIGHT)
    px(4, 25, OBSIDIAN_DARK)
    px(4, 26, OBSIDIAN_SHINE)

    # -------------------------------------------------------------
    # 2. LUMINOUS CYAN CRYSTAL HEAD (Faceted Gemstone Geometry)
    # Center socket at (20, 11)
    # Sweeping from upper-left crystal spike (11, 4) to lower-right chisel spike (28, 19)
    # -------------------------------------------------------------

    # Left Crystal Pick Horn
    # Sharp apex point (11, 4)
    px(10, 4, GEM_DEEP_SHADOW)
    px(11, 4, GEM_PING) # Specular white ping
    px(11, 5, GEM_DEEP_SHADOW)

    left_blade = [
        # Faceted crystal tip
        (12, 4, GEM_LIGHT), (12, 5, GEM_MID),  (12, 6, GEM_SHADOW),
        (13, 5, GEM_LIGHT), (13, 6, GEM_MID),  (13, 7, GEM_DEEP_SHADOW),
        # Geometric diamond facets (alternating light/shadow planes)
        (14, 5, GEM_PING),  (14, 6, GEM_LIGHT),(14, 7, GEM_BASE), (14, 8, GEM_SHADOW),
        (15, 6, GEM_LIGHT), (15, 7, GEM_MID),  (15, 8, GEM_SHADOW), (15, 9, GEM_DEEP_SHADOW),
        (16, 6, GEM_PING),  (16, 7, GEM_LIGHT),(16, 8, GEM_MID),  (16, 9, GEM_BASE), (16, 10, GEM_SHADOW),
        (17, 7, GEM_LIGHT), (17, 8, GEM_LIGHT),(17, 9, GEM_MID),  (17, 10, GEM_BASE),
        (18, 7, GEM_PING),  (18, 8, GEM_LIGHT),(18, 9, GEM_MID),  (18, 10, GEM_SHADOW),
        (19, 8, GEM_LIGHT), (19, 9, GEM_BASE), (19, 10, GEM_SHADOW)
    ]
    for bx, by, col in left_blade:
        px(bx, by, col)

    # Luminous Central Gemstone Socket & Titanium Bracket
    socket_block = [
        (19, 7, GEM_LIGHT),  (20, 7, GEM_PING),   (21, 8, GEM_LIGHT),
        (20, 8, GEM_LIGHT),  (20, 9, GEM_MID),    (20, 10, GEM_BASE), (20, 11, GEM_SHADOW), (20, 12, GEM_DEEP_SHADOW),
        (21, 9, GEM_LIGHT),  (21, 10, GEM_MID),   (21, 11, GEM_BASE), (21, 12, GEM_SHADOW),
        (22, 9, GEM_LIGHT),  (22, 10, GEM_BASE),  (22, 11, GEM_SHADOW),(22, 12, GEM_DEEP_SHADOW)
    ]
    for bx, by, col in socket_block:
        px(bx, by, col)

    # Right Crystal Pick Horn
    right_blade = [
        (23, 10, GEM_LIGHT), (23, 11, GEM_MID),  (23, 12, GEM_BASE), (23, 13, GEM_SHADOW),
        (24, 11, GEM_PING),  (24, 12, GEM_LIGHT),(24, 13, GEM_MID),  (24, 14, GEM_DEEP_SHADOW),
        (25, 12, GEM_LIGHT), (25, 13, GEM_LIGHT),(25, 14, GEM_MID),  (25, 15, GEM_SHADOW),
        (26, 13, GEM_PING),  (26, 14, GEM_LIGHT),(26, 15, GEM_BASE), (26, 16, GEM_DEEP_SHADOW),
        (27, 15, GEM_LIGHT), (27, 16, GEM_MID),  (27, 17, GEM_BASE), (27, 18, GEM_SHADOW)
    ]
    for bx, by, col in right_blade:
        px(bx, by, col)

    # Right Chisel Crystal Tip (28, 18)
    px(28, 17, GEM_LIGHT)
    px(28, 18, GEM_PING) # Specular white ping
    px(29, 18, GEM_DEEP_SHADOW)
    px(28, 19, GEM_DEEP_SHADOW)

    # -------------------------------------------------------------
    # 3. FACET RIDGE LINES & SPECULAR PIXEL PINGS
    # Intense diamond glints along sharp refractive crystal ridges
    # -------------------------------------------------------------
    crystal_pings = [
        # Piercing tip glints
        (11, 4, GEM_PING),
        (28, 18, GEM_PING),

        # Upper ridge specular sparkle pings
        (13, 5, GEM_PING),
        (16, 6, GEM_PING),
        (20, 7, GEM_PING), # Crown peak
        (24, 11, GEM_PING),
        (26, 13, GEM_PING),

        # Facet intersection stars (secondary internal glints)
        (17, 8, GEM_PING),
        (21, 9, GEM_PING),
        (25, 13, GEM_PING)
    ]
    for px_x, px_y, pcol in crystal_pings:
        px(px_x, px_y, pcol)

    # -------------------------------------------------------------
    # 4. REINFORCED OBSIDIAN-TO-CRYSTAL MOUNT COLLAR
    # High-tech titanium socket clamps wrapping the diamond head
    # -------------------------------------------------------------
    collar_clamps = [
        (19, 11, FITTING_MID),
        (20, 11, FITTING_LIGHT),
        (21, 11, FITTING_MID),
        (22, 12, FITTING_DARK),
        (20, 9, GEM_PING), # Center diamond socket prism
        (21, 10, FITTING_LIGHT)
    ]
    for cx, cy, col in collar_clamps:
        px(cx, cy, col)

    # -------------------------------------------------------------
    # 5. SAVE OUTPUTS
    # -------------------------------------------------------------
    target_path = "public/assets/pickaxes/pickaxe_diamond.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Generated 128x128 diamond pickaxe at {target_path}")

    # Also save to root
    img.save("pickaxe_diamond_128.png", "PNG")
    print("Generated pickaxe_diamond_128.png in root.")

if __name__ == "__main__":
    create_diamond_pickaxe_128()

