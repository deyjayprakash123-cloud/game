import os
from PIL import Image, ImageDraw

def create_powerup_block_64():
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-Bit High-Tech Runic Mechanical Palette
    # Dark steel mechanical casing
    CASING_SHADOW = (18, 22, 32, 255)  # Deep gunmetal shadow
    CASING_DARK   = (34, 40, 56, 255)  # Heavy steel frame
    CASING_MID    = (60, 70, 94, 255)  # Brushed dark titanium
    CASING_LIGHT  = (108, 122, 156, 255)# Beveled outer rim
    CASING_HI     = (172, 188, 220, 255)# Corner glint / metallic edge
    RIVET_BOLT    = (225, 238, 255, 255)# Specular steel rivet

    # Recessed inner chamber
    INNER_BLACK   = (10, 13, 20, 255)  # Dark recessed screen / void
    INNER_DARK    = (16, 24, 38, 255)  # Sub-surface shadow

    # Illuminated Bright Blue/Cyan Upward Arrow & Runic Energy
    GLOW_DEEP     = (8, 64, 96, 255)   # Ambient cyan energy glow
    GLOW_DARK     = (14, 116, 160, 255)# Cyan energy conduit
    GLOW_MID      = (22, 178, 222, 255)# Radiant neon cyan
    GLOW_LIGHT    = (56, 225, 255, 255)# Bright electric cyan face
    GLOW_CORE     = (180, 246, 255, 255)# Overcharged plasma rim
    GLOW_PING     = (255, 255, 255, 255)# Pure white core photon ping

    # Transparent background
    grid = [[(0, 0, 0, 0) for _ in range(logical_size)] for _ in range(logical_size)]

    def px(x, y, color):
        if 0 <= x < logical_size and 0 <= y < logical_size:
            grid[y][x] = color

    # -------------------------------------------------------------
    # 1. DARK STEEL MECHANICAL CASING (Cols 1 to 14, Rows 1 to 14)
    # Beveled outer armor plating with bolted corner brackets
    # -------------------------------------------------------------
    for y in range(1, 15):
        for x in range(1, 15):
            grid[y][x] = CASING_MID

    # Outer bevel lighting (Light source from top-left)
    for x in range(1, 15):
        grid[1][x] = CASING_LIGHT
        grid[14][x] = CASING_SHADOW
    for y in range(1, 15):
        grid[y][1] = CASING_LIGHT
        grid[y][14] = CASING_SHADOW

    # Chamfered corner cuts
    grid[1][1] = CASING_HI
    grid[1][14] = CASING_DARK
    grid[14][1] = CASING_DARK
    grid[14][14] = CASING_SHADOW

    # Corner Steel Bracket Bolts / Rivets
    px(2, 2, RIVET_BOLT); px(3, 2, CASING_LIGHT); px(2, 3, CASING_LIGHT)
    px(13, 2, RIVET_BOLT); px(12, 2, CASING_LIGHT); px(13, 3, CASING_DARK)
    px(2, 13, RIVET_BOLT); px(3, 13, CASING_DARK); px(2, 12, CASING_LIGHT)
    px(13, 13, RIVET_BOLT); px(12, 13, CASING_SHADOW); px(13, 12, CASING_SHADOW)

    # -------------------------------------------------------------
    # 2. RECESSED INNER POWER CHAMBER (Cols 3 to 12, Rows 3 to 12)
    # Dark void panel housing the illuminated runic mechanism
    # -------------------------------------------------------------
    for y in range(3, 13):
        for x in range(3, 13):
            grid[y][x] = INNER_BLACK

    # Inner recessed bevel drop
    for x in range(3, 13):
        grid[3][x] = CASING_SHADOW
        grid[12][x] = CASING_DARK
    for y in range(3, 13):
        grid[y][3] = CASING_SHADOW
        grid[y][12] = CASING_DARK

    # Runic Circuit Lines (Embossed in corners)
    runic_circuits = [
        (4, 4, GLOW_DARK), (5, 4, GLOW_DEEP), (4, 5, GLOW_DEEP),
        (11, 4, GLOW_DARK), (10, 4, GLOW_DEEP), (11, 5, GLOW_DEEP),
        (4, 11, GLOW_DARK), (5, 11, GLOW_DEEP), (4, 10, GLOW_DEEP),
        (11, 11, GLOW_DARK), (10, 11, GLOW_DEEP), (11, 10, GLOW_DEEP)
    ]
    for rx, ry, rcol in runic_circuits:
        px(rx, ry, rcol)

    # -------------------------------------------------------------
    # 3. ILLUMINATED BRIGHT BLUE/CYAN UPWARD ARROW ICON
    # Sharp multi-tiered geometric arrow with glowing core & pings
    # -------------------------------------------------------------
    # Arrow Ambient Glow Halo
    arrow_halo = [
        (7, 3), (8, 3),
        (6, 4), (9, 4),
        (5, 5), (10, 5),
        (4, 6), (11, 6),
        (3, 7), (12, 7),
        (5, 7), (10, 7),
        (5, 8), (10, 8),
        (5, 9), (10, 9),
        (5, 10), (10, 10),
        (6, 11), (9, 11),
        (7, 12), (8, 12)
    ]
    for hx, hy in arrow_halo:
        px(hx, hy, GLOW_DEEP)

    # Outer Cyan Energy Shell
    arrow_outer = [
        (7, 4), (8, 4),
        (6, 5), (7, 5), (8, 5), (9, 5),
        (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6),
        (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7), (11, 7),
        # Arrow Stem (Rows 8 to 11, Cols 6 to 9)
        (6, 8), (7, 8), (8, 8), (9, 8),
        (6, 9), (7, 9), (8, 9), (9, 9),
        (6, 10), (7, 10), (8, 10), (9, 10),
        (6, 11), (7, 11), (8, 11), (9, 11)
    ]
    for ox, oy in arrow_outer:
        px(ox, oy, GLOW_MID)

    # Inner Radiant Electric Face
    arrow_face = [
        (7, 4), (8, 4),
        (7, 5), (8, 5),
        (6, 6), (7, 6), (8, 6), (9, 6),
        (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7),
        (7, 8), (8, 8),
        (7, 9), (8, 9),
        (7, 10), (8, 10),
        (7, 11), (8, 11)
    ]
    for fx, fy in arrow_face:
        px(fx, fy, GLOW_LIGHT)

    # Core Overcharged Plasma & Pure White Pings
    arrow_core = [
        (7, 5, GLOW_CORE), (8, 5, GLOW_CORE),
        (7, 6, GLOW_PING), (8, 6, GLOW_PING), # Arrowhead center glint
        (7, 7, GLOW_CORE), (8, 7, GLOW_CORE),
        (7, 8, GLOW_PING), (8, 8, GLOW_PING),
        (7, 9, GLOW_CORE), (8, 9, GLOW_CORE),
        (7, 10, GLOW_PING), (8, 10, GLOW_CORE)
    ]
    for cx, cy, ccol in arrow_core:
        px(cx, cy, ccol)

    # Arrow Apex Tip Spark
    px(7, 3, GLOW_LIGHT)
    px(8, 3, GLOW_LIGHT)
    px(7, 4, GLOW_PING)
    px(8, 4, GLOW_PING)

    # -------------------------------------------------------------
    # 4. RENDER CRISP 64x64 SPRITE
    # -------------------------------------------------------------
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for y in range(logical_size):
        for x in range(logical_size):
            col = grid[y][x]
            if col[3] > 0:
                draw.rectangle(
                    [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                    fill=col
                )

    # Save target in blocks
    target_path = "public/assets/blocks/upgrade.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 power-up block sprite to {target_path}")

    # Also save to root
    img.save("powerup_block_64.png", "PNG")
    print("Saved powerup_block_64.png to root.")

if __name__ == "__main__":
    create_powerup_block_64()

